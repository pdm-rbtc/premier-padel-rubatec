# CLAUDE.md — 3r Torneo Premium Pádel Rubatec

> This file is the single source of truth for Claude Code sessions. Read it fully before starting any task.

---

## 1. Project Overview

**App Name:** 3r Torneo Premium Pádel Rubatec
**Company:** Rubatec
**Email Domain:** `@rubatec.cat`
**Scale:** ~132 players, ~65 couples, 12 courts, 1-day tournament (9:30h–14:00h)
**Goal:** A web app for players to view brackets, submit scores, and for admins to manage the tournament. Mobile-first for courtside use.

---

## 2. Tech Stack

| Layer            | Technology                          |
|------------------|-------------------------------------|
| Frontend         | React + Vite                        |
| Styling          | Tailwind CSS + Headless UI          |
| Backend / DB     | Supabase (PostgreSQL + Auth + Realtime) |
| Auth             | Google OAuth via Supabase (restricted to `@rubatec.cat`) |
| Hosting          | GitHub Pages (static build)         |
| Language (UI)    | Spanish (primary), Catalan (future) |
| Language (code)  | English (variables, functions, comments) |

---

## 3. Corporate Design Tokens

```css
/* Colors */
--color-primary:        #001d72;   /* Main navy blue */
--color-secondary:      #0433FF;   /* Bright blue (secondary) */
--color-accent:         #11efb5;   /* Mint green accent */
--color-accent-2:       #ff8000;   /* Orange (use sparingly) */

/* Neutrals (derive as needed) */
--color-bg:             #f8f9fc;   /* Light background */
--color-surface:        #ffffff;   /* Card surfaces */
--color-text-primary:   #0f172a;   /* Main text */
--color-text-secondary: #64748b;   /* Muted text */
```

**UX Direction:**
- Mobile-first, responsive up to desktop for admin dashboard
- Soft rounded blocks, subtle gradients for backgrounds
- Techy, minimal, clean vibe — not corporate/heavy
- Easily visible "next match" and couple status on player portal
- Large tap targets for courtside score input
- No dark mode required

---

## 4. Tournament Structure (from 2026 official distribution)

### 4.1 Divisions & Groups

The tournament has **three competitive divisions** + a non-competitive "Classes" session:

| Division   | Catalan Name      | Groups       | Couples/Group | Total Couples |
|------------|-------------------|--------------|---------------|---------------|
| Diamant    | Divisió Diamant   | G1, G2, G3   | 4             | 12            |
| Or         | Divisió Or        | G1–G6        | 4             | 24            |
| Plata      | Divisió Plata     | G1, G2, G3   | 4             | 12            |

> **Note:** "Classes" runs separately and is NOT part of the competitive tournament. Total: 48 competitive couples.

### 4.2 Group Phase (Round-Robin)

Within each group of 4 couples, every couple plays every other couple once (3 matches per couple):
- Round 1: G.1 vs G.2 and G.3 vs G.4
- Round 2: G.1 vs G.3 and G.2 vs G.4
- Round 3: G.1 vs G.4 and G.2 vs G.3

**Group standings** are determined by:
1. Points (win = 3 points, loss = 0)
2. Game differential (Jocs a favor - Jocs en contra)
3. Head-to-head result (tiebreaker)

### 4.3 Knockout Phase (Post Group Stage)

**CRITICAL DESIGN PRINCIPLE:** Every couple plays a minimum of 4 matches (3 group + 1+ knockout/consolation). Even 4th-place finishers get consolation matches.

**Diamant Division (Slots 7–9):**
- Quarter-finals:
  - A1: 1st G1 vs 2nd G3
  - A2: 1st G2 vs Best 3rd place
  - A3: 1st G3 vs 2nd Best 3rd place
  - A4: 2nd G1 vs 2nd G2
- Semi-finals: S1 (Winner A1 vs A2), S2 (Winner A3 vs A4)
- Final + 3rd/4th place match
- Consolation: C1 (3rd Best 3rd vs 4th G1), C2 (4th G2 vs 4th G3)

**Or Division (Slots 5–9, most complex):**
- Quarter-finals:
  - A1: 1st G1 vs Best 2nd place
  - A2: 1st G2 vs 2nd Best 2nd
  - A3: 1st G3 vs 1st G4
  - A4: 1st G5 vs 1st G6
- Semi-finals: S1 (Winner A1 vs A2), S2 (Winner A3 vs A4)
- Final + 3rd/4th place match
- Consolation 2nd-place: C1 (3rd vs 4th best 2nd), C2 (5th vs 6th best 2nd)
- Consolation 3rd-place: C3 (3rd G1 vs G2), C4 (3rd G3 vs G4), C5 (3rd G5 vs G6)
- Consolation 4th-place: C6 (Best vs 2nd best 4th), C7 (3rd vs 4th best 4th)

**Plata Division (Slots 7–9):**
- Semi-finals (no quarter-finals, only 3 groups):
  - S1: 1st G1 vs 1st G2
  - S2: 1st G3 vs Best 2nd place
- Final + 3rd/4th place match
- Consolation 2nd-place: C1 (2nd vs 3rd best 2nd)
- Consolation 3rd-place: C2 (Best vs 2nd best 3rd), C3 (3rd best 3rd vs 4th G1)
- Consolation 4th-place: C4 (4th G2 vs 4th G3)

### 4.4 Court & Scheduling

- **12 courts** labeled Pista 1–12 (also A–L)
- **9 time slots** of 30 minutes: 9:30, 10:00, 10:30, 11:00, 11:30, 12:00, 12:30, 13:00, 13:30
- All divisions play simultaneously across courts
- Slots 1–6: Group phase (Diamant finishes by slot 5, Or/Plata continue through slot 6)
- Slot 7: Quarter-finals (Diamant, Or) + remaining group matches
- Slot 8: Semi-finals (all divisions) + consolation matches
- Slot 9: Finals (all divisions) + remaining consolation

### 4.5 Player Levels

Players have a skill level (from the "Persones" sheet):
- Level 0: Beginner / not participating
- Level 1: Advanced
- Level 2: Intermediate
- Level 3: Beginner
- "Classes": Learning/new to padel

Players also belong to a **Centre** (office location: Viladecans, Cornellà, Motors 1, Motors 2, Singulars, Trueta, UTE) and a **DPT** (department).

---

## 5. Database Schema (Supabase / PostgreSQL)

### 5.1 Tables

```sql
-- USERS: Linked to Supabase Auth
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'admin')),
  couple_id UUID REFERENCES couples(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- COUPLES: A pair of players
CREATE TABLE couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL,
  player_1_name TEXT NOT NULL,
  player_2_name TEXT NOT NULL,
  division TEXT NOT NULL CHECK (division IN ('diamant', 'or', 'plata')),
  group_code TEXT,              -- e.g., 'G1', 'G2', etc.
  seed INTEGER,
  image_url TEXT,
  centre TEXT,                  -- Office location
  department TEXT,              -- Department
  created_at TIMESTAMPTZ DEFAULT now()
);

-- MATCHES: Both group-phase and knockout-phase
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  division TEXT NOT NULL CHECK (division IN ('diamant', 'or', 'plata')),
  phase TEXT NOT NULL CHECK (phase IN ('group', 'knockout')),
  group_code TEXT,              -- NULL for knockout matches
  round TEXT,                   -- For knockout: 'quarter', 'semi', 'consolation', 'third_place', 'final'
                                -- For groups: 'R1', 'R2', 'R3'
  position INTEGER,             -- Order within round
  couple_a_id UUID REFERENCES couples(id),
  couple_b_id UUID REFERENCES couples(id),
  score_a TEXT,                 -- e.g., "6-4" or "6-4 3-6 7-5"
  score_b TEXT,
  games_a INTEGER DEFAULT 0,   -- Total games won by A (for standings calc)
  games_b INTEGER DEFAULT 0,   -- Total games won by B (for standings calc)
  submitted_by UUID REFERENCES couples(id),
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'pending_confirmation', 'confirmed', 'disputed', 'bye', 'walkover')),
  winner_id UUID REFERENCES couples(id),
  court TEXT,                   -- e.g., 'Pista 1', 'Pista 2', ... 'Pista 12'
  court_label CHAR(1),          -- A through L
  scheduled_at TIMESTAMPTZ,
  time_slot TEXT,               -- e.g., '9:30h - 10:00h'
  confirmed_at TIMESTAMPTZ,
  next_match_id UUID REFERENCES matches(id),
  next_match_slot TEXT CHECK (next_match_slot IN ('couple_a', 'couple_b')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- GROUP_STANDINGS: Precomputed or view-based standings per group
CREATE TABLE group_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couples(id) NOT NULL,
  division TEXT NOT NULL,
  group_code TEXT NOT NULL,
  matches_played INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  matches_lost INTEGER DEFAULT 0,
  games_for INTEGER DEFAULT 0,
  games_against INTEGER DEFAULT 0,
  game_differential INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(couple_id, division, group_code)
);

-- MATCH_LOG: Audit trail for every state change
CREATE TABLE match_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'score_submitted', 'score_confirmed', 'score_disputed',
    'admin_override', 'bracket_advanced', 'status_changed'
  )),
  actor_id UUID REFERENCES users(id),
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TOURNAMENT_CONFIG: Global settings
CREATE TABLE tournament_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.2 Key Indexes

```sql
CREATE INDEX idx_matches_division_phase ON matches(division, phase);
CREATE INDEX idx_matches_group ON matches(division, group_code);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_couple_a ON matches(couple_a_id);
CREATE INDEX idx_matches_couple_b ON matches(couple_b_id);
CREATE INDEX idx_standings_group ON group_standings(division, group_code);
CREATE INDEX idx_match_log_match ON match_log(match_id);
```

---

## 6. Score Input State Machine

```
                    ┌──────────────┐
                    │  scheduled   │
                    └──────┬───────┘
                           │ Couple A or B submits score
                           ▼
               ┌───────────────────────┐
               │  pending_confirmation │
               └───────┬───────┬───────┘
                       │       │
            Couple B   │       │  Couple B
            confirms   │       │  disputes
                       ▼       ▼
              ┌──────────┐  ┌──────────┐
              │ confirmed│  │ disputed │
              └──────────┘  └────┬─────┘
                                 │ Admin resolves
                                 ▼
                            ┌──────────┐
                            │ confirmed│
                            └──────────┘
```

### State Transition Rules (enforced via RLS + DB functions):

| From                  | To                    | Who               | Conditions                                   |
|-----------------------|-----------------------|-------------------|----------------------------------------------|
| scheduled             | pending_confirmation  | couple_a OR couple_b | User's couple_id matches couple_a or couple_b; submitted_by IS NULL |
| pending_confirmation  | confirmed             | The OTHER couple    | User's couple_id ≠ submitted_by; User's couple_id matches couple_a or couple_b |
| pending_confirmation  | disputed              | The OTHER couple    | Same as above                                |
| disputed              | confirmed             | admin              | Admin resolves with correct score            |
| Any                   | Any                   | admin              | Admin can override any state                 |

### Post-Confirmation Side Effects:
1. Update `winner_id` on the match
2. Update `group_standings` if group-phase match
3. If knockout match: advance winner to `next_match_id` in the `next_match_slot` position
4. Write to `match_log`

---

## 7. Auth & Access Control

### Admin Emails:
- `pdemora@rubatec.cat`
- `ggarcia@rubatec.cat`
- `ssomavilla@rubatec.cat`
- `sgarcia@rubatec.cat`

### RLS Policy Summary:
- **Public (no auth):** Read all matches, couples, standings
- **Authenticated player:** Submit/confirm/dispute scores ONLY for their own matches
- **Admin:** Full CRUD on all tables

### Google OAuth:
- Configured in Supabase Auth with GCP credentials
- Restricted to `@rubatec.cat` domain via Supabase hook or post-login check
- Auto-link user to couple via admin pre-registration or manual assignment

---

## 8. App Views / Routes

| Route                  | Description                              | Auth Required |
|------------------------|------------------------------------------|---------------|
| `/`                    | Landing page with tournament overview     | No            |
| `/bracket/:division`   | Group tables + knockout bracket view     | No            |
| `/match/:id`          | Single match detail view                 | No            |
| `/portal`             | Player portal: my matches, submit score  | Yes (player)  |
| `/admin`              | Admin dashboard                          | Yes (admin)   |
| `/admin/couples`      | Manage couples                           | Yes (admin)   |
| `/admin/matches`      | Manage matches, resolve disputes         | Yes (admin)   |
| `/admin/brackets`     | Generate/edit brackets                   | Yes (admin)   |

---

## 9. i18n Strategy

- Primary language: **Spanish (es)**
- Future: **Catalan (ca)**
- Use a simple i18n approach: JSON translation files (`/src/i18n/es.json`, `/src/i18n/ca.json`)
- All UI strings go through a `t('key')` function from day one
- Language selector in the header/nav (hidden or disabled until Catalan is added)
- Code comments and variable names always in English

---

## 10. File Structure

```
padel-rubatec/
├── CLAUDE.md                    # This file
├── README.md
├── package.json
├── vite.config.js
├── tailwind.config.js
├── index.html
├── public/
│   └── assets/                  # Logo, favicon, images
├── src/
│   ├── main.jsx                 # App entry point
│   ├── App.jsx                  # Router setup
│   ├── components/              # Shared UI components
│   │   ├── Layout.jsx
│   │   ├── Navbar.jsx
│   │   ├── MatchCard.jsx
│   │   ├── GroupTable.jsx
│   │   ├── BracketView.jsx
│   │   ├── ScoreInput.jsx
│   │   └── ...
│   ├── pages/                   # Route-level components
│   │   ├── Home.jsx
│   │   ├── BracketPage.jsx
│   │   ├── MatchDetail.jsx
│   │   ├── PlayerPortal.jsx
│   │   └── admin/
│   │       ├── Dashboard.jsx
│   │       ├── ManageCouples.jsx
│   │       ├── ManageMatches.jsx
│   │       └── ManageBrackets.jsx
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useMatches.js
│   │   ├── useStandings.js
│   │   └── useRealtime.js
│   ├── lib/                     # Utilities & services
│   │   ├── supabase.js          # Supabase client init
│   │   ├── auth.js              # Auth helpers
│   │   ├── scoring.js           # Score parsing & validation
│   │   └── standings.js         # Standings calculation
│   ├── i18n/
│   │   ├── index.js             # i18n setup & t() function
│   │   ├── es.json
│   │   └── ca.json              # Added later
│   └── styles/
│       └── globals.css          # Tailwind imports + custom tokens
└── supabase/
    ├── config.toml
    └── migrations/
        ├── 001_create_tables.sql
        ├── 002_create_indexes.sql
        ├── 003_rls_policies.sql
        ├── 004_functions.sql    # Triggers, RPCs for bracket advancement
        └── 005_seed_admins.sql
```

---

## 11. Conventions & Rules

### Code Style:
- Functional components with hooks only (no class components)
- Named exports for components, default export for pages
- Tailwind utility classes directly on elements (no CSS modules)
- Constants in UPPER_SNAKE_CASE
- Components in PascalCase, files match component name
- Hooks start with `use`

### Git:
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`
- One feature per branch, squash merge to main

### SQL Migrations:
- Numbered sequentially: `001_`, `002_`, etc.
- Each migration is idempotent where possible (use IF NOT EXISTS)
- RLS policies always in their own migration file

### Development Order (vertical slices):
1. Schema + migrations + RLS
2. Auth (Google OAuth + domain restriction)
3. Public bracket view (read-only, group tables + knockout)
4. Player portal (login, see my matches, submit score)
5. Score confirmation flow (state machine)
6. Admin dashboard (CRUD, dispute resolution)
7. Real-time updates (Supabase subscriptions)
8. Styling polish pass
9. Catalan language support

---

## 12. Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_OAUTH_CLIENT_ID=your-client-id  # If needed in frontend
```

> **SECURITY:** All sensitive values go in `.env` (gitignored). Never commit keys to the repo.

---

## 13. Deployment & Hosting

- **Repository:** GitHub, **public** (required for free GitHub Pages hosting)
- **Hosting:** GitHub Pages (static Vite build output from `dist/`)
- **Why public is safe:** All sensitive data (Supabase keys, admin emails, OAuth secrets) lives in environment variables (`.env`), which is gitignored. The source code itself contains no secrets.
- **Build command:** `npm run build` → outputs to `dist/`
- **Deploy:** GitHub Actions workflow or manual push to `gh-pages` branch
- **Custom domain:** Optional, can be configured in GitHub Pages settings later

---

## 14. Nice-to-Haves (Prioritized)

1. **Real-time bracket updates** — Supabase Realtime subscriptions
2. **Push notifications** — When it's your turn to confirm a score
3. **Court map visualization** — Visual 12-court layout showing live matches
4. **Player stats** — Games won/lost across tournament
5. **Photo upload** — Couple photos for bracket cards
6. **Export results** — PDF/Excel export of final standings

---

## 15. Out of Scope (for now)

- Player self-registration (admin pre-registers all couples)
- Payment or ticketing
- Multiple tournament management (this is for one tournament)
- Native mobile app (PWA-friendly responsive web is sufficient)
