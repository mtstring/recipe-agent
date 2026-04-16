"use client";
import * as React from "react";

type Props = {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  className?: string;
};

export function Slider({ min = 1, max = 10, step = 1, value, onChange, className }: Props) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`w-full accent-tomato h-2 ${className ?? ""}`}
    />
  );
}
