import type { Metadata, Viewport } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";

const rounded = M_PLUS_Rounded_1c({
  variable: "--font-rounded",
  weight: ["400", "500", "700", "800"],
  subsets: ["latin"],
  preload: true,
});

export const metadata: Metadata = {
  title: "おうちシェフ",
  description: "家族の好き嫌いを踏まえて、冷蔵庫の食材からレシピを提案するアプリ",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "おうちシェフ" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#E4572E",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${rounded.variable} h-full antialiased`} style={{ backgroundColor: "#FFF8E7" }}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: "html,body{background:#FFF8E7!important}" }} />
      </head>
      <body className="min-h-full flex flex-col bg-cream text-warm-brown" style={{ backgroundColor: "#FFF8E7" }}>
        {/* スプラッシュ画面: hydration 完了後にフェードアウト */}
        <div
          id="splash"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(to bottom, rgba(255,196,61,0.3), #FFF8E7)",
            transition: "opacity 0.4s ease",
          }}
        >
          <img
            src="/icon-192.png"
            alt=""
            width={96}
            height={96}
            style={{ borderRadius: 24, marginBottom: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
          />
          <p style={{ fontSize: 24, fontWeight: 800, color: "#E4572E", margin: "0 0 8px" }}>
            おうちシェフ
          </p>
          <div
            style={{
              width: 32,
              height: 32,
              border: "3px solid #F3E9C6",
              borderTopColor: "#E4572E",
              borderRadius: "50%",
              animation: "splash-spin 0.8s linear infinite",
            }}
          />
          <style
            dangerouslySetInnerHTML={{
              __html: "@keyframes splash-spin{to{transform:rotate(360deg)}}",
            }}
          />
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var done = false;
                function hide(){
                  if(done) return;
                  done = true;
                  var el = document.getElementById('splash');
                  if(!el) return;
                  el.style.opacity = '0';
                  setTimeout(function(){ el.remove(); }, 400);
                }
                if(document.readyState === 'complete') hide();
                else window.addEventListener('load', hide);
                setTimeout(hide, 5000);
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
