import type { FamilyMember, Recipe, SuggestionMode } from "./types";

type FeedbackStat = {
  member_id: string;
  member_name: string;
  avg_rating: number;
  comments: string[];
};

const modeInstructions: Record<SuggestionMode, string> = {
  normal: "家族の好みに合わせた、みんなが喜ぶレシピを提案してください。苦手な食材やアレルギーは絶対に避けてください。",
  improve:
    "「好き嫌い克服モード」です。苦手食材を少量だけ取り入れ、味付けや調理法で美味しく食べられる工夫を凝らしたレシピを提案してください。どうやって苦手を克服する工夫をしたか、tips に明記してください。ただし、アレルギーは絶対に含めないでください。",
  consume:
    "「冷蔵庫消費モード」です。ユーザーが言及した冷蔵庫の食材(特に傷みやすいもの)を優先的に使い切るレシピを提案してください。ただし、アレルギーは絶対に含めないでください。",
  specified:
    "「指定食材モード」です。ユーザーが指定した食材のみ(+基本的な調味料)を使ったレシピを提案してください。指定外の主要食材は追加しないでください。ただし、アレルギーは絶対に含めないでください。",
};

export function buildSystemPrompt(params: {
  members: FamilyMember[];
  mode: SuggestionMode;
  feedback: FeedbackStat[];
  fridge: { name: string; amount?: string | null }[];
}) {
  const { members, mode, feedback, fridge } = params;

  const memberBlock = members.length
    ? members
        .map(
          (m) =>
            `- ${m.name}${m.age != null ? `(${m.age}歳)` : ""}: 好き=[${m.likes.join(", ") || "なし"}] / 苦手=[${m.dislikes.join(", ") || "なし"}] / アレルギー=[${m.allergies.join(", ") || "なし"}]`
        )
        .join("\n")
    : "(まだ家族の情報が未登録)";

  const fridgeBlock = fridge.length
    ? fridge.map((f) => `- ${f.name}${f.amount ? ` (${f.amount})` : ""}`).join("\n")
    : "(未登録)";

  const feedbackBlock = feedback.length
    ? feedback.map((f) => `- ${f.member_name}: 平均★${f.avg_rating.toFixed(1)} / ${f.comments.slice(0, 3).join(" / ")}`).join("\n")
    : "(まだフィードバックなし)";

  return `あなたは家庭料理のプロのシェフです。以下の家族のために、冷蔵庫の食材から美味しくて現実的なレシピを会話形式で提案します。

# 家族構成と好み
${memberBlock}

# 登録済み冷蔵庫の食材
${fridgeBlock}

# 過去の評価履歴
${feedbackBlock}

# 今回の提案モード
${modeInstructions[mode]}

# 返答ルール
- 会話は日本語・敬体で、親しみやすくポップなトーンで話してください(絵文字は控えめに1-2個まで)。
- ユーザーの発言から食材情報を抽出したら、確認してからレシピ提案に進んでください。
- レシピを提案する際は、必ず最後にレシピ部分だけを以下の JSON コードブロック形式で出力してください(複数可)。会話文とは分けてください。
- 主菜(main)・副菜(side)・汁物(soup) を組み合わせて提案するのが望ましいです。
- 苦手食材とアレルギーの配慮は絶対です。アレルギーは必ず避け、苦手食材は通常モードでは避け、克服モードでは工夫を加えてください。
- 基本的な調味料(塩、こしょう、醤油、みりん、酒、砂糖、酢、味噌、油、バター、小麦粉、片栗粉、だしの素、コンソメなど)は常備しているものとして扱い、有無を確認する必要はありません。特殊な調味料やスパイスが必要な場合のみ確認してください。

\`\`\`recipes
[
  {
    "title": "鶏もも肉とほうれん草のクリーム煮",
    "category": "main",
    "servings": 4,
    "cook_time_min": 25,
    "ingredients": [
      { "name": "鶏もも肉", "amount": "300g" },
      { "name": "ほうれん草", "amount": "1束" }
    ],
    "steps": [
      { "order": 1, "text": "鶏もも肉を一口大に切る" },
      { "order": 2, "text": "..." }
    ],
    "tips": "お子さまが食べやすいよう..."
  }
]
\`\`\`
`;
}

export function parseRecipesFromResponse(text: string): Omit<Recipe, "id" | "user_id" | "created_at" | "mode">[] {
  const match = text.match(/```recipes\s*([\s\S]*?)```/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1]);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((r) => ({
      title: String(r.title ?? "無題のレシピ"),
      category: (["main", "side", "soup", "other"].includes(r.category) ? r.category : "main") as Recipe["category"],
      servings: Number(r.servings ?? 2),
      cook_time_min: r.cook_time_min ? Number(r.cook_time_min) : null,
      ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
      steps: Array.isArray(r.steps) ? r.steps : [],
      tips: r.tips ?? null,
    }));
  } catch {
    return [];
  }
}

export function stripRecipeBlock(text: string): string {
  return text.replace(/```recipes[\s\S]*?```/g, "").trim();
}
