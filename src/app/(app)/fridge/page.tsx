"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Refrigerator, Plus, Trash2, Camera, AlertTriangle } from "lucide-react";
import type { FridgeItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function FridgePage() {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [draft, setDraft] = useState({ name: "", amount: "", expires_at: "" });
  const [analyzing, setAnalyzing] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("fridge_items").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as FridgeItem[]);
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  const add = async () => {
    if (!draft.name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("fridge_items").insert({
      user_id: user.id,
      name: draft.name.trim(),
      amount: draft.amount || null,
      expires_at: draft.expires_at || null,
    });
    setDraft({ name: "", amount: "", expires_at: "" });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("fridge_items").delete().eq("id", id);
    load();
  };

  const onPhoto = async (file: File) => {
    setAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/vision", { method: "POST", body: fd });
      const data = (await res.json()) as { items: { name: string; amount?: string | null }[] };
      const { data: { user } } = await supabase.auth.getUser();
      if (user && data.items?.length) {
        await supabase.from("fridge_items").insert(
          data.items.map((i) => ({ user_id: user.id, name: i.name, amount: i.amount ?? null }))
        );
        load();
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const daysUntil = (date: string) => {
    const d = new Date(date).getTime() - Date.now();
    return Math.ceil(d / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-10 h-10 rounded-full bg-basil flex items-center justify-center">
          <Refrigerator className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-warm-brown">冷蔵庫</h1>
      </div>

      <Card className="mb-4">
        <CardTitle className="mb-3">食材を追加</CardTitle>
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-3">
              <Label>食材名</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="鶏もも肉" />
            </div>
            <div className="col-span-2">
              <Label>量</Label>
              <Input value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="300g" />
            </div>
          </div>
          <div>
            <Label>賞味期限(任意)</Label>
            <Input type="date" value={draft.expires_at} onChange={(e) => setDraft({ ...draft, expires_at: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" onClick={add} className="flex-1">
              <Plus className="w-5 h-5" />追加
            </Button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => e.target.files?.[0] && onPhoto(e.target.files[0])} />
            <Button variant="basil" onClick={() => fileRef.current?.click()} disabled={analyzing}>
              <Camera className="w-5 h-5" />{analyzing ? "解析中…" : "写真で追加"}
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        {items.length === 0 ? (
          <Card className="text-center py-8 text-soft-brown">まだ食材が登録されていません</Card>
        ) : (
          items.map((it) => {
            const days = it.expires_at ? daysUntil(it.expires_at) : null;
            const soon = days != null && days <= 2;
            return (
              <Card key={it.id} className={cn("flex items-center justify-between py-3", soon && "bg-tomato/5 border-tomato/40")}>
                <div>
                  <div className="font-bold">{it.name}</div>
                  <div className="text-xs text-soft-brown flex items-center gap-2">
                    {it.amount && <span>{it.amount}</span>}
                    {days != null && (
                      <span className={cn("flex items-center gap-0.5", soon && "text-tomato font-bold")}>
                        {soon && <AlertTriangle className="w-3 h-3" />}
                        {days < 0 ? `期限切れ ${-days}日` : `あと${days}日`}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => remove(it.id)} className="text-soft-brown hover:text-tomato p-2" aria-label="削除">
                  <Trash2 className="w-5 h-5" />
                </button>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
