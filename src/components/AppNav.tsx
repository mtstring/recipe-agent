"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Users, BookOpen, Refrigerator, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/chat", label: "チャット", icon: MessageCircle },
  { href: "/family", label: "家族", icon: Users },
  { href: "/recipes", label: "レシピ", icon: BookOpen },
  { href: "/fridge", label: "冷蔵庫", icon: Refrigerator },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-cream-dark z-40 safe-bottom">
      <div className="max-w-xl mx-auto flex justify-around items-center py-2 px-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all",
                active ? "bg-tomato/10 text-tomato" : "text-soft-brown hover:text-tomato"
              )}
            >
              <Icon className={cn("w-6 h-6", active && "animate-pop-in")} strokeWidth={2.2} />
              <span className="text-xs font-bold">{label}</span>
            </Link>
          );
        })}
        <form action="/auth/signout" method="post">
          <button type="submit" className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl text-soft-brown hover:text-tomato">
            <LogOut className="w-6 h-6" strokeWidth={2.2} />
            <span className="text-xs font-bold">ログアウト</span>
          </button>
        </form>
      </div>
    </nav>
  );
}
