# CLAUDE.md

## Project Overview

**ohtani-complete-database** — A project to visualize Shohei Ohtani's baseball performance statistics in real-time (大谷翔平の成績をリアルタイムで可視化).

This repository is in its **early stage** and currently contains only the project README. The sections below describe the intended structure and conventions to follow as the codebase grows.

## Repository Structure

```
ohtani-complete-database/
├── README.md          # Project description (Japanese/English)
├── CLAUDE.md          # This file — AI assistant guide
└── .git/              # Git repository
```

## Development Workflow

### Branches

- `main` — production branch; do not push directly
- `claude/*` — feature branches for AI-assisted development

### Commits

- Write clear, descriptive commit messages in English
- Keep commits focused on a single logical change
- Reference issue numbers when applicable

### Git Commands

```bash
# Fetch a specific branch
git fetch origin <branch-name>

# Push with upstream tracking
git push -u origin <branch-name>
```

## Language & Locale

- The project targets a **Japanese-speaking audience**. UI text and user-facing content should be in Japanese.
- Code, commit messages, code comments, and documentation (like this file) should be in **English**.

## Conventions for AI Assistants

1. **Read before editing** — Always read existing files before proposing modifications.
2. **Minimal changes** — Only make changes that are directly requested or clearly necessary. Avoid over-engineering.
3. **No secrets** — Never commit API keys, credentials, or `.env` files.
4. **Test your work** — Run any available linters, type checkers, or test suites before committing.
5. **Respect the existing style** — Match the formatting, naming, and patterns already used in the codebase.
6. **Ask when unsure** — If requirements are ambiguous, ask the user rather than guessing.
