"use client";
import { useState, useRef, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

type SRConstructor = new () => any;
declare global {
  interface Window {
    webkitSpeechRecognition?: SRConstructor;
    SpeechRecognition?: SRConstructor;
  }
}

export function VoiceInputButton({ onResult }: { onResult: (text: string) => void }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recogRef = useRef<any>(null);

  useEffect(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) { setSupported(false); return; }
    const r = new Ctor();
    r.lang = "ja-JP";
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
  }, [onResult]);

  const toggle = () => {
    if (!supported || !recogRef.current) return;
    if (listening) {
      recogRef.current.stop();
      setListening(false);
    } else {
      recogRef.current.start();
      setListening(true);
    }
  };

  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="音声入力"
      className={cn(
        "w-11 h-11 rounded-full flex items-center justify-center shadow transition-all",
        listening ? "bg-tomato text-white animate-pulse" : "bg-butter text-warm-brown hover:bg-butter-dark"
      )}
    >
      {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </button>
  );
}
