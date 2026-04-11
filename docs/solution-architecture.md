# GitBrief — Solution Architecture

## System Overview

GitBrief is a single-page web application with one API route. Users provide a GitHub PR URL, the server fetches the PR diff from GitHub, sends it to Claude for analysis, and returns a structured code review to the client.

```
┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐
│              │     │                   │     │                  │
│  Browser     │────▶│  Next.js Server   │────▶│  GitHub REST API │
│  (React SPA) │     │  POST /api/analyze│     │  (diff + meta)   │
│              │◀────│                   │◀────│                  │
└──────────────┘     │                   │     └──────────────────┘
                     │                   │
                     │                   │────▶┌──────────────────┐
                     │                   │     │  Claude API      │
                     │                   │◀────│  (Sonnet)        │
                     └───────────────────┘     └──────────────────┘
```

## Component Breakdown

```
src/
  lib/
    parse-pr-url.ts          # Pure function: URL -> {owner, repo, pullNumber}
    github-client.ts         # Fetch wrapper: GitHub REST API v3
    diff-utils.ts            # Pure functions: truncate, filter, stats
    prompt-builder.ts        # Pure function: (metadata, diff) -> messages
    claude-client.ts         # SDK wrapper: send prompt, parse response
    rate-limiter.ts          # In-memory sliding window rate limiter
    types.ts                 # All shared TypeScript types
    errors.ts                # Custom error classes
  components/
    pr-url-form.tsx          # URL input + submit
    analysis-loading.tsx     # Loading skeleton
    analysis-results.tsx     # Structured results display
    error-display.tsx        # Error alert + retry
  app/
    layout.tsx               # Root layout, fonts, metadata
    page.tsx                 # Home page, state machine
    api/
      analyze/
        route.ts             # POST handler, orchestrates flow
```

## Data Flow

```
1. User enters PR URL in PrUrlForm
2. page.tsx calls POST /api/analyze { url }
3. route.ts orchestrates:
   a. parsePrUrl(url) -> { owner, repo, pullNumber }
   b. fetchPrMetadata(owner, repo, pullNumber) -> PrMetadata
   c. fetchPrDiff(owner, repo, pullNumber) -> rawDiff
   d. filterDiff(rawDiff) -> filteredDiff
   e. truncateDiff(filteredDiff) -> processedDiff
   f. extractDiffStats(filteredDiff) -> DiffStats
   g. buildAnalysisPrompt(metadata, processedDiff) -> messages
   h. claudeClient.analyze(messages) -> AnalysisResult
   i. Return { metadata, stats, analysis, meta }
4. page.tsx renders AnalysisResults
```

## API Contract

### POST /api/analyze

**Request:**
```json
{ "url": "https://github.com/owner/repo/pull/123" }
```

**Success Response (200):**
```typescript
{
  metadata: {
    title: string;
    author: string;
    body: string | null;
    state: string;
    baseBranch: string;
    headBranch: string;
    htmlUrl: string;
    createdAt: string;
  };
  stats: {
    filesChanged: number;
    insertions: number;
    deletions: number;
  };
  analysis: {
    summary: string;
    keyChanges: Array<{ file: string; description: string; impact: "high" | "medium" | "low" }>;
    risks: Array<{ severity: "high" | "medium" | "low"; title: string; description: string }>;
    suggestions: Array<{ category: string; title: string; description: string }>;
  };
  meta: {
    diffTruncated: boolean;
    filesAnalyzed: number;
    model: string;
  };
}
```

**Error Response (400 | 429 | 502):**
```typescript
{
  error: string;
  code: "INVALID_URL" | "INVALID_BODY" | "GITHUB_ERROR" | "CLAUDE_ERROR" | "RATE_LIMITED";
}
```

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 15 App Router | Server-side API routes collocated with frontend; Vercel-native |
| Styling | Tailwind CSS v4 + shadcn/ui | Rapid UI development; no runtime CSS cost |
| AI SDK | @anthropic-ai/sdk | Official SDK; handles auth, retries |
| GitHub API | Raw fetch | Only 2 endpoints needed; no Octokit overhead |
| Testing | Vitest + @testing-library/react | Fast, TypeScript-native, Jest-compatible |
| Model | claude-sonnet-4-20250514 | Best balance of speed and quality for code analysis |
| Deployment | Vercel | Zero-config Next.js hosting; automatic preview deploys |

## Security Model

1. **API keys server-side only** -- `ANTHROPIC_API_KEY` and `GITHUB_TOKEN` are environment variables, never sent to the client
2. **Input validation** -- PR URL parsed and validated before any external API call
3. **Rate limiting** -- In-memory sliding window (10 req/min per IP) to prevent abuse
4. **No data persistence** -- Stateless request/response; no user data stored
5. **GITHUB_TOKEN optional** -- Works without it for public repos (60 req/hr limit)

## Non-Functional Requirements

- **Response time**: Target < 15 seconds end-to-end
- **Max diff size**: 100,000 characters after filtering
- **Error recovery**: All external API errors caught and returned as structured responses
- **Accessibility**: All interactive components have proper ARIA attributes
- **Mobile responsive**: Layout works on 320px+ viewports
