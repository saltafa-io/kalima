# Kalima — Project Structure

This document provides a detailed breakdown of the key files and directories in the Kalima project.

## Project File Structure

```txt
kalima/
├── app/
│   ├── (pages)/
│   │   ├── curricula/
│   │   │   ├── CurriculaClient.tsx # Client component for browsing/enrolling in curricula.
│   │   │   └── page.tsx            # Server component to fetch and display curricula.
│   │   ├── dashboard/
│   │   │   ├── DashboardClient.tsx # Client component for dashboard UI.
│   │   │   └── page.tsx            # Server component for fetching dashboard data.
│   │   ├── auth/callback/route.ts  # Server-side route for OAuth code exchange.
│   │   ├── auth/page.tsx         # Handles user sign-in and session state.
│   │   ├── settings/page.tsx     # Page for user profile and settings management.
│   │   ├── demo/page.tsx           # Interactive demo of the AI agent conversation.
│   │   ├── enrollment/page.tsx     # Page for new users to create their profile.
│   │   ├── learn/page.tsx          # The main learning interface for lessons.
│   │   ├── middleware.ts         # Handles session management for server-side requests.
│   │   └── page.tsx                # The application's root landing page.
│   ├── api/
│   │   ├── agent/route.ts          # API for AI agent interactions.
│   │   ├── demo/route.ts           # API for the interactive demo.
│   │   └── speech/route.ts         # API for speech processing (transcription/analysis).
│   └── layout.tsx                  # Root layout for the Next.js application.
├── components/
│   ├── auth/                     # Authentication-related components.
│   │   └── UserMenu.tsx          # Client component for user dropdown menu.
│   ├── audio/VoiceRecorder.tsx     # Component for recording user audio.
│   ├── enrollment/Enrollment.tsx   # The enrollment form component.
│   ├── feedback/
│   │   └── PronunciationFeedback.tsx # Displays pronunciation feedback to the user.
│   └── landing-page.tsx            # The main component for the marketing landing page.
├── lib/
│   ├── ai/                         # AI-related logic and integrations (e.g., OpenAI).
│   ├── analysis/                   # Utility functions for analysis (e.g., scoring).
│   ├── services/                   # Database services (e.g., curriculumService).
│   └── supabase/                   # Supabase client management.
│       ├── client.ts             # Client-side Supabase client (for 'use client' components).
│       └── server.ts             # Server-side Supabase client (for Server Components/Actions).
├── docs/
│   └── PROJECT.md                  # This project documentation file.
├── tsconfig.json                   # TypeScript configuration with path aliases.
└── package.json                    # Project dependencies and scripts.
```
## Repository layout (important files)

- `app/` — Next.js app routes and pages
  - `app/page.tsx` — root landing page (renders `components/landing-page.tsx`)
  - `app/layout.tsx` — root layout, now includes the `UserMenu` component for authenticated users.
  - `app/middleware.ts` — Supabase middleware for refreshing user sessions on server requests.
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
  - `components/auth/UserMenu.tsx` — A new client component that provides a dropdown menu for logged-in users to navigate to settings or log out.
  - `components/landing-page.tsx` — landing page with updated messaging
  - `components/audio/VoiceRecorder.tsx` — robust speech recorder with refs
  - `components/enrollment/Enrollment.tsx` — enrollment form and logic
- `lib/supabase/client.ts` — Client-side Supabase client initialization.
- `lib/supabase/server.ts` — Server-side Supabase client initialization.
- `package.json` — dependencies and scripts
- `.github/workflows/ci.yml` — GitHub Actions CI workflow