import { supabase } from "../lib/supabase";
import https from "https";
import fs from "fs";
import path from "path";
import os from "os";

// --- Jamendo API (CC licensed, good EDM catalog) ---

const JAMENDO_CLIENT_ID = process.env.JAMENDO_CLIENT_ID || "0f73708d";

interface JamendoTrack {
  id: string;
  name: string;
  artist_name: string;
  audio: string;
  audiodownload: string;
  duration: number;
  stats: { rate: { downloads: { total: number } }; listens: { total: number } };
}

// Dubstep-focused tag combos — each entry is used as a Jamendo tag query.
// Jamendo supports "+" for AND (both tags required).
const JAMENDO_TAG_QUERIES = [
  "dubstep",
  "dubstep+edm",
  "dubstep+bass",
  "dubstep+electronic",
  "bass+edm",
  "bass+electronic",
];

async function fetchJamendoMusic(limit: number = 20): Promise<JamendoTrack[]> {
  const tagQuery = JAMENDO_TAG_QUERIES[Math.floor(Math.random() * JAMENDO_TAG_QUERIES.length)];
  const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=${limit}&tags=${tagQuery}&order=popularity_total&audiodlformat=mp31&include=stats&durationbetween=30_120`;

  console.log(`🔍 Searching Jamendo for "${tagQuery}" tracks...`);

  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Jamendo API error: ${response.status} ${response.statusText}`);
    return [];
  }

  const data = (await response.json()) as { results?: JamendoTrack[] };
  return data.results || [];
}

// --- Shared helpers ---

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : require("http");
    const file = fs.createWriteStream(dest);
    proto.get(url, (response: { statusCode?: number; headers: { location?: string }; pipe: (dest: fs.WriteStream) => void }) => {
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

interface NormalizedTrack {
  source: string;
  sourceId: string;
  name: string;
  artistName: string;
  downloadUrl: string;
  duration: number;
  popularityScore: number;
}

function normalizeJamendoTrack(t: JamendoTrack): NormalizedTrack {
  const listens = t.stats?.listens?.total || 0;
  const downloads = t.stats?.rate?.downloads?.total || 0;
  return {
    source: "jamendo",
    sourceId: String(t.id),
    name: t.name,
    artistName: t.artist_name,
    downloadUrl: t.audiodownload || t.audio,
    duration: t.duration,
    popularityScore: listens + (downloads * 10),
  };
}

// --- Purge all music tracks (DB + storage) ---

export async function purgeAllMusic(): Promise<{ deleted: number }> {
  console.log("\n🗑️ === PURGING ALL MUSIC TRACKS ===");

  // Fetch all tracks from DB
  const { data: allTracks, error } = await supabase
    .from("music_tracks")
    .select("id, storage_path");

  if (error) {
    console.error("Failed to fetch tracks for purge:", error);
    throw error;
  }

  if (!allTracks || allTracks.length === 0) {
    console.log("🗑️ No tracks to purge.");
    return { deleted: 0 };
  }

  console.log(`🗑️ Removing ${allTracks.length} tracks from storage and DB...`);

  // Delete files from storage in batches of 50
  const storagePaths = allTracks
    .map((t) => t.storage_path)
    .filter(Boolean) as string[];

  for (let i = 0; i < storagePaths.length; i += 50) {
    const batch = storagePaths.slice(i, i + 50);
    await supabase.storage.from("music").remove(batch);
  }

  // Delete all rows from music_tracks
  const { error: deleteError } = await supabase
    .from("music_tracks")
    .delete()
    .in("id", allTracks.map((t) => t.id));

  if (deleteError) {
    console.error("Failed to delete tracks from DB:", deleteError);
    throw deleteError;
  }

  console.log(`🗑️ Purged ${allTracks.length} tracks.`);
  return { deleted: allTracks.length };
}

// --- Main discovery function ---

export async function discoverMusic(targetCount: number = 10): Promise<{ added: number; skipped: number; errors: number }> {
  console.log(`\n🎵 === MUSIC DISCOVERY ===`);
  console.log(`Target: ${targetCount} new tracks`);

  const { count: existingCount } = await supabase
    .from("music_tracks")
    .select("*", { count: "exact", head: true })
    .eq("used", false);

  const currentUnused = existingCount ?? 0;
  console.log(`📊 Currently ${currentUnused} unused tracks in library`);

  if (currentUnused >= 100) {
    console.log("✅ Library is well-stocked (100+ tracks). Skipping discovery.");
    return { added: 0, skipped: 0, errors: 0 };
  }

  const neededTracks = Math.min(targetCount, 100 - currentUnused);
  console.log(`📥 Need to fetch ${neededTracks} new tracks`);

  // Fetch from Jamendo
  const jamendoTracks = await fetchJamendoMusic(neededTracks * 2).catch((err) => {
    console.error("Jamendo fetch failed:", err);
    return [] as JamendoTrack[];
  });

  const allTracks: NormalizedTrack[] = jamendoTracks.map(normalizeJamendoTrack);

  // Sort by popularity and filter out low-quality tracks
  allTracks.sort((a, b) => b.popularityScore - a.popularityScore);
  const MIN_POPULARITY = 500;
  const qualityTracks = allTracks.filter((t) => t.popularityScore >= MIN_POPULARITY);
  if (qualityTracks.length > 0) {
    allTracks.length = 0;
    allTracks.push(...qualityTracks);
  }

  console.log(`🔍 Found ${jamendoTracks.length} Jamendo candidates`);

  let added = 0;
  let skipped = 0;
  let errors = 0;

  for (const track of allTracks) {
    if (added >= neededTracks) break;

    if (!track.downloadUrl) {
      skipped++;
      continue;
    }

    // Check for duplicates
    const { data: existing } = await supabase
      .from("music_tracks")
      .select("id")
      .eq("source", track.source)
      .eq("source_id", track.sourceId)
      .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    try {
      const safeName = `${track.source}-${track.sourceId}-${track.name.replace(/[^a-zA-Z0-9]/g, "-").substring(0, 40)}.mp3`;
      const tmpPath = path.join(os.tmpdir(), safeName);

      console.log(`📥 [${track.source}] "${track.name}" by ${track.artistName} (score: ${track.popularityScore})`);
      await downloadFile(track.downloadUrl, tmpPath);

      // Verify file size
      const stats = fs.statSync(tmpPath);
      if (stats.size < 50000) {
        console.log(`⚠️ File too small (${stats.size} bytes), skipping`);
        fs.unlinkSync(tmpPath);
        skipped++;
        continue;
      }

      // Upload to Supabase Storage
      const fileBuffer = fs.readFileSync(tmpPath);
      const { error: uploadError } = await supabase.storage
        .from("music")
        .upload(safeName, fileBuffer, {
          contentType: "audio/mpeg",
          upsert: false,
        });

      if (uploadError) {
        console.error(`Upload failed for "${track.name}":`, uploadError);
        fs.unlinkSync(tmpPath);
        errors++;
        continue;
      }

      // Add to database
      const { error: insertError } = await supabase
        .from("music_tracks")
        .insert({
          name: track.name,
          source: track.source,
          source_id: track.sourceId,
          artist_name: track.artistName,
          popularity_score: track.popularityScore,
          duration_seconds: track.duration,
          storage_path: safeName,
        });

      if (insertError) {
        console.error(`DB insert failed for "${track.name}":`, insertError);
        errors++;
      } else {
        added++;
        console.log(`✅ Added: "${track.name}" by ${track.artistName} [${track.source}]`);
      }

      fs.unlinkSync(tmpPath);
    } catch (err) {
      console.error(`Error processing "${track.name}":`, err);
      errors++;
    }
  }

  console.log(`\n🎵 Discovery complete: +${added} added, ${skipped} skipped, ${errors} errors`);
  console.log(`📊 Library now has ${currentUnused + added} unused tracks\n`);

  // Prune the 5 lowest-ranked unused tracks to keep quality high
  await pruneLowestRanked(5);

  return { added, skipped, errors };
}

/**
 * Remove the N lowest-popularity unused tracks from the library.
 * Deletes both the DB record and the file from storage.
 */
async function pruneLowestRanked(count: number): Promise<void> {
  const { data: lowest, error } = await supabase
    .from("music_tracks")
    .select("id, name, artist_name, storage_path, popularity_score")
    .eq("used", false)
    .order("popularity_score", { ascending: true })
    .limit(count);

  if (error || !lowest || lowest.length === 0) return;

  // Only prune if we have more than 20 tracks (don't empty the library)
  const { count: totalUnused } = await supabase
    .from("music_tracks")
    .select("*", { count: "exact", head: true })
    .eq("used", false);

  if ((totalUnused ?? 0) <= 20) {
    console.log("🗑️ Skipping prune — library too small to trim");
    return;
  }

  console.log(`🗑️ Pruning ${lowest.length} lowest-ranked tracks:`);

  for (const track of lowest) {
    // Delete from storage
    if (track.storage_path) {
      await supabase.storage.from("music").remove([track.storage_path]);
    }

    // Delete from database
    await supabase.from("music_tracks").delete().eq("id", track.id);

    console.log(`  🗑️ Removed: "${track.name}" by ${track.artist_name} (score: ${track.popularity_score})`);
  }
}
