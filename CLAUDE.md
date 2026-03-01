# CLAUDE.md

## Project Overview

**ohtani-complete-database** — A web application that visualizes Shohei Ohtani's baseball performance statistics in real-time (大谷翔平の成績をリアルタイムで可視化).

Features:
- Dashboard with current season batting and pitching stats
- Historical stats across all NPB/MLB seasons (year-by-year tables and charts)
- News aggregation from MLB.com

## Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Data Source**: MLB Stats API (statsapi.mlb.com) — no API key required
- **Date Utilities**: date-fns

## Repository Structure

```
ohtani-complete-database/
├── CLAUDE.md
├── README.md
└── app/                          # Next.js application
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    └── src/
        ├── lib/                  # Shared libraries
        │   ├── types.ts          # TypeScript interfaces (BattingStats, PitchingStats, etc.)
        │   ├── mlb-api.ts        # MLB Stats API client (player info, year-by-year stats)
        │   └── news-api.ts       # News fetching from MLB editorial API
        ├── components/           # Reusable UI components
        │   ├── Header.tsx        # Navigation header (client component)
        │   ├── StatCard.tsx      # Single stat display card
        │   ├── StatsTable.tsx    # Generic data table with column config
        │   ├── NewsCard.tsx      # News article card
        │   ├── HrChart.tsx       # Home run bar chart (client component)
        │   └── PitchingChart.tsx # Pitching stats line chart (client component)
        └── app/                  # Next.js App Router pages
            ├── layout.tsx        # Root layout with Header and Footer
            ├── globals.css       # Global styles and Tailwind config
            ├── page.tsx          # Dashboard (/) — current stats + charts
            ├── stats/page.tsx    # Historical stats (/stats) — full tables
            ├── news/page.tsx     # News (/news) — article grid
            └── api/
                ├── stats/route.ts  # GET /api/stats — JSON stats endpoint
                └── news/route.ts   # GET /api/news — JSON news endpoint
```

## Development Commands

All commands run from the `app/` directory:

```bash
cd app

npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
```

## Key Patterns

- **Server Components by default** — Pages fetch data on the server. Only chart and nav components use `"use client"`.
- **Dynamic rendering** — All data pages use `export const dynamic = "force-dynamic"` since they fetch from external APIs at request time.
- **MLB API constants** — Ohtani's player ID is `660271`. The API base URL is `https://statsapi.mlb.com/api/v1`.
- **Japanese UI** — All user-facing text is in Japanese. Code and comments are in English.
- **No API keys needed** — MLB Stats API is public; no environment variables required for basic functionality.

## Development Workflow

### Branches

- `main` — production branch; do not push directly
- `claude/*` — feature branches for AI-assisted development

### Commits

- Write clear, descriptive commit messages in English
- Keep commits focused on a single logical change

## Conventions for AI Assistants

1. **Read before editing** — Always read existing files before proposing modifications.
2. **Minimal changes** — Only make changes that are directly requested or clearly necessary.
3. **No secrets** — Never commit API keys, credentials, or `.env` files.
4. **Test your work** — Run `npm run build` from the `app/` directory before committing.
5. **Respect the existing style** — Match the formatting, naming, and patterns already used in the codebase.
6. **Ask when unsure** — If requirements are ambiguous, ask the user rather than guessing.
