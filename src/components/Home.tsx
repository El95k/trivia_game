import type { Quiz } from "../types";

interface Props {
  quizzes: Quiz[];
  onCreate: () => void;
  onEdit: (id: string) => void;
  onPlay: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function Home({ quizzes, onCreate, onEdit, onPlay, onDelete }: Props) {
  return (
    <div className="screen">
      <header className="hero">
        <h1 className="logo">QuizBlast!</h1>
        <p>Create a quiz. Beat the clock.</p>
        <button className="btn btn-white big" onClick={onCreate}>
          + Create quiz
        </button>
      </header>

      <main className="container">
        {quizzes.length === 0 ? (
          <div className="card empty">
            <p>No quizzes yet. Create your first one, with a little help from Gemini.</p>
          </div>
        ) : (
          <div className="grid">
            {quizzes.map((q) => (
              <div className="card quiz-card" key={q.id}>
                <h3>{q.title}</h3>
                <p className="muted">
                  {q.questions.length} question{q.questions.length === 1 ? "" : "s"}
                </p>
                <div className="row">
                  <button
                    className="btn btn-green"
                    disabled={q.questions.length === 0}
                    onClick={() => onPlay(q.id)}
                  >
                    ▶ Play
                  </button>
                  <button className="btn btn-gray" onClick={() => onEdit(q.id)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-gray"
                    onClick={() => {
                      if (confirm(`Delete "${q.title}"?`)) onDelete(q.id);
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
