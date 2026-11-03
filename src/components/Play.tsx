import { useEffect, useMemo, useRef, useState } from "react";
import type { Quiz } from "../types";
import { ANSWER_STYLES } from "./shapes";

interface Props {
  quiz: Quiz;
  onExit: () => void;
}

type Phase = "ready" | "question" | "reveal" | "done";

export default function Play({ quiz, onExit }: Props) {
  const questions = useMemo(() => quiz.questions, [quiz]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [gained, setGained] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const q = questions[index];
  const startRef = useRef(0);

  const settle = (choice: number | null) => {
    if (phase !== "question") return;
    const elapsed = (Date.now() - startRef.current) / 1000;
    const ok = choice !== null && choice === q.correct;
    // Kahoot-like: up to 1000 points, scaled down to 500 for the slowest answer
    const points = ok ? Math.round(1000 * (1 - Math.min(elapsed / q.time, 1) / 2)) : 0;
    setPicked(choice);
    setGained(points);
    setScore((s) => s + points);
    setStreak((s) => (ok ? s + 1 : 0));
    if (ok) setCorrectCount((c) => c + 1);
    setPhase("reveal");
  };

  // Always point at the latest settle() so the interval never uses stale state.
  const settleRef = useRef(settle);
  settleRef.current = settle;

  // "Get ready" splash, then start the question
  useEffect(() => {
    if (phase !== "ready") return;
    const t = setTimeout(() => {
      startRef.current = Date.now();
      setTimeLeft(q.time);
      setPhase("question");
    }, 1500);
    return () => clearTimeout(t);
  }, [phase, q]);

  // Countdown timer
  useEffect(() => {
    if (phase !== "question") return;
    const id = setInterval(() => {
      const left = q.time - (Date.now() - startRef.current) / 1000;
      if (left <= 0) {
        setTimeLeft(0);
        settleRef.current(null);
      } else {
        setTimeLeft(left);
      }
    }, 100);
    return () => clearInterval(id);
  }, [phase, q]);

  const next = () => {
    if (index + 1 >= questions.length) return setPhase("done");
    setIndex(index + 1);
    setPicked(null);
    setPhase("ready");
  };

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setGained(0);
    setStreak(0);
    setCorrectCount(0);
    setPhase("ready");
  };

  if (phase === "done") {
    const pct = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="screen center purple">
        <h1 className="logo">Game over!</h1>
        <div className="card result">
          <div className="big-score">{score.toLocaleString()}</div>
          <p>points</p>
          <p>
            {correctCount} / {questions.length} correct ({pct}%)
          </p>
        </div>
        <div className="row">
          <button className="btn btn-green big" onClick={restart}>
            Play again
          </button>
          <button className="btn btn-white big" onClick={onExit}>
            Home
          </button>
        </div>
      </div>
    );
  }

  if (phase === "ready") {
    return (
      <div className="screen center purple">
        <p className="muted-light">
          Question {index + 1} of {questions.length}
        </p>
        <h1 className="ready-text">Get ready…</h1>
      </div>
    );
  }

  const revealing = phase === "reveal";
  const wasCorrect = picked === q.correct;
  const fraction = Math.max(0, timeLeft / q.time);

  return (
    <div className="screen play">
      <header className="play-top">
        <div className="pill">
          {index + 1} / {questions.length}
        </div>
        <div className="pill">🔥 {streak}</div>
        <div className="pill">{score.toLocaleString()} pts</div>
        <button className="btn btn-gray small" onClick={onExit}>
          Quit
        </button>
      </header>

      <div className="question-box">{q.text}</div>

      <div className="timer-wrap">
        <div className={`timer-circle ${timeLeft <= 5 && !revealing ? "urgent" : ""}`}>
          {revealing ? (picked === null ? "⏰" : wasCorrect ? "✓" : "✕") : Math.ceil(timeLeft)}
        </div>
        <div className="timer-bar">
          <div
            className="timer-fill"
            style={{ width: `${(revealing ? 0 : fraction) * 100}%` }}
          />
        </div>
      </div>

      <div className="answers">
        {q.options.map((opt, i) => {
          const s = ANSWER_STYLES[i];
          let cls = "answer";
          if (revealing) cls += i === q.correct ? " is-correct" : " is-wrong";
          if (revealing && picked === i) cls += " chosen";
          return (
            <button
              key={i}
              className={cls}
              style={{ background: s.color }}
              disabled={revealing}
              onClick={() => settle(i)}
            >
              <span className="shape">{s.shape}</span>
              <span className="answer-text">{opt}</span>
            </button>
          );
        })}
      </div>

      {revealing && (
        <div className={`feedback ${wasCorrect ? "good" : "bad"}`}>
          <div>
            <strong>
              {picked === null ? "Time's up!" : wasCorrect ? "Correct!" : "Incorrect"}
            </strong>
            {wasCorrect && <span> +{gained} points</span>}
          </div>
          <button className="btn btn-white" onClick={next}>
            {index + 1 >= questions.length ? "Finish" : "Next →"}
          </button>
        </div>
      )}
    </div>
  );
}
