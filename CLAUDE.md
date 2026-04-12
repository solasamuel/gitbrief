# GitBrief — Claude Code Project Guide

## Project Overview

GitBrief is a Chrome browser extension (Manifest V3) — AI-powered GitHub PR explainer & review assistant. Users provide their own API keys. Built with TypeScript, React, Tailwind CSS, Vite + CRXJS. No backend server.

## Key Commands

```bash
npm run dev          # Vite dev server (HMR for extension)
npm run build        # Production build to dist/
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # Vitest (run once)
npm run test:watch   # Vitest (watch mode)
npm run package      # Build + create gitbrief-extension.zip
```

Always run `lint`, `typecheck`, and `test` before committing. All three must pass.

## TDD Workflow

Every backlog item follows red-green-refactor:

1. **RED** — Write failing tests first. Run them. Confirm they fail.
2. **GREEN** — Write the minimum implementation to make tests pass.
3. **REFACTOR** — Clean up while keeping tests green.
4. **COMMIT** — Descriptive message referencing the backlog item.

## Branching Strategy

```
main      <- production
develop   <- integration branch (PRs target here)
feature/BL-{id}-{short-description}  <- one per backlog item
```

- Create feature branches from `develop`
- Merge with `--no-ff` into `develop`
- Merge `develop` into `main` for releases

## Commit Message Format

```
feat(BL-007): add Claude API client using raw fetch
fix(BL-005): handle empty diff edge case
docs: update README for extension setup
chore: update docs for extension architecture
```

Include `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>` in commits.

## Project Structure

- `src/lib/` — Pure business logic (URL parser, API clients, diff utils, prompt builder, orchestrator)
- `src/lib/__tests__/` — Unit and integration tests for lib modules
- `src/popup/` — Extension popup UI (React components)
- `src/popup/__tests__/` — Popup component tests
- `src/options/` — Settings page (API key management)
- `src/background/` — Service worker (minimal)
- `src/content/` — Optional content script for GitHub PR pages
- `docs/` — Product backlog, testing plan, solution architecture

## Key Files

- `manifest.json` — Chrome Extension Manifest V3 (permissions, entry points)
- `vite.config.ts` — Vite + CRXJS build config
- `docs/product-backlog.json` — Ordered backlog items with test case mappings
- `docs/testing-plan.json` — All planned tests with IDs (T-001 through T-033)
- `docs/solution-architecture.md` — System design, API contracts, data flow
- `src/lib/types.ts` — All shared TypeScript types
- `src/lib/errors.ts` — Custom error classes

## Extension Architecture

- API keys are user-provided, stored in `chrome.storage.local`
- API calls (GitHub, Anthropic) made directly from popup context via raw fetch
- `host_permissions` in manifest bypass CORS — no proxy/server needed
- Tab URL auto-detected via `chrome.tabs.query` with `activeTab` permission

## Rules

- Never commit API keys or secrets
- Don't add features beyond what the current backlog item specifies
- Tests go in `__tests__/` directories alongside the code they test
- Use `@/` path alias for imports
- Use raw fetch for external APIs (no SDK dependencies in extension context)
