export interface Question {
  id: string;
  text: string;
  /** Always 4 options */
  options: string[];
  /** Index (0-3) of the correct option */
  correct: number;
  /** Seconds allowed to answer */
  time: number;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  updatedAt: number;
}

export type View =
  | { name: "home" }
  | { name: "edit"; quizId?: string }
  | { name: "play"; quizId: string };
