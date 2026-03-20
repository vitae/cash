import { supabase } from "../lib/supabase";
import https from "https";
import fs from "fs";
import path from "path";
import os from "os";

// --- Pixabay Music API (primary — no attribution, free commercial use) ---

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY || "";

interface PixabayTrack {
  id: number;
  title: string;
  user: string;
  duration: number;
  audio_url: string;
  tags: string;
  downloads: number;
  likes: number;
}

const EDM_SEARCHES = [
  "edm", "electronic dance", "house music", "dubstep", "techno",
  "trance", "bass drop", "synth wave", "future bass", "drum and bass",
  "electro", "dance beat", "rave", "club music", "festival",
];

async function fetchPixabayMusic(limit: number = 20): Promise<PixabayTrack[]> {
  if (!PIXABAY_API_KEY) {
    console.log("⚠️ No PIXABAY_API_KEY set, skipping Pixabay source");
    return [];
  }

  // Search multiple EDM queries and merge results for variety
  const shuffled = [...EDM_SEARCHES].sort(() => Math.random() - 0.5);
  const queries = shuffled.slice(0, 3);
  const allTracks: PixabayTrack[] = [];

  for (const query of queries) {
    const url = `https://pixabay.com/api/music/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&genre=electronic&per_page=${limit}&min_duration=30&max_duration=120&order=popular`;

    console.log(`🔍 Searching Pixabay Music for "${query}" (genre: electronic, sorted by popular)...`);

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Pixabay API error for "${query}": ${response.status}`);
      continue;
    }

    const data = (await response.json()) as { hits?: PixabayTrack[] };
    if (data.hits) {
      allTracks.push(...data.hits);
    }
  }

  // Deduplicate by ID and sort by likes (most popular first)
  const seen = new Set<number>();
  const unique = allTracks.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  unique.sort((a, b) => b.likes - a.likes);

  console.log(`🎵 Pixabay: ${unique.length} unique EDM tracks found, sorted by likes`);
  return unique;
}

// --- Jamendo API (fallback — CC licensed, good EDM catalog) ---

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

const JAMENDO_TAGS = ["edm", "electronic", "dance", "house", "dubstep", "trance", "techno", "bass"];

async function fetchJamendoMusic(limit: number = 20): Promise<JamendoTrack[]> {
  const tag = JAMENDO_TAGS[Math.floor(Math.random() * JAMENDO_TAGS.length)];
  const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=${limit}&tags=${tag}&order=popularity_total&audiodlformat=mp31&include=stats&durationbetween=30_120`;

  console.log(`🔍 Searching Jamendo for "${tag}" tracks...`);

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

function normalizePixabayTrack(t: PixabayTrack): NormalizedTrack {
  return {
    source: "pixabay",
    sourceId: String(t.id),
    name: t.title,
    artistName: t.user,
    downloadUrl: t.audio_url,
    duration: t.duration,
    popularityScore: t.downloads + (t.likes * 10),
  };
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

  if (currentUnused >= 50) {
    console.log("✅ Library is well-stocked (50+ tracks). Skipping discovery.");
    return { added: 0, skipped: 0, errors: 0 };
  }

  const neededTracks = Math.min(targetCount, 50 - currentUnused);
  console.log(`📥 Need to fetch ${neededTracks} new tracks`);

  // Fetch from all sources in parallel
  const [pixabayTracks, jamendoTracks] = await Promise.all([
    fetchPixabayMusic(neededTracks * 2).catch((err) => {
      console.error("Pixabay fetch failed:", err);
      return [] as PixabayTrack[];
    }),
    fetchJamendoMusic(neededTracks * 2).catch((err) => {
      console.error("Jamendo fetch failed:", err);
      return [] as JamendoTrack[];
    }),
  ]);

  // Normalize and merge, prioritizing Pixabay (better license)
  const allTracks: NormalizedTrack[] = [
    ...pixabayTracks.map(normalizePixabayTrack),
    ...jamendoTracks.map(normalizeJamendoTrack),
  ];

  // Sort by popularity
  allTracks.sort((a, b) => b.popularityScore - a.popularityScore);

  console.log(`🔍 Found ${pixabayTracks.length} Pixabay + ${jamendoTracks.length} Jamendo = ${allTracks.length} candidates`);

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

  return { added, skipped, errors };
}
