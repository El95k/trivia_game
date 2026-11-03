import { useState } from "react";
import type { Question, Quiz } from "../types";
import { uid } from "../storage";
import { generateQuestions, geminiConfigured } from "../gemini";
import { ANSWER_STYLES } from "./shapes";

interface Props {
  initial?: Quiz;
  onSave: (quiz: Quiz) => void;
  onCancel: () => void;
}

const TIMES = [10, 15, 20, 30, 45, 60];

const blankDraft = () => ({
  text: "",
  options: ["", "", "", ""],
  correct: 0,
  time: 20,
});

export default function Editor({ initial, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [questions, setQuestions] = useState<Question[]>(initial?.questions ?? []);
  const [draft, setDraft] = useState(blankDraft);
  const [error, setError] = useState("");

  // AI generation
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const addDraft = () => {
    const text = draft.text.trim();
    const options = draft.options.map((o) => o.trim());
    if (!text) return setError("Write the question first.");
    if (options.some((o) => !o)) return setError("Fill in all four answers.");
    setError("");
    setQuestions((qs) => [...qs, { id: uid(), text, options, correct: draft.correct, time: draft.time }]);
    setDraft((d) => ({ ...blankDraft(), time: d.time }));
  };

  const generate = async () => {
    if (!topic.trim()) return setAiError("Enter a topic.");
    setAiError("");
    setLoading(true);
    try {
      const generated = await generateQuestions(topic.trim(), count, difficulty, draft.time);
      setQuestions((qs) => [...qs, ...generated]);
      if (!title.trim()) setTitle(`${topic.trim()} quiz`);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const updateQuestion = (id: string, patch: Partial<Question>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const save = () => {
    if (!title.trim()) return setError("Give your quiz a title.");
    if (questions.length === 0) return setError("Add at least one question.");
    onSave({
      id: initial?.id ?? uid(),
      title: title.trim(),
      questions,
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="screen">
      <header className="topbar">
        <button className="btn btn-gray" onClick={onCancel}>
          ← Back
        </button>
        <h2>{initial ? "Edit quiz" : "Create quiz"}</h2>
        <button className="btn btn-green" onClick={save}>
          Save
        </button>
      </header>

      <main className="container narrow">
        {error && <div className="alert">{error}</div>}

        <div className="card">
          <label className="label">Quiz title</label>
          <input
            className="input"
            placeholder="Enter quiz title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="card">
          <h3>✨ Generate with Gemini</h3>
          {!geminiConfigured && (
            <div className="alert">
              Set <code>VITE_GEMINI_API_KEY</code> in <code>.env</code> and restart the dev server.
            </div>
          )}
          <div className="row wrap">
            <input
              className="input grow"
              placeholder="Topic, e.g. Solar System"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <select className="input" value={count} onChange={(e) => setCount(+e.target.value)}>
              {[3, 5, 8, 10, 15].map((n) => (
                <option key={n} value={n}>
                  {n} questions
                </option>
              ))}
            </select>
            <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          {aiError && <div className="alert">{aiError}</div>}
          <button className="btn btn-blue" onClick={generate} disabled={loading || !geminiConfigured}>
            {loading ? "Generating…" : "Generate questions"}
          </button>
        </div>

        <div className="card">
          <h3>Add a question manually</h3>
          <input
            className="input"
            placeholder="Type your question"
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
          />
          <div className="options-edit">
            {ANSWER_STYLES.map((s, i) => (
              <div className="opt-edit" key={i} style={{ background: s.color }}>
                <span className="shape">{s.shape}</span>
                <input
                  placeholder={`Answer ${i + 1}`}
                  value={draft.options[i]}
                  onChange={(e) => {
                    const options = [...draft.options];
                    options[i] = e.target.value;
                    setDraft({ ...draft, options });
                  }}
                />
                <input
                  type="radio"
                  name="correct"
                  title="Mark as correct"
                  checked={draft.correct === i}
                  onChange={() => setDraft({ ...draft, correct: i })}
                />
              </div>
            ))}
          </div>
          <div className="row">
            <label className="label inline">Time limit</label>
            <select
              className="input"
              value={draft.time}
              onChange={(e) => setDraft({ ...draft, time: +e.target.value })}
            >
              {TIMES.map((t) => (
                <option key={t} value={t}>
                  {t} seconds
                </option>
              ))}
            </select>
            <button className="btn btn-blue" onClick={addDraft}>
              + Add question
            </button>
          </div>
        </div>

        <h3 className="section-title">Questions ({questions.length})</h3>
        {questions.map((q, i) => (
          <div className="card q-item" key={q.id}>
            <div className="row spread">
              <strong>
                {i + 1}. {q.text}
              </strong>
              <div className="row">
                <select
                  className="input small"
                  value={q.time}
                  onChange={(e) => updateQuestion(q.id, { time: +e.target.value })}
                >
                  {TIMES.map((t) => (
                    <option key={t} value={t}>
                      {t}s
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-gray"
                  onClick={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))}
                >
                  ✕
                </button>
              </div>
            </div>
            <ul className="mini-options">
              {q.options.map((o, oi) => (
                <li key={oi} className={oi === q.correct ? "correct" : ""}>
                  <span style={{ color: ANSWER_STYLES[oi].color }}>{ANSWER_STYLES[oi].shape}</span> {o}
                  {oi === q.correct && " ✓"}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </main>
    </div>
  );
}
