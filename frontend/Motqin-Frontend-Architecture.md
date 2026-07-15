# Motqin Frontend — Architecture Overview

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · TanStack React Query · Axios

## 1. Top-level layout

The project has two top-level directories that matter architecturally: `app/`, which is both the routing table and the home for shared application logic (Next.js App Router turns the folder structure itself into the URL structure), and `components/`, which holds every reusable piece of UI that isn't a page.

## 2. What each folder does, and why

| Folder | What's in it | Why it exists |
|---|---|---|
| `app/(public)/` | Home, about, privacy, data-deletion pages | Route group for pages anyone can visit without logging in. The parentheses mean it doesn't appear in the URL — it's purely organizational, giving these pages their own layout without an auth guard. |
| `app/(auth)/` | Sign-in, sign-up, verify-phone, complete-profile | A second route group for the unauthenticated flow of *becoming* a user. Kept separate from `(public)` because it needs its own layout (no nav bar, focused single-task screens) and separate from `(protected)` because none of it requires a session yet. |
| `app/(protected)/` | Subjects, lessons, quiz, subscription, planner, profile, AI Teacher | Everything that requires a logged-in student. One shared layout (`layout.tsx`) mounts the nav bar and checks for a valid access token once, so every page inside doesn't have to repeat that logic. |
| `app/hooks/` | `useGetLessons`, `useGetQuestionsByLesson`, `useAddQuestion`, `useAutoRefresh`, `useLogout`, etc. | The data layer every page actually talks to. Each hook wraps a service call in React Query, so a page just asks "give me the lessons for this subject" and gets loading/error state, caching, and refetching for free — no component re-implements fetch logic by hand. |
| `app/services/` | `lesson.service.ts`, `question.service.ts`, `auth.services.ts`, `motqin.ts` (subjects), `ai-teacher.services.ts` | The *only* files that call the configured Axios instance directly. Each one is a thin, typed wrapper around one backend resource. If an endpoint's shape changes, there's exactly one place to fix it. |
| `app/types/` | `motqin.types.ts`, `auth.types.ts`, `planner.types.ts` | Global ambient TypeScript interfaces (`declare global`) mirroring the backend's actual DTOs — pulled from the live Swagger spec, not guessed. Because they're global, any component can reference `Question` or `Lesson` directly with no import, while still getting compile-time errors if a field is used incorrectly. |
| `app/constants/` | `planner.constants.ts` (API route paths), `governorates.constants.ts` | Static configuration — most importantly `API_ROUTES`, a single source of truth for every backend path so a route never needs to be hand-typed twice. |
| `app/data/` | `subscriptionPlans.ts`, `days.ts` | Static/local data that doesn't come from the backend at all (e.g. the three pricing tiers, the days-of-week list for the planner). Kept distinct from `services/` specifically because it never touches the network. |
| `app/lib/` | `axios.ts`, `auth-storage.ts`, `api-error.ts`, `utils.ts`, `validators/` | Cross-cutting infrastructure that almost every feature depends on but that isn't itself a feature: the configured Axios instance and its token-refresh interceptor, where auth tokens are read/written, how API errors get turned into readable messages, the `cn()` class-merging helper, form validation rules. |
| `app/providers/` | `providers.tsx`, `authProvider.tsx`, `queryProvider.tsx`, `googleProvider.tsx`, `FacebookProvider.tsx` | React context providers mounted once at the root: theming, React Query's client, the current-user context, third-party SDK setup. Centralizing these means the rest of the app never has to think about *how* auth state or theme state gets there — it just consumes it. |
| `components/` (top level) | `QuestionCard`, `QuizCard`, `PlanCard`, `AddQuestionForm`, `LessonCard`, `SubjectCard`, `DayCard`, chat components, etc. | Feature-level UI — components that encode actual product behavior (a question card that flips, a plan card that animates its price). Reusable across pages, but not generic building blocks. |
| `components/ui/` | `button.tsx`, `select.tsx`, `Skeleton.tsx` | Low-level, style-only primitives with no business logic. Kept separate from feature components so a primitive can be restyled without touching anything that depends on it. |
| `components/Navbar/` | `Nav.tsx`, `userMenu.tsx`, `ThemeMenu.tsx` | The app shell's navigation and its dropdown menus — grouped together because they're really one UI unit split across a few files. |
| `components/auth/` | `ProtectedRoute.tsx` | A small, dedicated component whose only job is gating a subtree behind authentication — isolated so the auth-guarding logic lives in exactly one place. |

**A naming convention worth calling out:** some components are split into a plain file and a `*.client.tsx` file (e.g. `LessonCard.tsx` / `LessonCard.client.tsx`). The plain version is a presentational component; the `.client` version is a thin wrapper that adds interactivity (hover state, etc.) and is explicitly marked as a Client Component. This makes the server/client boundary visible in the file tree itself, instead of being buried inside a `"use client"` directive you'd only notice by opening the file.

## 3. Why this overall approach

**Route groups over one flat `app/` folder.** `(public)`, `(auth)`, and `(protected)` let three very different audiences — a visitor, someone signing up, a logged-in student — each get exactly the layout and guard they need, without that logic leaking into pages that don't need it, and without changing a single URL.

**A dedicated service layer.** Every HTTP call funnels through `app/services/`. This was the difference between a two-line fix and a scavenger hunt during the auth bug we ran into — because there's one file per backend resource, tracing "what does the frontend send to `/auth/refresh-token`" took seconds, not a grep across the whole codebase.

**Hooks as the boundary between services and UI.** Pages don't call services directly — they call a hook, which wraps the service in React Query. That one layer of indirection is what gives every screen caching, automatic refetching, and cache invalidation (e.g. adding a question automatically refreshes the list) without any component managing that state by hand.

**Types generated from the real contract, not assumed.** Because the `types/` interfaces were built directly from the backend's Swagger spec, mismatches between what the frontend expects and what the API actually returns show up as compile errors instead of production bugs — this is literally how we caught the token-refresh response-shape bug.

**No global state library.** Server data already has a cache — React Query's. UI-only state (which tab is active, which filter is picked) is local to the component that owns it. Reaching for Redux or Zustand on top of that would just be storing the same data twice; the architecture matches the tool to the app's actual complexity instead of defaulting to more machinery than it needs.

**Primitives separated from feature components.** `components/ui/` knows nothing about lessons, questions, or subscriptions — it only knows how to look like a button or a select. Feature components build on top of those primitives. This means a full restyle of buttons app-wide touches one file, not every screen that happens to use one.
