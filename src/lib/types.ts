export type SuggestionMode = "normal" | "improve" | "consume" | "specified";

export const MODE_LABELS: Record<SuggestionMode, string> = {
  normal: "通常モード",
  improve: "好き嫌い克服モード",
  consume: "冷蔵庫消費モード",
  specified: "指定食材モード",
};

export const MODE_DESCRIPTIONS: Record<SuggestionMode, string> = {
  normal: "家族の好みに合わせた安心レシピを提案",
  improve: "苦手食材を少しずつ取り入れる工夫レシピ",
  consume: "傷みやすい食材を優先的に消費するレシピ",
  specified: "指定された食材だけを使ったレシピ",
};

export type FamilyMember = {
  id: string;
  user_id: string;
  name: string;
  age: number | null;
  likes: string[];
  dislikes: string[];
  allergies: string[];
  created_at: string;
};

export type Ingredient = {
  name: string;
  amount?: string;
};

export type RecipeStep = {
  order: number;
  text: string;
};

export type Recipe = {
  id: string;
  user_id: string;
  title: string;
  category: "main" | "side" | "soup" | "other";
  servings: number;
  cook_time_min: number | null;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  tips: string | null;
  mode: SuggestionMode;
  created_at: string;
};

export type RecipeFeedback = {
  id: string;
  recipe_id: string;
  member_id: string;
  rating: number; // 1-5
  comment: string | null;
  want_again: boolean;
  created_at: string;
};

export type FridgeItem = {
  id: string;
  user_id: string;
  name: string;
  amount: string | null;
  expires_at: string | null;
  note: string | null;
  created_at: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  recipes?: Recipe[];
};
