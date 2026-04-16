"use client";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  onRemove?: () => void;
  variant?: "like" | "dislike" | "allergy" | "neutral";
  className?: string;
};

const styles: Record<NonNullable<Props["variant"]>, string> = {
  like: "bg-basil/15 text-basil-dark border-basil/40",
  dislike: "bg-tomato/10 text-tomato-dark border-tomato/40",
  allergy: "bg-butter/25 text-warm-brown border-butter",
  neutral: "bg-cream-dark text-warm-brown border-cream-dark",
};

export function Chip({ label, onRemove, variant = "neutral", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border",
        styles[variant],
        className
      )}
    >
      {label}
      {onRemove && (
        <button onClick={onRemove} className="hover:opacity-70" aria-label="削除">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </span>
  );
}
