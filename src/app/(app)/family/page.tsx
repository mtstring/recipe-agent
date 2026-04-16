"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Chip } from "@/components/ui/Chip";
import { Plus, Trash2, Users } from "lucide-react";
import type { FamilyMember } from "@/lib/types";

type Draft = { name: string; age: string; likes: string[]; dislikes: string[]; allergies: string[] };
const emptyDraft: Draft = { name: "", age: "", likes: [], dislikes: [], allergies: [] };

function TagInput({ label, items, onChange, variant, placeholder }: {
  label: string; items: string[]; onChange: (v: string[]) => void;
  variant: "like" | "dislike" | "allergy"; placeholder: string;
}) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !items.includes(v)) onChange([...items, v]);
    setInput("");
  };
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2 mb-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
        />
        <Button size="sm" variant="secondary" onClick={add}>追加</Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <Chip key={it} label={it} variant={variant} onRemove={() => onChange(items.filter((x) => x !== it))} />
        ))}
      </div>
    </div>
  );
}

export default function FamilyPage() {
  const supabase = createClient();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("family_members").select("*").order("created_at");
    setMembers((data ?? []) as FamilyMember[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  const save = async () => {
    if (!draft.name.trim()) return;
    const payload = {
      name: draft.name.trim(),
      age: draft.age ? Number(draft.age) : null,
      likes: draft.likes, dislikes: draft.dislikes, allergies: draft.allergies,
    };
    if (editingId) {
      await supabase.from("family_members").update(payload).eq("id", editingId);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("family_members").insert({ ...payload, user_id: user.id });
    }
    setDraft(emptyDraft); setEditingId(null); load();
  };

  const edit = (m: FamilyMember) => {
    setEditingId(m.id);
    setDraft({ name: m.name, age: m.age?.toString() ?? "", likes: m.likes, dislikes: m.dislikes, allergies: m.allergies });
  };

  const remove = async (id: string) => {
    if (!confirm("このメンバーを削除しますか?")) return;
    await supabase.from("family_members").delete().eq("id", id);
    load();
  };

  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-10 h-10 rounded-full bg-basil flex items-center justify-center">
          <Users className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-warm-brown">家族の設定</h1>
      </div>

      {!loading && members.length > 0 && (
        <div className="space-y-3 mb-6">
          {members.map((m) => (
            <Card key={m.id} className="animate-pop-in">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <CardTitle>{m.name}</CardTitle>
                  {m.age != null && <p className="text-sm text-soft-brown">{m.age}歳</p>}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => edit(m)}>編集</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(m.id)} aria-label="削除">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                {m.likes.length > 0 && <div className="flex flex-wrap gap-1.5"><span className="text-xs font-bold text-basil-dark self-center">好き:</span>{m.likes.map((t) => <Chip key={t} label={t} variant="like" />)}</div>}
                {m.dislikes.length > 0 && <div className="flex flex-wrap gap-1.5"><span className="text-xs font-bold text-tomato-dark self-center">苦手:</span>{m.dislikes.map((t) => <Chip key={t} label={t} variant="dislike" />)}</div>}
                {m.allergies.length > 0 && <div className="flex flex-wrap gap-1.5"><span className="text-xs font-bold text-butter-dark self-center">アレルギー:</span>{m.allergies.map((t) => <Chip key={t} label={t} variant="allergy" />)}</div>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardTitle className="mb-4">{editingId ? "メンバーを編集" : "メンバーを追加"}</CardTitle>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label>名前</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="たろう" />
            </div>
            <div>
              <Label>年齢</Label>
              <Input type="number" value={draft.age} onChange={(e) => setDraft({ ...draft, age: e.target.value })} placeholder="5" />
            </div>
          </div>
          <TagInput label="好きな食材・料理" items={draft.likes} onChange={(v) => setDraft({ ...draft, likes: v })} variant="like" placeholder="カレー" />
          <TagInput label="苦手な食材" items={draft.dislikes} onChange={(v) => setDraft({ ...draft, dislikes: v })} variant="dislike" placeholder="ピーマン" />
          <TagInput label="アレルギー" items={draft.allergies} onChange={(v) => setDraft({ ...draft, allergies: v })} variant="allergy" placeholder="卵" />
          <div className="flex gap-2 pt-2">
            <Button variant="primary" onClick={save} className="flex-1">
              <Plus className="w-5 h-5" />{editingId ? "更新" : "追加"}
            </Button>
            {editingId && <Button variant="ghost" onClick={() => { setEditingId(null); setDraft(emptyDraft); }}>キャンセル</Button>}
          </div>
        </div>
      </Card>
    </div>
  );
}
