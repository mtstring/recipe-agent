"use client";
import { type SuggestionMode } from "@/lib/types";
import { cn } from "@/lib/utils";

type ModeOption = { key: SuggestionMode; emoji: string; label: string; color: string };

const modes: ModeOption[] = [
  { key: "improve", emoji: "💪", label: "好き嫌い克服", color: "bg-basil" },
  { key: "consume", emoji: "🧊", label: "冷蔵庫消費", color: "bg-butter-dark" },
  { key: "specified", emoji: "🎯", label: "食材指定", color: "bg-soft-brown" },
];

export function ModeSelector({ value, onChange }: { value: SuggestionMode; onChange: (m: SuggestionMode) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
      {modes.map((m) => {
        const active = value === m.key;
        return (
          <button
            key={m.key}
            onClick={() => onChange(active ? "normal" : m.key)}
            className={cn(
              "flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-bold transition-all border-2",
              active
                ? `${m.color} text-white border-transparent shadow`
                : "bg-white text-warm-brown border-cream-dark hover:border-tomato/40"
            )}
          >
            {m.emoji} {m.label}
          </button>
        );
      })}
    </div>
  );
}
