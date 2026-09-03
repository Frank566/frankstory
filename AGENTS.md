# AGENTS.md

This document provides an overview of the project structure for developers and AI agents working on this codebase.

## Project Overview

Frank Story — a MapleStory GMS-region toolkit site, cloned as a homepage + navigation framework. It presents the site's tool catalog (character roster, boss tracker, schedule board, calculators, wikis/guides) and links each to a placeholder page. Actual tool functionality has not been implemented yet — only the shell.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start |
| Frontend | React 19, TanStack Router v1 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 (class-based dark mode via `@custom-variant dark`) |
| Language | TypeScript 5.9 (strict mode) |
| Deployment | Netlify |

## Directory Structure

```
├── src
│   ├── components
│   │   ├── NavBar.tsx       # Header nav: primary links, "计算" and "图鉴与指南" dropdowns, theme toggle, mobile menu.
│   │   ├── Footer.tsx       # Site footer.
│   │   └── ThemeToggle.tsx  # Light/dark toggle persisted to localStorage (the site's "local storage" privacy model).
│   ├── data
│   │   └── tools.ts         # Catalog of every tool (slug, name, group, description) — single source of truth for nav + placeholder pages.
│   ├── routes
│   │   ├── __root.tsx       # Root layout: HTML shell, metadata.
│   │   ├── index.tsx        # Homepage: hero, quick links, recent updates, about, guild recruitment.
│   │   └── tools/$slug.tsx  # Generic placeholder page for every tool in tools.ts (looked up by slug, 404s via notFound() if missing).
│   ├── router.tsx
│   └── styles.css
├── AGENTS.md
├── README.md
├── netlify.toml
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Key Concepts

### Tool catalog as single source of truth

`src/data/tools.ts` lists every tool with a `slug`, `group`, and `description`. Both `NavBar` (for links/dropdowns) and `routes/tools/$slug.tsx` (for the placeholder page content) read from this file. To add a real implementation for a tool, replace the generic placeholder logic in `tools/$slug.tsx` with a dedicated route for that slug (TanStack Router file routes let a more specific route file take precedence), rather than editing the catalog's shape.

### Local-first data model

The original site stores all user data in the browser (no accounts). This clone follows the same approach — `ThemeToggle.tsx` is the current example, persisting to `localStorage` under the `wangfenggu:theme` key. Any future tool (roster, boss tracker, schedule, calculators) should persist its data the same way rather than introducing a backend/database, unless the user explicitly asks for cross-device sync.

### File-Based Routing (TanStack Router)

- `__root.tsx` - Root layout wrapping all pages
- `index.tsx` - Route for `/`
- `tools/$slug.tsx` - Route for `/tools/:slug`, dynamic placeholder for every tool

## Conventions

- Components: PascalCase, one per file in `src/components/`
- Path alias `@/*` maps to `src/*`
- Tailwind utility classes only; dark-mode variants use the `dark:` prefix (enabled via `.dark` class on `<html>`, toggled by `ThemeToggle`)
- Chinese copy throughout (matching the source site's audience); keep new UI text in Chinese unless asked otherwise

## Development Commands

```bash
pnpm dev      # Start dev server
pnpm build    # Production build
```
