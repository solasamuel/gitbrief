# GitBrief — Claude Code Project Guide

## Project Overview

GitBrief is an AI-powered GitHub PR explainer & review assistant. Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Claude API, GitHub REST API. Deployed to Vercel.

## Key Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # Vitest (run once)
npm run test:watch   # Vitest (watch mode)
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
main      ← production (deployed to Vercel)
develop   ← integration branch (PRs target here)
feature/BL-{id}-{short-description}  ← one per backlog item
```

- Create feature branches from `develop`
- Merge with `--no-ff` into `develop`
- Merge `develop` into `main` for releases

## Commit Message Format

```
feat(BL-002): add PR URL parser with validation
fix(BL-005): handle empty diff edge case
docs: update README with API examples
```

Include `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>` in commits.

## Project Structure

- `src/lib/` — Pure business logic (parser, diff utils, prompt builder, API clients)
- `src/lib/__tests__/` — Unit and integration tests for lib modules
- `src/components/` — React UI components
- `src/components/__tests__/` — Component tests
- `src/app/api/analyze/` — Single API endpoint (POST /api/analyze)
- `docs/` — Product backlog, testing plan, solution architecture

## Key Files

- `docs/product-backlog.json` — Ordered backlog items with test case mappings
- `docs/testing-plan.json` — All planned tests with IDs (T-001 through T-033)
- `docs/solution-architecture.md` — System design, API contracts, data flow
- `src/lib/types.ts` — All shared TypeScript types
- `src/lib/errors.ts` — Custom error classes (GitHubApiError, ClaudeApiError, etc.)

## Rules

- Never commit `.env.local` or API keys
- Don't add features beyond what the current backlog item specifies
- Tests go in `__tests__/` directories alongside the code they test
- Use `@/` path alias for imports
