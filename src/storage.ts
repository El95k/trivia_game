import type { Quiz } from "./types";

const KEY = "quizblast.quizzes.v1";

export const uid = () =>
  (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36));

export function loadQuizzes(): Quiz[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Quiz[]) : [];
  } catch {
    return [];
  }
}

export function saveQuizzes(quizzes: Quiz[]) {
  localStorage.setItem(KEY, JSON.stringify(quizzes));
}
