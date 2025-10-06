## Kalima — Project README

Last updated: 2025-10-06

This document is the single source-of-truth for the Kalima project. It describes the architecture, important files, environment variables, deployment notes, current known issues, recommended next steps, and includes a changelog template (date/versioned) that we will update as work progresses.

## Purpose

Kalima is an AI-powered platform for learning and practicing spoken Arabic. The goal is to provide personalized learning through AI voice agents that simulate real conversation partners and tutors — not just pronunciation feedback. Kalima helps learners gain confidence speaking, understand everyday spoken Arabic (Modern Standard and dialects), and practice naturally until they feel comfortable conversing with others.

Users sign in with OAuth (Supabase + Google), enroll by providing a profile (name, email, level, learning goals) and then interact with voice-first lessons and AI agents. The project will combine speech-to-text (e.g., Whisper or similar), generative AI for personalized content and feedback, and curriculum logic that adapts to each learner's progress.

## Tech stack

- Frontend: Next.js (App Router), React 19, TypeScript
- Styling: Tailwind CSS
- Auth & DB: Supabase (Auth + Postgres)
- Hosting: Vercel
- Key libs: @supabase/supabase-js, @supabase/auth-ui-react, lucide-react

## Repository layout (important files)

- `app/` — Next.js app routes and pages
  - `app/page.tsx` — root landing page (renders `components/landing-page.tsx`)
  - `app/layout.tsx` — root layout
  - `app/auth/page.tsx` — Supabase Auth UI page and auth state handler
  - `app/enrollment/page.tsx` — enrollment route (protects route and passes userId to component)
  - `app/api/speech/route.ts` — serverless API route for speech processing (currently mock implementation)
- `components/` — UI components
  - `components/landing-page.tsx` — landing page content
  - `components/audio/VoiceRecorder.tsx` — client-side speech recorder and recognition
  - `components/enrollment/Enrollment.tsx` — enrollment form and logic
- `lib/supabase.ts` — Supabase client initialization
- `package.json` — dependencies and scripts

Note: this list covers files relevant to auth, enrollment and speech processing (the current working area).

## Data model (inferred)

- Table: `profiles`
  - `id` (uuid) — user's Supabase id
  - `name` (string)
  - `email` (string)
  - `level` (string: beginner|intermediate|advanced)
  - `goals` (array or json)

Adjust the actual Postgres types in Supabase if needed. The app reads/writes these fields via the Supabase client.

## Authentication & OAuth redirect notes

- The app uses Supabase Auth with Google as a provider via `@supabase/auth-ui-react`.
- The `Auth` component in `app/auth/page.tsx` sets `redirectTo` to `${window.location.origin}/auth` (local dev), but in production you must register the exact Vercel URL as an authorized redirect in both Supabase and the Google OAuth client.
- Current deployed site: https://kalima-five.vercel.app
- You indicated you've updated Supabase redirect URL to `https://kalima-five.vercel.app/enrollment`. That is valid — make sure the same URL is added as an Authorized Redirect URI in the Google Cloud Console for the OAuth Client ID.

Why this matters
- OAuth redirect URIs must match exactly. If a provider redirects to the wrong path (for example `/`), the token fragment may be lost from the page that expects it, and the client will not finish the sign-in flow.

## Key client/server flows

1. Sign-in flow
   - User visits `/auth` and uses Supabase Auth UI to sign in with Google.
   - After provider consent, Supabase/Google redirect back to a configured redirect URI with a session token (often returned in the URL fragment for implicit flow) or a code for PKCE flow.
   - Client calls `supabase.auth.getSession()` and subscribes to `supabase.auth.onAuthStateChange` to detect the session and redirect the user accordingly.

2. Enrollment flow
   - Protected route `/enrollment` uses client-side `supabase.auth.getSession()` to ensure a session exists.
   - If no session, app redirects to `/auth`.
   - If session exists, the `Enrollment` component fetches the `profiles` row for the current user and populates the form.
   - User edits fields (name/email/level/goals) and submits. The client updates the `profiles` row and then routes to `/learn` with encoded lessons.

3. Speech processing (prototype)
   - `VoiceRecorder` uses Web Speech API (SpeechRecognition) for live transcription and MediaRecorder to capture audio Blobs.
   - The API `app/api/speech/route.ts` currently simulates transcription (returns mocked transcribed text and pronunciation scoring). This is a placeholder for integration with an external Speech-to-Text service (OpenAI Whisper or similar).

Note: the long-term vision is to use speech transcription and generative models to run interactive voice agents (conversational tutors) that can produce dialogues, role-play scenarios, and adaptive exercises tailored to the user's level and goals.

## Known issues and risks (current)

1. OAuth redirect mismatch — If provider redirects to root (/) with token fragment rather than the `redirectTo` path the app uses (e.g., `/enrollment`), the client may not detect the session. Fix: configure exact redirect URIs in Supabase and Google.

2. VoiceRecorder potential bugs (medium risk)
   - `useEffect` dependencies in `VoiceRecorder.tsx` may cause repeated getUserMedia calls and duplicate event handlers.
   - `audioChunks` is stored in state and used inside `onstop`/`ondataavailable` closures, which can lead to stale closures and empty blobs.
   - Recognition and MediaRecorder lifecycles are not tightly coordinated; recognition results don't always stop the media recorder.
   - Type declarations for SpeechRecognition events might not exist in TypeScript DOM lib.

3. `app/api/speech/route.ts` (server) — validation and performance
   - Input validation for `formData` entries is weak. The code trusts casts like `formData.get('audio') as File` and `formData.get('expectedText') as string` without checks.
   - The mock transcription uses randomness; for testing a deterministic mode would be better.
   - When integrating a real STT provider, be careful with file size limits and streaming vs in-memory buffering.

4. Supabase env vars
   - `lib/supabase.ts` uses non-null assertions on NEXT_PUBLIC env vars. If missing in Vercel, the app may fail; ensure env vars are configured correctly in all environments (dev, preview, prod).

## Immediate recommended improvements (high value, low risk)

1. Documentation: add this `docs/PROJECT.md` (done) and maintain changelog entries for each change.
2. Enrollment UX improvements:
   - Add saving state (disable submit while saving), success feedback and error handling.
   - Client-side validation: required fields, email format, trim input, prevent duplicate goals.
   - Allow removing goals (small UI addition).
3. VoiceRecorder refactor:
   - Move recorder/recognition and chunk buffer to refs (avoid re-init on renders).
   - Initialize SpeechRecognition and MediaRecorder in separate one-time effects.
   - Ensure `onstop` creates Blob from ref-held chunks and calls `onRecordingComplete` reliably.
4. API route hardening:
   - Validate FormData entries, check types, return 400 on invalid input.
   - Add a `mode` flag (mock|real) for deterministic tests and to integrate the real STT API later.
5. Auth hardening:
   - Prefer the authorization-code+PKCE flow for better security (Supabase supports PKCE). This will return a code in the query which the client can exchange instead of tokens in fragments.

6. Landing page repositioning (marketing + UX)
    - Goal: reposition the landing page copy and visual emphasis away from a pronunciation-only message toward a holistic, confidence-first spoken-Arabic learning platform powered by AI voice agents.
    - Key messages to highlight on the landing page:
       - "Speak Arabic with confidence — practice anytime with AI voice agents."
       - "Personalized, voice-first lessons that adapt to your level and goals."
       - "Role-play real conversations, get instant feedback, and build fluent speaking habits."
    - Primary CTAs:
       - "Try the AI Agent" (opens an interactive demo where users can speak with an AI agent)
       - "Start Learning" (sign-up / enrollment)
    - Feature tiles to replace or reword existing ones:
       - AI Voice Agents — interactive conversation partners and tutors
       - Conversation-first curriculum — practical phrases and dialogues for daily life
       - Personalized Pathways — lessons adapt to your strengths and weaknesses
       - Multiple Dialects & Real-world Speech — exposure to MSA and regional variants
       - Progress & Confidence Tracking — metrics that show speaking improvements
    - Visual / UX suggestions:
       - Replace hero copy from "Master Arabic Speaking" / "AI-Powered Pronunciation" to confidence-focused statements above.
       - Replace static pronunciation-focused demo button with a "Try AI Agent" flow that simulates a short role-play (2–3 turns) using the existing `VoiceRecorder` and `app/api/speech/route.ts` (mock mode can simulate agent responses).
       - Use user-friendly visuals (people speaking, conversational bubbles, microphone iconography). Keep Arabic typography accents but emphasize human conversation.
    - Implementation steps (concrete files to change):
       - `components/landing-page.tsx` — update hero copy, features array, and CTA handlers.
       - `components/audio/VoiceRecorder.tsx` — ensure the demo mode can be used by the hero "Try AI Agent" CTA (expose a callback to start a short interactive demo).
       - `app/page.tsx` — ensure it routes to updated landing page component (already imports it).
       - Optionally add a lightweight demo route `/demo` that runs a short AI-agent conversation using mock responses from the existing `app/api/speech/route.ts`.
    - Example hero copy (pick one):
       - "Speak Arabic with confidence. Practice with AI voice agents anytime, anywhere."
       - Subheading: "Personalized voice-first lessons and conversation partners to help you speak naturally." 
    - Quick A/B friendly variant for CTA text:
       - Variant A: Primary CTA — "Try the AI Agent"; Secondary CTA — "Start Learning"
       - Variant B: Primary CTA — "Start Speaking"; Secondary CTA — "Try Demo"

    - Measurement: track clicks on the demo CTA and sign-ups from the hero. Monitor engagement of the demo flow to iterate on messaging.

## Testing & quality gates

- Add unit tests for small pure functions (e.g., `levenshteinDistance`, `calculateStringSimilarity`, `generateFeedback`).
- Add integration tests (Jest + msw or similar) to mock Supabase responses and test the enrollment submit flow.
- Run linter and TypeScript type checks as part of CI.

## Deployment notes (Vercel)

- Ensure the following Vercel environment variables are set for each environment (Production, Preview, Development if used):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Supabase redirect URLs must include your deployed domain with the exact path used for redirects. Current production domain: `https://kalima-five.vercel.app` and you said the redirect is currently set to `https://kalima-five.vercel.app/enrollment` — confirm the Google OAuth client also contains the same redirect.

## Roadmap (short/medium term)

Priority 1 (next 1-2 weeks)
- Fix enrollment UX: saving state, validation, delete goal.
- Refactor `VoiceRecorder` to be robust and stop MediaRecorder correctly.
- Add server-side validation to `app/api/speech/route.ts`.

Priority 2 (1 month)
- Integrate a real speech-to-text backend (OpenAI Whisper or similar).
- Replace mock scoring with phoneme-level scoring or integrate an external scoring service.
- Add tests for enrollment flow.

Priority 3 (2+ months)
- Add analytics and progress tracking in DB.
- Add lessons management and personalized curriculum generation.

## Changelog (versioned entries)

Use this area to record every change to the project with date and version. Add a new entry for each pull request / change you make.

### Unreleased
- 2025-10-06 v0.1.0 — Project documentation added (this file). Initial analysis and recommendations seeded.
- 2025-10-06 v0.1.1 — Landing page repositioned and demo added.
   - Files changed: `components/landing-page.tsx`, `app/demo/page.tsx`, `app/api/demo/route.ts`, `components/audio/VoiceRecorder.tsx`.
   - Reason: Update messaging to emphasize AI voice agents and add a mock AI-agent demo for faster iteration.
   - Notes: `VoiceRecorder` was refactored to use refs and improve lifecycle handling. Demo API returns deterministic mock replies. Demo UI supports multi-turn conversation history.

- 2025-10-07 v0.1.2 — Server: speech API validation and mode flag added.
   - Files changed: `app/api/speech/route.ts`.
   - Reason: Harden server endpoint to validate multipart/form-data input, enforce file size and mime-type limits, and provide a `mode` flag (`mock|real`) so demo clients can request mock deterministic responses or opt into real STT when configured.
   - Notes: Real transcription mode returns 501 unless `OPENAI_API_KEY` or `WHISPER_API_KEY` is provided; size limit set to 5MB. Returns clear JSON error codes for invalid input.

### Template for future entries
- YYYY-MM-DD vX.Y.Z — Short description of changes
  - Files changed: list
  - Reason: why
  - Notes: any follow-ups

## How to contribute and use this doc

- When you complete any change, add a changelog entry to this file with date/version and short notes.
- For every code change that alters behavior, add a short note in the changelog and update this doc's Known Issues or Roadmap if the change addresses one of those.

---

If you'd like, I can now:
1. Implement the immediate Enrollment improvements (saving state, validation, delete goal) and add changelog entry; or
2. First refactor `VoiceRecorder` (higher technical risk but important); or
3. Add server-side validation to `app/api/speech/route.ts`.

Tell me which item to do next and I'll make the code change and add a versioned changelog entry here.
