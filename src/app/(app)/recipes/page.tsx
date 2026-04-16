"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle } from "@/components/ui/Card";
import { BookOpen, Clock, Users as UsersIcon, Star } from "lucide-react";
import type { Recipe } from "@/lib/types";

type RecipeWithStats = Recipe & { avg_rating: number | null; want_again_count: number };

export default function RecipesPage() {
  const supabase = createClient();
  const [recipes, setRecipes] = useState<RecipeWithStats[]>([]);

  useEffect(() => {
    (async () => {
      const { data: rs } = await supabase.from("recipes").select("*").order("created_at", { ascending: false });
      const { data: fbs } = await supabase.from("recipe_feedback").select("recipe_id, rating, want_again");
      const stats = new Map<string, { total: number; n: number; want: number }>();
      (fbs ?? []).forEach((f: any) => {
        const e = stats.get(f.recipe_id) ?? { total: 0, n: 0, want: 0 };
        e.total += f.rating; e.n += 1; if (f.want_again) e.want += 1;
        stats.set(f.recipe_id, e);
      });
      const merged: RecipeWithStats[] = (rs ?? []).map((r: any) => {
        const s = stats.get(r.id);
        return { ...r, avg_rating: s ? s.total / s.n : null, want_again_count: s?.want ?? 0 };
      });
      setRecipes(merged);
    })();
  }, []); // eslint-disable-line

  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-10 h-10 rounded-full bg-butter-dark flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-warm-brown">レシピ履歴</h1>
      </div>

      {recipes.length === 0 ? (
        <Card className="text-center py-10 text-soft-brown">
          まだレシピがありません。<br />チャットから提案してもらいましょう!
        </Card>
      ) : (
        <div className="space-y-3">
          {recipes.map((r) => (
            <Link key={r.id} href={`/recipes/${r.id}`}>
              <Card className="hover:border-tomato transition-colors mb-3">
                <CardTitle>{r.title}</CardTitle>
                <div className="flex flex-wrap gap-3 text-xs text-soft-brown mt-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-cream-dark">
                    {r.category === "main" ? "主菜" : r.category === "side" ? "副菜" : r.category === "soup" ? "汁物" : "その他"}
                  </span>
                  <span className="flex items-center gap-1"><UsersIcon className="w-3.5 h-3.5" />{r.servings}人前</span>
                  {r.cook_time_min && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{r.cook_time_min}分</span>}
                  {r.avg_rating != null && (
                    <span className="flex items-center gap-1 text-butter-dark"><Star className="w-3.5 h-3.5 fill-butter-dark" />{r.avg_rating.toFixed(1)}</span>
                  )}
                  {r.want_again_count > 0 && <span className="text-tomato">もう一度 ×{r.want_again_count}</span>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
