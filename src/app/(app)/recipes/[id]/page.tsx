"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { Textarea } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ArrowLeft, Clock, Users as UsersIcon, Star, Heart, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Recipe, FamilyMember, RecipeFeedback } from "@/lib/types";

function scaleAmount(amount: string | undefined, ratio: number): string {
  if (!amount) return "";
  return amount.replace(/(\d+(?:\.\d+)?)/g, (m) => {
    const n = parseFloat(m) * ratio;
    return (Math.round(n * 10) / 10).toString();
  });
}

export default function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [servings, setServings] = useState(2);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [feedback, setFeedback] = useState<RecipeFeedback[]>([]);

  const [selectedMember, setSelectedMember] = useState<string>("");
  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState("");
  const [wantAgain, setWantAgain] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: r } = await supabase.from("recipes").select("*").eq("id", id).single();
      if (r) { setRecipe(r as Recipe); setServings(r.servings); }
      const { data: ms } = await supabase.from("family_members").select("*");
      setMembers((ms ?? []) as FamilyMember[]);
      if (ms?.[0]) setSelectedMember(ms[0].id);
      const { data: fbs } = await supabase.from("recipe_feedback").select("*").eq("recipe_id", id);
      setFeedback((fbs ?? []) as RecipeFeedback[]);
    })();
  }, [id]); // eslint-disable-line

  if (!recipe) return <div className="p-6 text-center text-soft-brown">読み込み中…</div>;

  const ratio = servings / recipe.servings;

  const submitFeedback = async () => {
    if (!selectedMember) return;
    await supabase.from("recipe_feedback").insert({
      recipe_id: id, member_id: selectedMember, rating, comment: comment || null, want_again: wantAgain,
    });
    setComment(""); setRating(3); setWantAgain(false);
    const { data: fbs } = await supabase.from("recipe_feedback").select("*").eq("recipe_id", id);
    setFeedback((fbs ?? []) as RecipeFeedback[]);
  };

  const removeFeedback = async (fid: string) => {
    await supabase.from("recipe_feedback").delete().eq("id", fid);
    setFeedback((f) => f.filter((x) => x.id !== fid));
  };

  const memberName = (mid: string) => members.find((m) => m.id === mid)?.name ?? "不明";

  return (
    <div className="px-4 py-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-soft-brown hover:text-tomato mb-3 text-sm font-bold">
        <ArrowLeft className="w-4 h-4" /> 戻る
      </button>

      <Card className="mb-4">
        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-tomato/10 text-tomato-dark font-bold mb-2">
          {recipe.category === "main" ? "主菜" : recipe.category === "side" ? "副菜" : recipe.category === "soup" ? "汁物" : "その他"}
        </span>
        <h1 className="text-2xl font-extrabold text-warm-brown mb-2">{recipe.title}</h1>
        <div className="flex flex-wrap gap-3 text-sm text-soft-brown">
          <span className="flex items-center gap-1"><UsersIcon className="w-4 h-4" />{servings}人前</span>
          {recipe.cook_time_min && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{recipe.cook_time_min}分</span>}
        </div>
      </Card>

      <Card className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <Label className="mb-0">人数を調整</Label>
          <span className="text-tomato font-extrabold text-lg">{servings}人前</span>
        </div>
        <Slider min={1} max={10} value={servings} onChange={setServings} />
      </Card>

      <Card className="mb-4">
        <CardTitle className="mb-3">材料</CardTitle>
        <ul className="space-y-1.5">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="flex justify-between border-b border-cream-dark pb-1.5 last:border-0">
              <span>{ing.name}</span>
              <span className="text-soft-brown font-medium">{scaleAmount(ing.amount, ratio)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mb-4">
        <CardTitle className="mb-3">作り方</CardTitle>
        <ol className="space-y-3">
          {recipe.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-tomato text-white flex items-center justify-center font-bold text-sm">
                {s.order ?? i + 1}
              </div>
              <p className="flex-1 pt-0.5">{s.text}</p>
            </li>
          ))}
        </ol>
      </Card>

      {recipe.tips && (
        <Card className="mb-4 bg-butter/20 border-butter">
          <CardTitle className="mb-2 text-warm-brown">👨‍🍳 ワンポイント</CardTitle>
          <p className="whitespace-pre-wrap">{recipe.tips}</p>
        </Card>
      )}

      <Card className="mb-4">
        <CardTitle className="mb-3">みんなの評価</CardTitle>
        {feedback.length === 0 ? (
          <p className="text-sm text-soft-brown">まだ評価がありません</p>
        ) : (
          <div className="space-y-2 mb-4">
            {feedback.map((f) => (
              <div key={f.id} className="p-3 bg-cream-dark/40 rounded-2xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">{memberName(f.member_id)}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={cn("w-4 h-4", n <= f.rating ? "fill-butter-dark text-butter-dark" : "text-cream-dark")} />
                    ))}
                    <button onClick={() => removeFeedback(f.id)} className="ml-2 text-soft-brown hover:text-tomato"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {f.comment && <p className="text-sm">{f.comment}</p>}
                {f.want_again && <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-tomato/10 text-tomato-dark font-bold">もう一度食べたい!</span>}
              </div>
            ))}
          </div>
        )}

        {members.length === 0 ? (
          <p className="text-sm text-soft-brown">先に家族メンバーを登録してください</p>
        ) : (
          <div className="space-y-3 pt-2 border-t border-cream-dark">
            <div>
              <Label>誰の評価?</Label>
              <div className="flex flex-wrap gap-1.5">
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMember(m.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-bold border-2 transition-colors",
                      selectedMember === m.id ? "bg-tomato text-white border-tomato" : "bg-white border-cream-dark text-warm-brown"
                    )}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>評価</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)}>
                    <Star className={cn("w-8 h-8", n <= rating ? "fill-butter-dark text-butter-dark" : "text-cream-dark")} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>感想(任意)</Label>
              <Textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="よく食べました!" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={wantAgain} onChange={(e) => setWantAgain(e.target.checked)} className="w-5 h-5 accent-tomato" />
              <Heart className={cn("w-5 h-5", wantAgain ? "fill-tomato text-tomato" : "text-soft-brown")} />
              <span className="text-sm font-bold">もう一度食べたい!</span>
            </label>
            <Button variant="primary" onClick={submitFeedback} className="w-full">評価を保存</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
