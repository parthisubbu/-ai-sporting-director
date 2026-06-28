import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const s = new URL(req.url).searchParams;
  const careerId   = s.get("career_id");
  const search     = s.get("search") ?? "";
  const position   = s.get("position") ?? "";
  const isSquad    = s.get("squad") === "true" ? true : s.get("squad") === "false" ? false : null;
  const maxAge     = s.get("max_age") ? parseInt(s.get("max_age")!) : null;
  const minOvr     = s.get("min_ovr") ? parseInt(s.get("min_ovr")!) : null;
  const minPot     = s.get("min_pot") ? parseInt(s.get("min_pot")!) : null;
  const maxVal     = s.get("max_val") ? parseInt(s.get("max_val")!) : null;
  const sort       = s.get("sort") ?? "overall";
  const page       = parseInt(s.get("page") ?? "1");
  const limit      = Math.min(parseInt(s.get("limit") ?? "50"), 100);
  const offset     = (page - 1) * limit;

  if (!careerId) return NextResponse.json({ error: "career_id required" }, { status: 400 });

  // Verify career ownership
  const { data: career } = await supabase
    .from("careers")
    .select("id")
    .eq("id", careerId)
    .eq("user_id", user.id)
    .single();

  if (!career) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let q = supabase
    .from("players")
    .select("*", { count: "exact" })
    .eq("career_id", careerId);

  if (search)            q = q.textSearch("name", search, { type: "websearch" });
  if (position)          q = q.eq("position", position);
  if (isSquad !== null)  q = q.eq("is_user_squad", isSquad);
  if (maxAge)            q = q.lte("age", maxAge);
  if (minOvr)            q = q.gte("overall", minOvr);
  if (minPot)            q = q.gte("potential", minPot);
  if (maxVal)            q = q.lte("value", maxVal);

  const sortField = ["overall","potential","age","value","wage"].includes(sort) ? sort : "overall";
  q = q.order(sortField, { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    players: data,
    total:   count ?? 0,
    page,
    limit,
    pages:   Math.ceil((count ?? 0) / limit),
  });
}
