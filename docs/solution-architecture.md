# GitBrief — Solution Architecture

## System Overview

GitBrief is a Chrome browser extension (Manifest V3). Users provide their own API keys. The extension popup makes direct API calls to GitHub and Anthropic — no backend server required.

```
┌─────────────────────────────────────────────────────┐
│  Chrome Extension                                   │
│                                                     │
│  ┌─────────────┐    ┌───────────────────────────┐   │
│  │  Options     │    │  Popup (React)            │   │
│  │  Page        │    │                           │   │
│  │             ─┼──▶ │  PrUrlForm                │   │
│  │  API Keys    │    │  AnalysisLoading           │   │
│  │  (storage)   │    │  AnalysisResults           │   │
│  └─────────────┘    │  ErrorDisplay              │   │
│                      └──────────┬────────────────┘   │
│                                 │                    │
│                      ┌──────────▼────────────────┐   │
│                      │  analyzer.ts              │   │
│                      │  (orchestration)          │   │
│                      └──────────┬────────────────┘   │
│                                 │                    │
│               ┌─────────────────┼─────────────────┐  │
│               ▼                 ▼                 ▼  │
│     ┌──────────────┐  ┌──────────────┐  ┌────────┐  │
│     │ GitHub API   │  │ Claude API   │  │Storage │  │
│     │ (raw fetch)  │  │ (raw fetch)  │  │(chrome)│  │
│     └──────┬───────┘  └──────┬───────┘  └────────┘  │
└────────────┼─────────────────┼──────────────────────┘
             │                 │
             ▼                 ▼
    ┌──────────────┐  ┌──────────────┐
    │ api.github   │  │api.anthropic │
    │ .com         │  │.com          │
    └──────────────┘  └──────────────┘
```

## Component Breakdown

```
src/
  lib/                              # Pure business logic (no browser/extension deps)
    types.ts                        # All shared TypeScript types
    errors.ts                       # Custom error classes
    parse-pr-url.ts                 # URL -> {owner, repo, pullNumber}
    github-client.ts                # GitHub REST API: metadata + diff
    diff-utils.ts                   # truncate, filter, stats
    prompt-builder.ts               # (metadata, diff) -> Claude messages
    claude-client.ts                # Raw fetch to Anthropic API
    storage.ts                      # chrome.storage.local wrapper
    analyzer.ts                     # Orchestrates full analysis pipeline

  popup/                            # Extension popup UI
    App.tsx                         # State machine: idle -> loading -> success/error
    components/
      PrUrlForm.tsx                 # URL input with tab auto-detect
      AnalysisLoading.tsx           # Loading spinner
      AnalysisResults.tsx           # Structured results display
      ErrorDisplay.tsx              # Error alert + retry + options link

  options/                          # Settings page
    Options.tsx                     # API key input form

  background/                       # Service worker
    service-worker.ts               # Minimal (extension lifecycle)

  content/                          # Optional content script
    content-script.ts               # Inject button on GitHub PR pages
```

## Data Flow

```
1. User clicks extension icon (or navigates to a GitHub PR page)
2. Popup opens, auto-detects PR URL from active tab via chrome.tabs.query
3. User clicks "Analyze" (or URL is manually entered)
4. analyzer.ts orchestrates:
   a. getApiKeys() -> reads keys from chrome.storage.local
   b. parsePrUrl(url) -> {owner, repo, pullNumber}
   c. fetchPrMetadata(owner, repo, pullNumber, token) -> PrMetadata
   d. fetchPrDiff(owner, repo, pullNumber, token) -> rawDiff
   e. filterDiff(rawDiff) -> filteredDiff
   f. truncateDiff(filteredDiff) -> processedDiff
   g. extractDiffStats(filteredDiff) -> DiffStats
   h. buildAnalysisPrompt(metadata, processedDiff) -> messages
   i. analyzeWithClaude(messages, apiKey) -> AnalysisResult
   j. Return { metadata, stats, analysis, meta }
5. Popup renders AnalysisResults
```

## API Contracts

### GitHub REST API v3 (called from extension)

**Get PR metadata:** `GET https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}`
**Get PR diff:** `GET https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}` with `Accept: application/vnd.github.v3.diff`

### Anthropic Messages API (called from extension)

**Analyze diff:** `POST https://api.anthropic.com/v1/messages`
- Headers: `x-api-key`, `anthropic-version: 2023-06-01`, `content-type: application/json`
- Body: `{ model, max_tokens: 4096, system, messages: [{role: "user", content}] }`
- Response: `{ content: [{ type: "text", text: "<JSON>" }] }`

### Analysis Response Shape

```typescript
{
  metadata: { title, author, body, state, baseBranch, headBranch, htmlUrl, createdAt }
  stats: { filesChanged, insertions, deletions }
  analysis: {
    summary: string
    keyChanges: [{ file, description, impact: "high"|"medium"|"low" }]
    risks: [{ severity: "high"|"medium"|"low", title, description }]
    suggestions: [{ category, title, description }]
  }
  meta: { diffTruncated, filesAnalyzed, model }
}
```

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Platform | Chrome Extension (Manifest V3) | Users provide own keys, no server needed |
| Bundler | Vite + @crxjs/vite-plugin | HMR in dev, automatic manifest handling |
| UI | React + Tailwind CSS | Fast popup development |
| Claude API | Raw fetch (no SDK) | SDK uses Node.js APIs; raw fetch works natively in extensions |
| GitHub API | Raw fetch | Only 2 endpoints needed |
| API calls | From popup context | Simpler than message passing through background worker |
| CORS | host_permissions in manifest | Bypasses CORS for declared origins; no proxy needed |
| Key storage | chrome.storage.local | Encrypted at rest, scoped to extension, persists across sessions |
| Tab detection | chrome.tabs.query + activeTab | Reads URL on popup open; minimal permission |
| Testing | Vitest + @testing-library/react | Fast, TS-native, works for extension code |

## Security Model

1. **No server** — all API calls happen client-side in the extension
2. **User-provided keys** — stored in `chrome.storage.local`, encrypted at rest by Chrome, scoped to the extension
3. **host_permissions** — explicitly declares which origins the extension can contact (GitHub, Anthropic)
4. **No remote code** — all code is bundled; no `eval()`, no CDN scripts
5. **Content Security Policy** — Manifest V3 default CSP is sufficient (no inline scripts, no remote code)
6. **activeTab** — only reads the URL of the active tab when the user clicks the extension icon

## Non-Functional Requirements

- **Response time**: Target < 15 seconds (GitHub ~1s + Claude ~5-10s)
- **Max diff size**: 100,000 characters after filtering
- **Popup dimensions**: 400px wide, 300-600px tall, scrollable
- **Accessibility**: Interactive components have ARIA attributes
- **Distribution**: Chrome Web Store or side-loaded via `chrome://extensions`
