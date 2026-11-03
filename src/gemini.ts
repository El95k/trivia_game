import type { Question } from "./types";
import { uid } from "./storage";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash";

export const geminiConfigured = Boolean(API_KEY);

interface RawQuestion {
  question?: string;
  options?: string[];
  correctIndex?: number;
}

export async function generateQuestions(
  topic: string,
  count: number,
  difficulty: string,
  time: number,
): Promise<Question[]> {
  if (!API_KEY) {
    throw new Error("Missing VITE_GEMINI_API_KEY. Add it to your .env file and restart.");
  }

  const prompt = `Create ${count} multiple-choice trivia questions about "${topic}".
Difficulty: ${difficulty}.
Rules:
- Each question has exactly 4 answer options and exactly one correct answer.
- Keep questions under 140 characters and options under 60 characters.
- Vary the position of the correct answer.
- Questions must be factually accurate and unambiguous.
Return ONLY a JSON array like:
[{"question":"...","options":["A","B","C","D"],"correctIndex":0}]`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.9,
        },
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini request failed (${res.status}). ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned an empty response.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text.replace(/^```(?:json)?|```$/gm, "").trim());
  } catch {
    throw new Error("Could not parse Gemini's response as JSON.");
  }

  const list = (Array.isArray(parsed) ? parsed : []) as RawQuestion[];
  const questions: Question[] = list
    .filter(
      (q) =>
        typeof q.question === "string" &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correctIndex === "number" &&
        q.correctIndex >= 0 &&
        q.correctIndex < 4,
    )
    .map((q) => ({
      id: uid(),
      text: q.question as string,
      options: (q.options as string[]).map(String),
      correct: q.correctIndex as number,
      time,
    }));

  if (questions.length === 0) throw new Error("Gemini returned no usable questions. Try again.");
  return questions;
}
