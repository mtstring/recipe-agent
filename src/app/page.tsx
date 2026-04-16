import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { ChefHat, Utensils, Heart, Sparkles } from "lucide-react";

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await searchParams;

  // 許可されていないユーザーがログイン済みの場合はサインアウト
  if (user) {
    const allowedEmails = (process.env.ALLOWED_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
    if (allowedEmails.length > 0 && !allowedEmails.includes(user.email ?? "")) {
      await supabase.auth.signOut();
    } else {
      redirect("/chat");
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-butter/30 to-cream">
      <div className="flex flex-col items-center text-center max-w-md">
        {error === "not_allowed" && (
          <div className="mb-6 px-4 py-3 rounded-2xl bg-tomato/10 border-2 border-tomato/30 text-tomato-dark text-sm font-bold">
            このアカウントは許可されていません。<br />管理者に連絡してください。
          </div>
        )}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-tomato flex items-center justify-center shadow-lg animate-pop-in">
            <ChefHat className="w-14 h-14 text-white" strokeWidth={2.2} />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-butter-dark animate-bounce-soft" />
        </div>

        <h1 className="text-4xl font-extrabold text-tomato mb-2">おうちシェフ</h1>
        <p className="text-lg text-soft-brown mb-10 leading-relaxed">
          家族の好き嫌いを踏まえて<br />
          冷蔵庫の食材から<br />
          <span className="font-bold text-warm-brown">ぴったりのレシピ</span>を提案します
        </p>

        <div className="grid grid-cols-3 gap-3 mb-10 w-full">
          {[
            { icon: Utensils, label: "会話で食材登録", color: "bg-tomato" },
            { icon: Heart, label: "好き嫌い配慮", color: "bg-basil" },
            { icon: Sparkles, label: "AIが提案", color: "bg-butter-dark" },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-bold text-warm-brown">{label}</span>
            </div>
          ))}
        </div>

        <GoogleSignInButton />
        <p className="text-xs text-soft-brown mt-4">
          ログインすると利用規約に同意したものとみなされます
        </p>
      </div>
    </main>
  );
}
