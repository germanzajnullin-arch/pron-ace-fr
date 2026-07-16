# French Pronunciation MVP — Build Plan

A mobile-first PWA-style web app for practicing French pronunciation. Dark theme with neon green/purple accents, bottom tab navigation, Web Speech API for STT, Supabase for persistence.

## 1. Stack & Conventions

- React 19 + TypeScript (strict) on TanStack Start (existing template)
- Tailwind v4 + shadcn/ui, tokens defined in `src/styles.css`
- Lovable Cloud (Supabase) for `profiles`, `lessons`, `user_attempts`
- Web Speech API (`SpeechRecognition`, `lang=fr-FR`) + `MediaRecorder`
- State: TanStack Query for server data, local reducer/context for recording session
- SOLID/DRY: services isolated from UI; constants and lesson catalog in `src/config/`

## 2. Folder Structure

```text
src/
├── routes/
│   ├── __root.tsx                 # shell, dark theme, bottom nav mount
│   ├── index.tsx                  # redirect → /practice
│   ├── today.tsx                  # "Today" tab (streak, daily goal)
│   ├── practice.tsx               # "Practice" tab (main screen)
│   ├── progress.tsx               # "Progress" tab (charts, history)
│   ├── lesson.$lessonId.tsx       # lesson runner (record + score)
│   ├── module.$moduleId.tsx       # quick-drill module runner
│   ├── custom-text.tsx            # free-text pronunciation practice
│   └── ai-chat.tsx                # AI conversation practice
├── components/
│   ├── ui/                        # shadcn primitives
│   ├── nav/BottomTabBar.tsx
│   ├── practice/
│   │   ├── HeroCourseCard.tsx
│   │   ├── CustomTextButton.tsx
│   │   ├── QuickDrillsList.tsx
│   │   ├── DrillListItem.tsx
│   │   └── AiConversationCard.tsx
│   ├── lesson/
│   │   ├── PhraseDisplay.tsx
│   │   ├── RecordButton.tsx
│   │   ├── ScoreCard.tsx
│   │   └── TranscriptDiff.tsx
│   ├── chat/
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   └── MicComposer.tsx
│   ├── feedback/
│   │   ├── SkeletonCard.tsx
│   │   ├── MicPermissionAlert.tsx
│   │   └── ErrorBanner.tsx
│   └── progress/ProgressBar.tsx
├── services/
│   ├── audio/
│   │   ├── AudioRecorder.ts       # MediaRecorder wrapper
│   │   ├── SpeechRecognizer.ts    # Web Speech API wrapper (fr-FR)
│   │   ├── PronunciationScorer.ts # Levenshtein/phoneme similarity
│   │   └── types.ts
│   └── logger.ts                  # verbose lifecycle logging
├── hooks/
│   ├── useMicPermission.ts
│   ├── useRecorder.ts             # combines recorder + recognizer
│   └── useLessonSession.ts
├── lib/
│   ├── lessons.functions.ts       # server fns: list/get lessons
│   ├── attempts.functions.ts      # server fns: save/list attempts
│   └── utils.ts
├── config/
│   ├── constants.ts               # thresholds, timeouts, tab ids
│   ├── modules.ts                 # Quick Drills catalog
│   └── mockData.ts                # mock lessons + scored attempts
├── types/
│   ├── lesson.ts
│   ├── attempt.ts
│   └── profile.ts
└── styles.css                     # dark theme tokens + neon accents
```

## 3. Design System (dark + neon)

Tokens in `src/styles.css` under `@theme` / `:root`:
- `--background`: near-black (`oklch(0.16 0.02 270)`)
- `--surface`: elevated card (`oklch(0.22 0.03 275)`)
- `--primary` (neon green): `oklch(0.85 0.22 145)`
- `--accent` (neon purple): `oklch(0.68 0.24 300)`
- `--foreground`: soft white
- Gradient `--gradient-hero`: primary → accent
- Shadow `--shadow-neon`: primary glow

Motion: framer-motion for tab transitions, record button pulse, score reveal. Skeleton loaders for lists/cards before hydration.

## 4. UI — Practice Tab

Layout (mobile-first, `max-w-md mx-auto`, bottom padding for tab bar):

1. **HeroCourseCard** — gradient bg, title "French Phonetics Basics", progress bar (from `user_attempts` aggregate), CTA `CONTINUE` → `/lesson/$lessonId` (next unfinished).
2. **CustomTextButton** → `/custom-text`.
3. **QuickDrillsList** — 4 items from `config/modules.ts`:
   - `voyelles-nasales` — Nasal Vowels
   - `french-r-silent` — The French "R" & Silent Letters
   - `liaison` — Liaison
   - `minimal-pairs` — Minimal Pairs (e.g. dessus/dessous)
4. **AiConversationCard** → `/ai-chat` (chat UI: bubbles + mic composer, mocked responses for MVP).

Bottom nav: Today · Practice · Progress with active neon-green indicator.

## 5. Audio Pipeline

`SpeechRecognizer.ts`
- Wraps `webkitSpeechRecognition || SpeechRecognition`
- `lang='fr-FR'`, `interimResults=true`, `continuous=false`
- Emits: `start`, `interim`, `final`, `error`, `end`

`AudioRecorder.ts`
- `getUserMedia({ audio: true })` + `MediaRecorder`
- Returns WebM blob (for future server-side scoring)

`useRecorder` hook orchestrates both; states: `idle → requesting → recording → processing → scored | error`.

`PronunciationScorer.ts` (MVP heuristic)
- Normalize (lowercase, strip diacritics/punct)
- Score = `1 - levenshtein(expected, heard) / max(len)`
- Bucketed feedback: ≥0.9 excellent, ≥0.75 good, ≥0.5 fair, else retry
- Character-level diff for `TranscriptDiff` UI

Error handling: try/catch around every lifecycle step; `useMicPermission` surfaces `MicPermissionAlert` when `NotAllowedError` / `NotFoundError`. Unsupported-browser fallback message when `SpeechRecognition` is absent. Verbose `logger.debug` at each step (start, chunk, stop, transcript, score, save).

Mock mode (`config/mockData.ts`): deterministic scored attempts so the UI can be exercised without a mic.

## 6. Data — Supabase Schema

Enable Lovable Cloud, then a single migration:

```sql
-- profiles: 1:1 with auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  daily_goal_minutes int not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile r" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile u" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "own profile i" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- lessons: public catalog
create type public.lesson_category as enum
  ('phonetics_basics','nasal_vowels','french_r_silent','liaison','minimal_pairs','custom');

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  category public.lesson_category not null,
  order_index int not null default 0,
  french_text text not null check (char_length(french_text) between 1 and 500),
  audio_example_url text check (audio_example_url ~* '^https?://'),
  hints text[] not null default '{}',
  created_at timestamptz not null default now()
);
grant select on public.lessons to anon, authenticated;
grant all on public.lessons to service_role;
alter table public.lessons enable row level security;
create policy "lessons public read" on public.lessons for select to anon, authenticated using (true);

-- user_attempts: history
create table public.user_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  transcript text not null check (char_length(transcript) <= 1000),
  score numeric(4,3) not null check (score between 0 and 1),
  duration_ms int check (duration_ms between 0 and 120000),
  created_at timestamptz not null default now()
);
grant select, insert on public.user_attempts to authenticated;
grant all on public.user_attempts to service_role;
alter table public.user_attempts enable row level security;
create policy "attempts own r" on public.user_attempts for select to authenticated using (auth.uid() = user_id);
create policy "attempts own i" on public.user_attempts for insert to authenticated with check (auth.uid() = user_id);
create index on public.user_attempts (user_id, created_at desc);
```

All reads/writes go through `createServerFn` handlers (`lib/*.functions.ts`) with Zod input validators + `requireSupabaseAuth` for user-scoped fns → parameterized queries, injection-safe, RLS-enforced.

Seed rows for the 4 quick-drill modules inserted in the same migration.

## 7. Auth

Minimal: Supabase email/password + Google via `lovable.auth.signInWithOAuth`. Auth-only routes (`/lesson`, `/progress`, `/today`) under `_authenticated/`. Public: `/practice`, `/custom-text` (record without saving until sign-in).

## 8. Deliverables Order

1. Enable Lovable Cloud, run migration, seed lessons.
2. Design tokens + bottom nav shell + route files.
3. Practice tab components with mock data.
4. Audio services + `useRecorder` hook + lesson runner.
5. Custom-text screen + AI chat (mocked).
6. Progress + Today screens.
7. Auth wiring, server fns for attempts, replace mocks.
8. Skeletons, animations, error UI polish.

## Open Question

The AI Conversation is spec'd as "interactive chat for free-form speech practice". For the MVP, should the assistant replies be:
- **(a) fully mocked** canned French responses (fastest, no backend), or
- **(b) real** via Lovable AI Gateway (`google/gemini-3.5-flash`) so the conversation actually flows?

I'll default to **(b)** with a mock fallback unless you say otherwise.
