"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, ChefHat } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Card, CardTitle } from "@/components/ui/Card";
import { ModeSelector } from "@/components/ModeSelector";
import { VoiceInputButton } from "@/components/VoiceInputButton";
import type { ChatMessage, Recipe, SuggestionMode } from "@/lib/types";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "こんにちは!おうちシェフです 🍳\n今日の冷蔵庫にある食材を教えてください。音声でもテキストでもOKですよ!",
    },
  ]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<SuggestionMode>("normal");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    const newUserMsg: ChatMessage = { role: "user", content: text };
    const next = [...messages, newUserMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          mode,
        }),
      });
      if (!res.ok) throw new Error("chat failed");
      const data = (await res.json()) as { reply: string; recipes: Recipe[] };
      setMessages((curr) => [
        ...curr,
        { role: "assistant", content: data.reply, recipes: data.recipes },
      ]);
    } catch {
      setMessages((curr) => [
        ...curr,
        { role: "assistant", content: "ごめんなさい、エラーが発生しました。もう一度試してください。" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100dvh-80px)]">
      <div className="px-4 pt-4 pb-2 bg-cream sticky top-0 z-20 border-b border-cream-dark">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-tomato flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-extrabold text-warm-brown">おうちシェフ</h1>
        </div>
        <ModeSelector value={mode} onChange={setMode} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] bg-tomato text-white px-4 py-2.5 rounded-3xl rounded-br-md whitespace-pre-wrap shadow"
                  : "max-w-[90%] bg-white text-warm-brown px-4 py-2.5 rounded-3xl rounded-bl-md whitespace-pre-wrap border-2 border-cream-dark shadow-sm animate-pop-in"
              }
            >
              {m.content}
              {m.recipes && m.recipes.length > 0 && (
                <div className="mt-3 space-y-2">
                  {m.recipes.map((r) => (
                    <Link key={r.id} href={`/recipes/${r.id}`} className="block">
                      <Card className="p-3 hover:border-tomato transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-butter flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-warm-brown" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-base">{r.title}</CardTitle>
                            <p className="text-xs text-soft-brown">
                              {r.category === "main" ? "主菜" : r.category === "side" ? "副菜" : r.category === "soup" ? "汁物" : "その他"} ・ {r.servings}人前{r.cook_time_min ? ` ・ 約${r.cook_time_min}分` : ""}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-3 rounded-3xl rounded-bl-md border-2 border-cream-dark">
              <Loader2 className="w-5 h-5 animate-spin text-tomato" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 py-3 bg-white border-t-2 border-cream-dark">
        <div className="flex items-end gap-2">
          <VoiceInputButton onResult={(t) => setInput((v) => (v ? v + " " : "") + t)} />
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="食材を教えてください…"
            rows={1}
            className="flex-1 min-h-[44px] max-h-32 py-2.5"
          />
          <Button size="icon" onClick={() => send()} disabled={loading || !input.trim()} aria-label="送信">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
