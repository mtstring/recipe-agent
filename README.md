# おうちシェフ 🍳

家族の好き嫌いを踏まえて、冷蔵庫の食材から **会話形式** でレシピを提案するモバイル向け Web アプリ。

## 機能

- **Google ログイン**(Supabase Auth)
- **家族メンバー管理** — 名前・年齢・好き/苦手な食材・アレルギーをメンバーごとに登録
- **チャット形式レシピ提案** — テキスト/音声/写真で食材を伝えると Claude が提案
- **4つの提案モード**
  - 通常(好き嫌い優先)
  - 好き嫌い克服(苦手を工夫して取り入れる)
  - 冷蔵庫消費(傷みやすい食材優先)
  - 指定食材(入力食材のみ使用)
- **写真から食材抽出** — Claude Vision で冷蔵庫写真を解析
- **音声入力** — Web Speech API
- **人数切替スライダー** — 材料量を自動スケール
- **メンバー別フィードバック** — 5段階評価 + コメント + 再提案フラグ
- **冷蔵庫インベントリ** — 賞味期限管理、残り日数警告
- **PWA 対応** — ホーム画面に追加可能

## 技術スタック

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Supabase (PostgreSQL / Auth / RLS)
- Anthropic Claude API (Sonnet 4.5) — レシピ生成 & Vision
- Vercel 想定デプロイ

## セットアップ

### 1. 依存インストール

```bash
npm install
```

### 2. Supabase プロジェクト作成

1. [supabase.com](https://supabase.com) で新規プロジェクト作成
2. SQL Editor で `supabase/migrations/0001_init.sql` を実行
3. Authentication → Providers → **Google** を有効化(Google Cloud Console で OAuth Client を作成し Client ID/Secret を登録)
4. Authentication → URL Configuration → Redirect URLs に以下を追加:
   - `http://localhost:3000/auth/callback`
   - 本番 URL の `/auth/callback`

### 3. 環境変数

`.env.local.example` を `.env.local` にコピーして値を設定:

```bash
cp .env.local.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase ダッシュボードから取得
- `ANTHROPIC_API_KEY` — [console.anthropic.com](https://console.anthropic.com) で取得

### 4. 開発サーバ起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開く(スマホからも同一 LAN でアクセス可能)。

## ディレクトリ構成

```
src/
 ├ app/
 │  ├ (app)/          # 認証必須エリア
 │  │   ├ chat/       # チャット画面(メイン)
 │  │   ├ family/     # 家族メンバー管理
 │  │   ├ recipes/    # レシピ履歴・詳細
 │  │   └ fridge/     # 冷蔵庫インベントリ
 │  ├ api/
 │  │   ├ chat/       # Claude レシピ提案 API
 │  │   └ vision/     # 写真からの食材抽出 API
 │  ├ auth/callback/  # Supabase OAuth コールバック
 │  └ page.tsx        # ランディング(Google ログイン)
 ├ components/ui/     # Button / Card / Input / Chip / Slider
 ├ lib/
 │  ├ supabase/       # client / server / middleware
 │  ├ anthropic.ts
 │  ├ prompts.ts      # システムプロンプト & レシピパーサー
 │  └ types.ts
 └ middleware.ts      # 認証ミドルウェア

supabase/migrations/  # DB マイグレーション
```

## デプロイ

Vercel に Git 連携 → 環境変数を設定 → デプロイ。Supabase の Redirect URL に本番 URL を追加することを忘れずに。

## ライセンス

MIT
