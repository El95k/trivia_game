import { useState } from "react";
import type { Quiz, View } from "./types";
import { loadQuizzes, saveQuizzes } from "./storage";
import Home from "./components/Home";
import Editor from "./components/Editor";
import Play from "./components/Play";

export default function App() {
  const [view, setView] = useState<View>({ name: "home" });
  const [quizzes, setQuizzes] = useState<Quiz[]>(loadQuizzes);

  const persist = (next: Quiz[]) => {
    setQuizzes(next);
    saveQuizzes(next);
  };

  const upsert = (quiz: Quiz) => {
    const exists = quizzes.some((q) => q.id === quiz.id);
    persist(exists ? quizzes.map((q) => (q.id === quiz.id ? quiz : q)) : [quiz, ...quizzes]);
    setView({ name: "home" });
  };

  const remove = (id: string) => persist(quizzes.filter((q) => q.id !== id));

  if (view.name === "edit") {
    const existing = quizzes.find((q) => q.id === view.quizId);
    return <Editor initial={existing} onSave={upsert} onCancel={() => setView({ name: "home" })} />;
  }

  if (view.name === "play") {
    const quiz = quizzes.find((q) => q.id === view.quizId);
    if (quiz) return <Play quiz={quiz} onExit={() => setView({ name: "home" })} />;
  }

  return (
    <Home
      quizzes={quizzes}
      onCreate={() => setView({ name: "edit" })}
      onEdit={(id) => setView({ name: "edit", quizId: id })}
      onPlay={(id) => setView({ name: "play", quizId: id })}
      onDelete={remove}
    />
  );
}
