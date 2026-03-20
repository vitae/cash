import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { enqueue, processQueue } from "../services/queue";

const router = Router();

// Simple endpoint for iPhone Shortcuts — accepts video file + handle in one request
// POST /quick-upload?handle=@username
// Body: raw video file (Content-Type: video/mp4)
router.post("/quick-upload", async (req: Request, res: Response) => {
  const handle = (req.query.handle as string || "").trim() || "Unknown Artist";

  // Collect raw body chunks
  const chunks: Buffer[] = [];
  req.on("data", (chunk: Buffer) => chunks.push(chunk));
  req.on("end", async () => {
    try {
      const videoBuffer = Buffer.concat(chunks);
      if (videoBuffer.length < 1000) {
        res.status(400).json({ error: "No video data received" });
        return;
      }

      const slug = handle.replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const filename = `${slug}-${Date.now()}.mp4`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("reels")
        .upload(filename, videoBuffer, {
          contentType: "video/mp4",
          upsert: false,
        });

      if (uploadError) {
        console.error("Quick upload storage error:", uploadError.message);
        res.status(500).json({ error: "Storage upload failed" });
        return;
      }

      const { data: urlData } = supabase.storage
        .from("reels")
        .getPublicUrl(filename);

      // Insert reel submission
      const { data, error: dbError } = await supabase
        .from("reel_submissions")
        .insert({
          artist_name: handle,
          email: null,
          video_url: urlData.publicUrl,
          status: "pending",
          description: null,
        })
        .select("id")
        .single();

      if (dbError) {
        console.error("Quick upload DB error:", dbError.message);
        res.status(500).json({ error: "Database insert failed" });
        return;
      }

      // Enqueue for processing (skip webhook, process directly)
      enqueue(data.id);
      processQueue();

      console.log(`Quick upload: ${handle} → ${filename} → ${data.id}`);
      res.status(201).json({ success: true, id: data.id, url: urlData.publicUrl });
    } catch (err) {
      console.error("Quick upload error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  });
});

export default router;
