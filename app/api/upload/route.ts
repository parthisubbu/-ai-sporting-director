import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const MAX_SIZE = 100 * 1024 * 1024; // 100MB
const BUCKET = process.env.STORAGE_BUCKET ?? "career-saves";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file      = formData.get("file") as File | null;
  const careerId  = formData.get("career_id") as string | null;

  if (!file || !careerId)
    return NextResponse.json({ error: "file and career_id required" }, { status: 400 });

  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "File too large (max 100MB)" }, { status: 413 });

  // Verify career belongs to user
  const { data: career } = await supabase
    .from("careers")
    .select("id")
    .eq("id", careerId)
    .eq("user_id", user.id)
    .single();

  if (!career) return NextResponse.json({ error: "Career not found" }, { status: 404 });

  const admin = createAdminClient();
  const storagePath = `${user.id}/${careerId}/${Date.now()}_${file.name}`;

  // Upload to Supabase Storage
  const bytes = await file.arrayBuffer();
  const { error: storageErr } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, bytes, { upsert: true, contentType: "application/octet-stream" });

  if (storageErr)
    return NextResponse.json({ error: storageErr.message }, { status: 500 });

  // Create upload record
  const { data: upload, error: dbErr } = await supabase
    .from("career_uploads")
    .insert({
      career_id:    careerId,
      filename:     file.name,
      storage_path: storagePath,
      file_size:    file.size,
      status:       "uploaded",
    })
    .select()
    .single();

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  // Trigger async parse (fire and forget — client polls status)
  triggerParse(upload.id, careerId, storagePath, user.id).catch(console.error);

  return NextResponse.json({ upload_id: upload.id, status: "processing" }, { status: 202 });
}

// ── Status polling endpoint ───────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("upload_id");
  if (!id) return NextResponse.json({ error: "upload_id required" }, { status: 400 });

  const { data } = await supabase
    .from("career_uploads")
    .select("status, error_msg")
    .eq("id", id)
    .single();

  return NextResponse.json(data ?? { status: "not_found" });
}

// ── Async parse trigger ───────────────────────────────────────
async function triggerParse(uploadId: string, careerId: string, storagePath: string, userId: string) {
  const admin = createAdminClient();

  await admin.from("career_uploads").update({ status: "processing" }).eq("id", uploadId);

  try {
    // Download file to temp
    const { data: fileData, error } = await admin.storage
      .from(process.env.STORAGE_BUCKET ?? "career-saves")
      .download(storagePath);

    if (error || !fileData) throw error ?? new Error("Download failed");

    const tmpPath = path.join(os.tmpdir(), `save_${Date.now()}.sav`);
    const buf = Buffer.from(await fileData.arrayBuffer());
    fs.writeFileSync(tmpPath, buf);

    // Dynamic import to avoid loading parser at startup
    const { parseSaveFile, batchInsertPlayers } = await import("@/services/parser");
    const { career, players, clubs } = await parseSaveFile(tmpPath);
    fs.unlinkSync(tmpPath);

    // Update career with extracted metadata
    if (career.teamName || career.leagueName) {
      await admin.from("careers").update({
        club_name:  career.teamName   ?? undefined,
        league:     career.leagueName ?? undefined,
        season:     String(career.currentSeason ?? ""),
        difficulty: career.difficulty ?? undefined,
      }).eq("id", careerId);
    }

    // Insert clubs
    if (clubs.length) {
      await admin.from("clubs").insert(
        clubs.map((c) => ({ ...c, career_id: careerId }))
      );
    }

    // Batch insert players (18k+ chunked)
    await batchInsertPlayers(admin, careerId, players);

    await admin.from("career_uploads").update({ status: "complete" }).eq("id", uploadId);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await admin.from("career_uploads")
      .update({ status: "failed", error_msg: msg })
      .eq("id", uploadId);
  }
}
