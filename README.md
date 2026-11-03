# QuizBlast

A Kahoot-style trivia app: create quizzes (manually or with Gemini), then play them against a per-question timer. Vite + React + TypeScript, installable as a PWA.

## Setup

```bash
npm install
cp .env.example .env     # then put your Gemini API key in .env
npm run dev
```

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: type-check and build to `dist/` (generates the service worker and manifest)
- `npm run preview`: serve the production build (test PWA install here)

## How it works

- **Create**: "Create quiz" → add questions by hand (4 answers, pick the correct one, set a time limit) and/or generate them with Gemini by topic, count and difficulty.
- **Play**: each question has a countdown (timer circle + bar). Faster correct answers score more (1000 down to 500); when time runs out the question is marked unanswered.
- **Storage**: quizzes are saved in `localStorage`.

## Config

| Variable | Purpose |
| --- | --- |
| `VITE_GEMINI_API_KEY` | Gemini API key (required for AI generation) |
| `VITE_GEMINI_MODEL` | Optional model override (default `gemini-2.0-flash`) |

**Security note:** `VITE_*` variables are bundled into the client, so anyone using a deployed build can extract the key. That is fine for local use. For a public deployment, proxy Gemini calls through a small backend and keep the key server-side (only `src/gemini.ts` would need to change).

## Project layout

```
src/
  App.tsx              view switching + persistence
  gemini.ts            Gemini question generation
  storage.ts           localStorage helpers
  components/
    Home.tsx           quiz list
    Editor.tsx         create/edit quiz, AI generation
    Play.tsx           game loop + timer
    shapes.tsx         answer colors/shapes
  styles.css           Kahoot-like theme
public/                PWA icons
vite.config.ts         Vite + PWA manifest/service worker
```
