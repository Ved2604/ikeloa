const CACHE = new Map<string, string>();

const getContextLines = (
  lines: string[],
  lineIndex: number,
  contextSize: number = 5,
): string => {
  const start = Math.max(0, lineIndex - contextSize);
  const end = Math.min(lines.length - 1, lineIndex + contextSize);
  return lines.slice(start, end + 1).join("\n");
};

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

export const fetchLLMExplanation = async (
  word: string,
  context: string,
  language: string,
): Promise<string> => {
  const cacheKey = `${word}::${context.slice(0, 100)}`;
  if (CACHE.has(cacheKey)) {
    return CACHE.get(cacheKey)!;
  }

  if (!GEMINI_API_KEY) {
    return `**${word}** — Gemini API key not configured`;
  }

  const prompt = `You are a code documentation assistant embedded in a code editor.

A developer is hovering over the word "${word}" in a ${language} file.

Here is the surrounding code context:
\`\`\`${language}
${context}
\`\`\`

Explain what "${word}" is in this specific context. Be concise — 2-3 sentences maximum.
Focus on what it does in THIS code, not just a generic definition.
If it is a variable name, explain what it likely represents based on context.
If it is a function call, explain what it likely does.
Format your response in plain text. No markdown headers. No bullet points.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 150,
            temperature: 0.3,
          },
        }),
      },
    );

    const data = (await response.json()) as {
      candidates: Array<{
        content: {
          parts: Array<{ text: string }>;
        };
      }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

    if (!text) return `**${word}** — no explanation available`;

    CACHE.set(cacheKey, text);
    return text;
  } catch (err) {
    console.error("[llmHover] Gemini API call failed:", err);
    return `**${word}** — could not fetch explanation`;
  }
};

export const buildContextFromModel = (
  modelContent: string,
  lineNumber: number,
  language: string,
): string => {
  const lines = modelContent.split("\n");
  const context = getContextLines(lines, lineNumber - 1);
  return context;
};
