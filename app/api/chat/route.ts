import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAIClient, chatWithDirector, findRelevantPlayers, AIProviderError } from "@/services/ai";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { career_id, message, history = [] } = await req.json();
  if (!career_id || !message)
    return NextResponse.json({ error: "career_id and message required" }, { status: 400 });

  // Verify ownership
  const { data: career } = await supabase
    .from("careers").select("*").eq("id", career_id).eq("user_id", user.id).single();
  if (!career) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: clubs } = await supabase.from("clubs").select("*").eq("career_id", career_id).limit(1);
  const userClub = clubs?.[0] ?? null;

  const { data: squadData } = await supabase
    .from("players").select("*").eq("career_id", career_id).eq("is_user_squad", true)
    .order("overall", { ascending: false }).limit(30);

  // Smart context: detect intent and add relevant data
  const msg = message.toLowerCase();
  let topTargets = undefined;

  if (msg.includes("buy") || msg.includes("sign") || msg.includes("transfer") || msg.includes("target")) {
    topTargets = await findRelevantPlayers(supabase, career_id, { isSquad: false, limit: 20 });
  } else if (msg.includes("wonder") || msg.includes("young") || msg.includes("potential")) {
    topTargets = await findRelevantPlayers(supabase, career_id, { maxAge: 21, minPotential: 80, isSquad: false, limit: 20 });
  }

  try {
    const ai = createAIClient();
    const aiResponse = await chatWithDirector(
      ai,
      { career, userClub, squadPlayers: squadData ?? [], topTargets },
      history,
      message
    );

    // Save to DB
    await supabase.from("conversations").insert({
      career_id,
      user_message: message,
      ai_response: aiResponse,
    });

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    // Handle AI provider errors
    if (error instanceof AIProviderError) {
      const status =
        error.code === "MISSING_KEY" || error.code === "INVALID_MODEL" ? 400 : 503;
      console.error(`AI Provider Error [${error.code}]:`, error.message);
      return NextResponse.json(
        {
          error: `AI Provider Error: ${error.message}`,
          code: error.code,
        },
        { status }
      );
    }

    const msg = error instanceof Error ? error.message : String(error);
    console.error("Chat error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const career_id = new URL(req.url).searchParams.get("career_id");
  if (!career_id) return NextResponse.json({ error: "career_id required" }, { status: 400 });

  const { data: career } = await supabase
    .from("careers").select("id").eq("id", career_id).eq("user_id", user.id).single();
  if (!career) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data } = await supabase
    .from("conversations")
    .select("*")
    .eq("career_id", career_id)
    .order("created_at", { ascending: true })
    .limit(100);

  return NextResponse.json(data ?? []);
}
