import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const check = rateLimit(`parse:${user.id}`, 15, 3_600_000);
  if (!check.ok) {
    return NextResponse.json({ error: "リクエストが多すぎます。少し待ってからもう一度お試しください。" }, { status: 429 });
  }

  const { text } = (await req.json()) as { text: string };
  if (!text?.trim()) return NextResponse.json({ items: [] });

  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `以下のテキストから食材を抽出して JSON 配列で出力してください。各要素は { "name": "食材名", "amount": "量(あれば。なければ null)" } の形式です。JSON 配列のみを出力し、説明文は不要です。

テキスト: ${text}`,
      },
    ],
  });

  const raw = resp.content
    .filter((b) => b.type === "text")
    .map((b: any) => b.text)
    .join("");

  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return NextResponse.json({ items: [] });

  try {
    const items = JSON.parse(match[0]);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
