import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import { buildSystemPrompt, parseRecipesFromResponse, stripRecipeBlock } from "@/lib/prompts";
import { rateLimit } from "@/lib/rate-limit";
import type { SuggestionMode } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// 1ユーザーあたり 1分に5回、1時間に30回まで
const LIMIT_PER_MIN = 5;
const LIMIT_PER_HOUR = 30;

type InMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const { messages, mode } = (await req.json()) as { messages: InMessage[]; mode: SuggestionMode };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const minCheck = rateLimit(`chat:min:${user.id}`, LIMIT_PER_MIN, 60_000);
  const hourCheck = rateLimit(`chat:hour:${user.id}`, LIMIT_PER_HOUR, 3_600_000);
  if (!minCheck.ok || !hourCheck.ok) {
    return NextResponse.json({ error: "リクエストが多すぎます。少し待ってからもう一度お試しください。" }, { status: 429 });
  }

  const [{ data: members }, { data: fridge }, { data: feedbackRows }] = await Promise.all([
    supabase.from("family_members").select("*").eq("user_id", user.id),
    supabase.from("fridge_items").select("name, amount").eq("user_id", user.id),
    supabase
      .from("recipe_feedback")
      .select("rating, comment, member_id, family_members(name)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  type FbAgg = { name: string; ratings: number[]; comments: string[] };
  const fbByMember = new Map<string, FbAgg>();
  ((feedbackRows ?? []) as any[]).forEach((f: any) => {
    const name: string = f.family_members?.name ?? "不明";
    const e: FbAgg = fbByMember.get(f.member_id) ?? { name, ratings: [], comments: [] };
    e.ratings.push(Number(f.rating));
    if (f.comment) e.comments.push(String(f.comment));
    fbByMember.set(f.member_id, e);
  });
  const feedback = [...fbByMember.entries()].map(([member_id, v]) => ({
    member_id,
    member_name: v.name,
    avg_rating: v.ratings.reduce((a, b) => a + b, 0) / v.ratings.length,
    comments: v.comments,
  }));

  const system = buildSystemPrompt({
    members: (members ?? []) as any,
    mode,
    feedback,
    fridge: fridge ?? [],
  });

  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const text = resp.content
    .filter((b) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");

  const recipes = parseRecipesFromResponse(text);
  const reply = stripRecipeBlock(text);

  // レシピを DB へ保存
  const savedRecipes = [] as any[];
  for (const r of recipes) {
    const { data } = await supabase
      .from("recipes")
      .insert({ ...r, user_id: user.id, mode })
      .select()
      .single();
    if (data) savedRecipes.push(data);
  }

  return NextResponse.json({ reply, recipes: savedRecipes });
}
