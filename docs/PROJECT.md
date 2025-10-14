## Kalima — Project README

Last updated: 2025-10-08

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
  - `app/demo/page.tsx` — interactive demo with mock AI agent conversation
  - `app/dashboard/page.tsx` — displays user's enrolled curricula and progress
  - `app/curricula/page.tsx` — allows users to browse and enroll in curricula
  - `app/learn/page.tsx` — protected learning interface with voice recording
  - `app/api/speech/route.ts` — serverless API route for speech processing with modes
  - `app/api/demo/route.ts` — demo API with deterministic responses
  - `app/api/agent/route.ts` — main API for interacting with the AI agent
- `components/` — Reusable UI components
  - `components/landing-page.tsx` — landing page with updated messaging
  - `components/audio/VoiceRecorder.tsx` — robust speech recorder with refs
  - `components/enrollment/Enrollment.tsx` — enrollment form and logic
- `lib/supabase.ts` — Supabase client initialization
- `package.json` — dependencies and scripts
- `.github/workflows/ci.yml` — GitHub Actions CI workflow

### New Directories
- `lib/ai/` — Contains the core AI agent logic and OpenAI integrations.
- `lib/analysis/` — Contains utility functions for analysis, like pronunciation scoring.
- `lib/services/` — Contains services for interacting with the database, like `curriculumService.ts`.
Note: this list covers files relevant to auth, enrollment and speech processing (the current working area).

## Data model (inferred)

- Table: `profiles`
  - `id` (uuid) — user's Supabase id
  - `name` (string)
  - `email` (string)
  - `level` (string: beginner|intermediate|advanced)
  - `goals` (array or json)
- `curricula` — Stores course-level information.
- `lessons` — Stores individual lessons for each curriculum.
- `lesson_items` — Stores the specific content (e.g., phrases) for each lesson.
- `user_enrollments` — Links users to the curricula they are enrolled in.
- `user_lesson_progress` — Tracks a user's completion status and score for each lesson.


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

4. Demo Flow
   - The demo route `/demo` provides an interactive experience with a mock AI agent
   - Uses the VoiceRecorder for voice input and maintains a conversation history
   - Makes API calls to `/api/demo/route.ts` which provides deterministic responses based on keywords
   - Simulates a multi-turn dialogue to demonstrate the voice agent concept

## Known issues and risks (current)

1. OAuth redirect mismatch — If provider redirects to root (/) with token fragment rather than the `redirectTo` path the app uses (e.g., `/enrollment`), the client may not detect the session. Fix: configure exact redirect URIs in Supabase and Google.

2. VoiceRecorder considerations (low risk, after refactor)
   - Monitor memory usage with long recordings (audioChunks in refs)
   - Consider adding a maximum recording duration limit
   - Add visual feedback for recording errors
   - Consider streaming audio for longer recordings

3. `app/api/speech/route.ts` (server) — validation and performance
   - Input validation for `formData` entries is weak. The code trusts casts like `formData.get('audio') as File` and `formData.get('expectedText') as string` without checks.
   - The mock transcription uses randomness; for testing a deterministic mode would be better.
   - When integrating a real STT provider, be careful with file size limits and streaming vs in-memory buffering.

4. Supabase env vars
   - `lib/supabase.ts` uses non-null assertions on NEXT_PUBLIC env vars. If missing in Vercel, the app may fail; ensure env vars are configured correctly in all environments (dev, preview, prod).

## Immediate recommended improvements (high value, low risk)

1. Documentation: add this `docs/PROJECT.md` (✅ done) and maintain changelog entries for each change.
2. Enrollment UX improvements:
   - Add saving state (disable submit while saving), success feedback and error handling.
   - Client-side validation: required fields, email format, trim input, prevent duplicate goals.
   - Allow removing goals (small UI addition).
3. VoiceRecorder refactor: (✅ done)
   - Move recorder/recognition and chunk buffer to refs (✅ completed)
   - Initialize SpeechRecognition and MediaRecorder in separate effects (✅ completed)
   - Ensure `onstop` creates Blob from ref-held chunks reliably (✅ completed)
4. API route hardening: (✅ done)
   - Validate FormData entries, type checks, 400 errors (✅ completed)
   - Add `mode` flag for mock/real STT (✅ completed)
5. Auth hardening:
   - Implement authorization-code+PKCE flow for better security
   - Update redirect handling for code flow
6. Demo improvements:
   - Add more conversation scenarios
   - Improve error recovery in voice recording
   - Add loading states and transitions
   - Track demo engagement metrics
7. Landing page repositioning (marketing + UX)
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

## Development Environment Notes

### Terminal Usage
- Use `cmd` as the default terminal for all development tasks
- Avoid PowerShell due to permission restrictions
- Always run npm commands, git operations, and other CLI tools in cmd

### Environment Setup

#### Terminal Configuration
- Use Windows Command Prompt (cmd) as the default terminal in VS Code:
  1. Open VS Code Command Palette (Ctrl+Shift+P)
  2. Type 'Terminal: Select Default Profile'
  3. Select 'Command Prompt'
  4. Close and reopen VS Code
  5. Verify by opening a new terminal (it should be cmd)

#### Development Requirements
- Node.js v18+ required
- Use npm as package manager
- Required environment variables in .env.local:
  ```env
  OPENAI_API_KEY=your_api_key_here
  NEXT_PUBLIC_AI_MODE=mock  # Change to 'real' for OpenAI
  ```
- Install dependencies (in cmd terminal):
  ```cmd
  cd /d "D:\T42 bkp\D\Development\kalima"
  npm install openai @types/node
  ```

## Feature Tracking & Development Status

### 1. AI Conversation Agents (Core Innovation)
- [ ] AI Agent Architecture
  - [✅] Basic conversation flow with mock responses (v0.2.1)
  - [✅] Integration with LLM (GPT-4) (v0.2.5, v0.2.6)
  - [✅] Context-aware dialogue management (v0.3.9, v0.4.1)
  - [✅] Personality and teaching style configuration (v0.2.0)
  - [✅] Error recovery and conversation repair (v0.2.2)

- [ ] Teaching Capabilities
  - [ ] Dynamic lesson generation
  - [ ] Adaptive difficulty adjustment
  - [ ] Cultural context awareness
  - [ ] Multiple teaching methods
  - [✅] Progress-based conversation steering (v0.4.0)

- [ ] Agent Specialization
  - [✅] Conversation partner (casual dialogue) (v0.2.0)
  - [ ] Grammar tutor (formal instruction)
  - [ ] Cultural guide (contextual learning)
  - [✅] Pronunciation coach (detailed feedback) (v0.2.6)
  - [✅] Progress mentor (tracking & motivation) (v0.4.0)

### 2. Voice Interaction & Speech Processing
- [ ] Speech Recognition
  - [✅] Basic voice recording (WebSpeech API) (v0.1.3)
  - [✅] Mock STT responses
  - [✅] Real STT integration (Whisper) (v0.2.5)
  - [ ] Streaming support for long recordings
  - [ ] Multi-dialect recognition support

- [ ] Pronunciation Analysis
  - [✅] Basic mock scoring (v0.1.2)
  - [ ] Phoneme-level analysis
  - [ ] Real-time feedback
  - [ ] Accent adaptation
  - [✅] Detailed correction suggestions (v0.2.6)

### 3. Learning Experience & Progression
- [ ] User Profiling
  - [✅] Basic enrollment (level/goals) (v0.1.0)
  - [ ] Learning style assessment
  - [ ] Detailed skill assessment
  - [ ] Interest/context preferences
  - [ ] Schedule/availability tracking

- [ ] Curriculum Management
  - [✅] Structured lesson content (v0.3.0, v0.3.1, v0.3.5)
  - [ ] Dynamic difficulty progression
  - [ ] Personalized learning paths
  - [ ] Content recommendation engine
  - [ ] Review scheduling system

- [ ] Progress Tracking
  - [✅] Skill progression metrics (v0.3.2, v0.3.8)
  - [ ] Achievement system
  - [ ] Learning analytics
  - [ ] Performance insights
  - [ ] Progress visualization

### 4. Platform Infrastructure
- [ ] Authentication & Security
  - [✅] OAuth with Google (v0.1.0)
  - [✅] Basic user profiles
  - [ ] PKCE flow implementation
  - [ ] Session management
  - [ ] Rate limiting & abuse prevention

- [ ] Data Management
  - [✅] Basic Supabase integration
  - [✅] Analytics implementation (via RPC functions) (v0.3.6, v0.3.7)
  - [ ] Caching strategy
  - [ ] Data retention policies
  - [ ] Backup procedures

- [ ] Performance & Reliability
  - [✅] Basic error handling
  - [✅] Input validation
  - [ ] Load testing
  - [ ] Performance monitoring
  - [ ] Service redundancy

### 5. User Experience & Interface
- [ ] Conversation Interface
  - [✅] Basic voice recording UI (v0.1.3)
  - [✅] Demo conversation flow (v0.1.4, v0.2.8)
  - [ ] Rich conversation history
  - [ ] Visual pronunciation guides
  - [✅] Interactive corrections (v0.2.7)

- [ ] Progress & Stats
  - [✅] Dashboard implementation (v0.3.6)
  - [✅] Progress visualizations (v0.3.6)
  - [ ] Achievement displays
  - [ ] Learning insights
  - [ ] Goal tracking

- [ ] Mobile & Responsive
  - [✅] Basic responsive design
  - [ ] Mobile-optimized recording
  - [ ] Offline capabilities
  - [ ] Push notifications
  - [ ] Cross-device sync

Legend:
- [✅] Completed
- [ ] Planned/In Progress
- [-] Deferred

Next Priority Items:
1.  **Teaching Capabilities Enhancement:**
    *   Dynamic lesson generation
    *   Adaptive difficulty adjustment
2.  **Pronunciation Analysis Improvement:**
    *   Phoneme-level analysis
    *   Real-time feedback
3.  **Platform Infrastructure Hardening:**
    *   PKCE flow implementation for authentication
    *   Streaming support for long audio recordings

Updated: 2025-10-07

## Testing & quality gates

- Add unit tests for small pure functions (e.g., `levenshteinDistance`, `calculateStringSimilarity`, `generateFeedback`).
- Add integration tests (Jest + msw or similar) to mock Supabase responses and test the enrollment submit flow.
- Run linter and TypeScript type checks as part of CI.

## Deployment Configuration (Vercel)

### Environment Variables
Ensure the following are set in Vercel project settings for all environments (Production, Preview, Development):

1. Supabase Configuration:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. OpenAI Configuration:
   - `OPENAI_API_KEY` (marked as secret)
   - `NEXT_PUBLIC_AI_MODE` (set to 'real' for production)

### Deployment Settings
- Production Domain: `https://kalima-five.vercel.app`
- Framework Preset: Next.js
- Node.js Version: 18.x
- Build Command: `npm run build`
- Output Directory: `.next`

### OAuth Configuration
- Supabase redirect URL: `https://kalima-five.vercel.app/enrollment`
- Google OAuth client must include the same redirect URL
- Test OAuth flow in preview deployments

### Build Optimization
- Enable caching in `vercel.json`:
  ```json
  {
    "crons": [],
    "github": {
      "silent": true
    },
    "functions": {
      "app/api/**/*.ts": {
        "memory": 1024,
        "maxDuration": 10
      }
    }
  }
  ```

### Monitoring
- Enable Vercel Analytics
- Set up Error Monitoring
- Configure Performance Alerts

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
- 2025-10-14 v0.4.2 — Refactor: Improve Type Safety and Error Handling in AI Agent and API
  - Files changed: `lib/ai/agent.ts`, `app/api/agent/route.ts`
  - Reason: To improve the robustness and reliability of the AI agent and its corresponding API route.
  - Notes:
    - Fixed several bugs in `agent.ts` related to incorrect property access and asynchronous operations.
    - Hardened the `agent` API route by adding input validation and safer type handling for form data.
    - Removed unused imports and improved code quality.

- 2025-10-06 v0.1.0 — Project documentation added (this file). Initial analysis and recommendations seeded.
- 2025-10-06 v0.1.1 — Landing page repositioned and demo added.
- 2025-10-07 v0.1.2 — Server: speech API validation and mode flag added.
- 2025-10-07 v0.1.3 — VoiceRecorder robustness improvements
- 2025-10-07 v0.1.4 — Interactive demo conversation flow
- 2025-10-07 v0.2.0 — AI Agent core implementation
- 2025-10-07 v0.2.1 — OpenAI Integration Setup
- 2025-10-08 v0.2.2 — AI Core: Bug Fixes and Resilience
- 2025-10-08 v0.2.3 — Refactor: Speech API pronunciation logic
- 2025-10-08 v0.2.4 — Tests: Added unit tests for pronunciation analysis
- 2025-10-08 v0.2.5 — Feature: Integrate Whisper STT into Speech API
- 2025-10-08 v0.2.6 — Feature: Enhanced Pronunciation Feedback
- 2025-10-08 v0.2.7 — UI: Add Pronunciation Feedback Component
- 2025-10-08 v0.2.8 — UI: Integrate Feedback Component into Demo
- 2025-10-08 v0.3.0 — Architecture: Design Curriculum Management System
- 2025-10-08 v0.3.1 — DB: Add SQL Scripts for Curriculum System
- 2025-10-08 v0.3.2 — DB & Arch: Add User Progress Tracking System
- 2025-10-08 v0.3.3 — DB: Consolidated SQL Scripts for Curriculum & Progress
- 2025-10-08 v0.3.4 — Feature: Add Curricula Discovery Page
- 2025-10-08 v0.3.5 — DB: Add Sample Curriculum Data
- 2025-10-08 v0.3.6 — Feature: User Dashboard for Progress Tracking
- 2025-10-08 v0.3.7 — Feature: Implement "Continue Learning" on Dashboard
- 2025-10-08 v0.3.8 — Feature: Mark Lessons as Complete
- 2025-10-08 v0.3.9 — Arch: Connect AI Agent to Curriculum System
- 2025-10-08 v0.4.0 — Feature: Implement `getNextLesson` Service for AI Agent
- 2025-10-08 v0.4.1 — Feature: Pass Learning Context to AI Agent

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
