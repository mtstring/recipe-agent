"use client";
import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton() {
  const handleClick = async () => {
    console.log("SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20) + "...");
    const supabase = createClient();
    const origin = window.location.origin;
    console.log("origin:", origin);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=/chat`,
        skipBrowserRedirect: true,
      },
    });
    if (data?.url) {
      window.location.href = data.url;
    } else {
      console.error("OAuth error:", error);
      alert("ログインに失敗しました。もう一度お試しください。");
    }
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-3 w-full max-w-xs h-14 px-8 rounded-full bg-tomato text-white text-lg font-bold shadow-sm hover:bg-tomato-dark active:scale-95 transition-all"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#fff" d="M21.35 11.1h-9.17v2.96h5.28c-.24 1.37-1.56 4.02-5.28 4.02-3.18 0-5.77-2.63-5.77-5.88s2.59-5.88 5.77-5.88c1.81 0 3.02.77 3.71 1.43l2.53-2.43C16.79 3.76 14.7 2.9 12.18 2.9c-5.15 0-9.32 4.17-9.32 9.3s4.17 9.3 9.32 9.3c5.38 0 8.94-3.78 8.94-9.1 0-.61-.07-1.08-.17-1.3z"/>
      </svg>
      Google でログイン
    </button>
  );
}
