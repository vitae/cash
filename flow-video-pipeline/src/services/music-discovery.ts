import { supabase } from "../lib/supabase";
import https from "https";
import fs from "fs";
import path from "path";
import os from "os";

const JAMENDO_CLIENT_ID = process.env.JAMENDO_CLIENT_ID || "b1a113e5";

interface JamendoTrack {
  id: string;
  name: string;
  artist_name: string;
  audio: string;
  audiodownload: string;
  duration: number;
  stats: { rate: { downloads: { total: number } }; listens: { total: number } };
}

// Fetch trending EDM tracks from Jamendo API sorted by popularity
async function fetchTrendingEDM(limit: number = 20): Promise<JamendoTrack[]> {
  const tags = ["edm", "electronic", "dance", "house", "dubstep", "trance", "techno", "bass"];
  const tag = tags[Math.floor(Math.random() * tags.length)];

  const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=${limit}&tags=${tag}&order=popularity_total&audiodlformat=mp31&include=stats&durationbetween=30_120`;

  console.log(`🔍 Searching Jamendo for trending "${tag}" tracks...`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Jamendo API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { results?: JamendoTrack[] };
  return data.results || [];
}

// Download a file from URL to local path
function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirect = response.headers.location;
        if (redirect) {
          file.close();
          fs.unlinkSync(dest);
          downloadFile(redirect, dest).then(resolve).catch(reject);
          return;
        }
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Download failed: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
      file.on("error", reject);
    }).on("error", reject);
  });
}

// Discover new trending EDM tracks and add them to the music library
export async function discoverMusic(targetCount: number = 10): Promise<{ added: number; skipped: number; errors: number }> {
  console.log(`\n🎵 === MUSIC DISCOVERY ===`);
  console.log(`Target: ${targetCount} new tracks`);

  // Check how many unused tracks we already have
  const { count: existingCount } = await supabase
    .from("music_tracks")
    .select("*", { count: "exact", head: true })
    .eq("used", false);

  const currentUnused = existingCount ?? 0;
  console.log(`📊 Currently ${currentUnused} unused tracks in library`);

  if (currentUnused >= 50) {
    console.log("✅ Library is well-stocked (50+ tracks). Skipping discovery.");
    return { added: 0, skipped: 0, errors: 0 };
  }

  const neededTracks = Math.min(targetCount, 50 - currentUnused);
  console.log(`📥 Need to fetch ${neededTracks} new tracks`);

  let added = 0;
  let skipped = 0;
  let errors = 0;

  // Fetch more than needed to account for duplicates
  const tracks = await fetchTrendingEDM(neededTracks * 2);
  console.log(`🔍 Found ${tracks.length} candidates from Jamendo`);

  for (const track of tracks) {
    if (added >= neededTracks) break;

    // Check if we already have this track (by source_id)
    const { data: existing } = await supabase
      .from("music_tracks")
      .select("id")
      .eq("source", "jamendo")
      .eq("source_id", track.id)
      .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    try {
      // Calculate popularity score from Jamendo stats
      const listens = track.stats?.listens?.total || 0;
      const downloads = track.stats?.rate?.downloads?.total || 0;
      const popularityScore = listens + (downloads * 10);

      // Download to temp
      const downloadUrl = track.audiodownload || track.audio;
      if (!downloadUrl) {
        console.log(`⚠️ No download URL for "${track.name}", skipping`);
        skipped++;
        continue;
      }

      const safeName = `jamendo-${track.id}-${track.name.replace(/[^a-zA-Z0-9]/g, "-").substring(0, 40)}.mp3`;
      const tmpPath = path.join(os.tmpdir(), safeName);

      console.log(`📥 Downloading: "${track.name}" by ${track.artist_name} (popularity: ${popularityScore})`);
      await downloadFile(downloadUrl, tmpPath);

      // Verify file size (skip if too small = error page)
      const stats = fs.statSync(tmpPath);
      if (stats.size < 50000) {
        console.log(`⚠️ File too small (${stats.size} bytes), skipping`);
        fs.unlinkSync(tmpPath);
        skipped++;
        continue;
      }

      // Upload to Supabase Storage
      const fileBuffer = fs.readFileSync(tmpPath);
      const storagePath = safeName;

      const { error: uploadError } = await supabase.storage
        .from("music")
        .upload(storagePath, fileBuffer, {
          contentType: "audio/mpeg",
          upsert: false,
        });

      if (uploadError) {
        console.error(`Upload failed for "${track.name}":`, uploadError);
        fs.unlinkSync(tmpPath);
        errors++;
        continue;
      }

      // Add to music_tracks table
      const { error: insertError } = await supabase
        .from("music_tracks")
        .insert({
          name: track.name,
          source: "jamendo",
          source_id: String(track.id),
          artist_name: track.artist_name,
          popularity_score: popularityScore,
          duration_seconds: track.duration,
          storage_path: storagePath,
        });

      if (insertError) {
        console.error(`DB insert failed for "${track.name}":`, insertError);
        errors++;
      } else {
        added++;
        console.log(`✅ Added: "${track.name}" by ${track.artist_name} (score: ${popularityScore})`);
      }

      // Cleanup temp
      fs.unlinkSync(tmpPath);

    } catch (err) {
      console.error(`Error processing "${track.name}":`, err);
      errors++;
    }
  }

  console.log(`\n🎵 Discovery complete: +${added} added, ${skipped} skipped, ${errors} errors`);
  console.log(`📊 Library now has ${currentUnused + added} unused tracks\n`);

  return { added, skipped, errors };
}
