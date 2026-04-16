-- Supabase 初期スキーマ
-- Supabase ダッシュボードの SQL Editor で実行してください。

-- 拡張
create extension if not exists "uuid-ossp";

-- 家族メンバー
create table if not exists public.family_members (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  age int,
  likes text[] not null default '{}',
  dislikes text[] not null default '{}',
  allergies text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_family_members_user on public.family_members(user_id);

-- 冷蔵庫の食材
create table if not exists public.fridge_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount text,
  expires_at date,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_fridge_items_user on public.fridge_items(user_id);

-- レシピ
create table if not exists public.recipes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'main' check (category in ('main','side','soup','other')),
  servings int not null default 2,
  cook_time_min int,
  ingredients jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  tips text,
  mode text not null default 'normal',
  cooked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_recipes_user on public.recipes(user_id, created_at desc);

-- レシピ評価
create table if not exists public.recipe_feedback (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  member_id uuid not null references public.family_members(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  want_again boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_feedback_recipe on public.recipe_feedback(recipe_id);
create index if not exists idx_feedback_member on public.recipe_feedback(member_id);

-- チャットセッション
create table if not exists public.chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  messages jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_user on public.chat_sessions(user_id, updated_at desc);

-- RLS 有効化
alter table public.family_members enable row level security;
alter table public.fridge_items enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_feedback enable row level security;
alter table public.chat_sessions enable row level security;

-- RLS ポリシー: 本人のみアクセス可能
create policy "own rows" on public.family_members
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows" on public.fridge_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows" on public.recipes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows" on public.chat_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- feedback は該当 recipe のオーナーのみ
create policy "feedback via recipe owner" on public.recipe_feedback
  for all using (
    exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );
