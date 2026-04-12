# GitBrief

AI-powered GitHub PR explainer and review assistant. Paste a pull request URL, get an instant structured code review: plain-English summary, key changes, risks, and actionable suggestions.

## How It Works

1. Paste a GitHub PR URL (e.g. `https://github.com/owner/repo/pull/123`)
2. GitBrief fetches the diff and metadata via the GitHub REST API
3. The diff is processed (filtered, truncated if needed) and sent to Claude for analysis
4. You get back a structured review with:
   - A plain-English summary of what the PR does
   - Key changes highlighted by file with impact level
   - Potential risks flagged by severity
   - Actionable suggestions for improvement

Works with **public and private repos** (private repos require a GitHub token with `repo` scope).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui |
| AI | Claude Sonnet via `@anthropic-ai/sdk` |
| GitHub | REST API v3 (raw fetch) |
| Testing | Vitest, @testing-library/react |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 20+
- An [Anthropic API key](https://console.anthropic.com/)
- (Optional) A [GitHub personal access token](https://github.com/settings/tokens) for private repos and higher rate limits

### Setup

```bash
# Clone the repo
git clone https://github.com/solasamuel/gitbrief.git
cd gitbrief

# Install dependencies
npm install

# Create your environment file
cp .env.example .env.local
```

Edit `.env.local` with your keys:

```
ANTHROPIC_API_KEY=sk-ant-...
GITHUB_TOKEN=ghp_...          # optional, needed for private repos
```

### Development

```bash
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build
npm run start      # Start production server
```

### Testing

```bash
npm run test          # Run all tests once
npm run test:watch    # Run tests in watch mode
```

Tests are written with Vitest and organized alongside the code they test in `__tests__/` directories. The [Vitest VS Code extension](https://marketplace.visualstudio.com/items?itemName=vitest.explorer) provides integrated test discovery and debugging.

### Code Quality

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript type checking (tsc --noEmit)
```

## Project Structure

```
src/
  app/
    page.tsx                    # Home page (PR input + results)
    layout.tsx                  # Root layout, metadata
    api/analyze/
      route.ts                  # POST /api/analyze endpoint
  components/
    pr-url-form.tsx             # URL input form
    analysis-loading.tsx        # Loading skeleton
    analysis-results.tsx        # Structured results display
    error-display.tsx           # Error states with retry
  lib/
    parse-pr-url.ts             # GitHub PR URL parser
    github-client.ts            # GitHub REST API client
    diff-utils.ts               # Diff truncation and filtering
    prompt-builder.ts           # Claude prompt construction
    claude-client.ts            # Claude API client
    rate-limiter.ts             # In-memory rate limiting
    types.ts                    # Shared TypeScript types
    errors.ts                   # Custom error classes
docs/
  solution-architecture.md      # System design and API contracts
  product-backlog.json          # Ordered backlog for TDD implementation
  testing-plan.json             # Test plan mapped to backlog items
```

## API

### POST /api/analyze

Analyzes a GitHub pull request and returns a structured review.

**Request:**

```json
{ "url": "https://github.com/owner/repo/pull/123" }
```

**Response:**

```json
{
  "metadata": {
    "title": "Add user authentication",
    "author": "developer",
    "baseBranch": "main",
    "headBranch": "feature/auth"
  },
  "stats": {
    "filesChanged": 12,
    "insertions": 340,
    "deletions": 28
  },
  "analysis": {
    "summary": "This PR adds JWT-based authentication...",
    "keyChanges": [{ "file": "src/auth.ts", "description": "...", "impact": "high" }],
    "risks": [{ "severity": "medium", "title": "...", "description": "..." }],
    "suggestions": [{ "category": "security", "title": "...", "description": "..." }]
  }
}
```

See [docs/solution-architecture.md](docs/solution-architecture.md) for full API contract and error codes.

## Branching Strategy

```
main            <- production (deployed to Vercel)
  └── develop   <- integration branch
        └── feature/BL-{id}-{description}
```

- Feature branches: `feature/BL-{id}-{short-description}`
- Commit messages: `feat(BL-002): add PR URL parser with validation`
- Each backlog item = one feature branch, TDD (red-green-refactor), merge to develop

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude access |
| `GITHUB_TOKEN` | No | GitHub PAT for private repos and higher rate limits (5000/hr vs 60/hr) |

## Deployment

The app is designed for [Vercel](https://vercel.com):

1. Connect the repo to Vercel
2. Set `ANTHROPIC_API_KEY` and `GITHUB_TOKEN` in Vercel environment variables
3. Deploy -- every push to `main` triggers a production deploy

## License

MIT
