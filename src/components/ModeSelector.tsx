"use client";
import { MODE_LABELS, MODE_DESCRIPTIONS, type SuggestionMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const modes: SuggestionMode[] = ["normal", "improve", "consume", "specified"];
const colors: Record<SuggestionMode, string> = {
  normal: "bg-tomato",
  improve: "bg-basil",
  consume: "bg-butter-dark",
  specified: "bg-soft-brown",
};

export function ModeSelector({ value, onChange }: { value: SuggestionMode; onChange: (m: SuggestionMode) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
      {modes.map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={cn(
            "flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border-2",
            value === m
              ? `${colors[m]} text-white border-transparent shadow`
              : "bg-white text-warm-brown border-cream-dark hover:border-tomato/40"
          )}
          title={MODE_DESCRIPTIONS[m]}
        >
          {MODE_LABELS[m]}
        </button>
      ))}
    </div>
  );
}
