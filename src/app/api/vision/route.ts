import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const check = rateLimit(`vision:${user.id}`, 10, 3_600_000);
  if (!check.ok) {
    return NextResponse.json({ error: "リクエストが多すぎます。少し待ってからもう一度お試しください。" }, { status: 429 });
  }

  const form = await req.formData();
  const file = form.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "no image" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const b64 = Buffer.from(bytes).toString("base64");
  const mediaType = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: b64 },
          },
          {
            type: "text",
            text: `この画像は冷蔵庫の中身や食材の写真です。写っている食材を抽出し、JSON 配列だけを出力してください。各要素は { "name": "食材名", "amount": "大まかな量(推定、無ければ null)" } の形式です。食材以外(容器・調味料容器など)は除外してください。説明文は不要です。`,
          },
        ],
      },
    ],
  });

  const text = resp.content
    .filter((b) => b.type === "text")
    .map((b: any) => b.text)
    .join("");

  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return NextResponse.json({ items: [] });

  try {
    const items = JSON.parse(match[0]);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
