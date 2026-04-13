# GitBrief — Solution Architecture

## System Overview

GitBrief is a Chrome browser extension (Manifest V3) that injects a sidebar panel on GitHub PR pages. Users provide their own API keys. All API calls go through the background service worker. No backend server.

```
GitHub PR Page (github.com/owner/repo/pull/123)
  ├── Toggle Button (GitHub DOM, uses GitHub's btn classes)
  └── Sidebar Panel (shadow DOM, React + Tailwind, 350px fixed right)
        │
        │  chrome.runtime.connect (port — streaming)
        ▼
Background Service Worker
  ├── Reads keys from chrome.storage.sync
  ├── Calls GitHub API (raw fetch via host_permissions)
  ├── Calls Claude API (streaming SSE via host_permissions)
  └── Relays progress + chunks back to sidebar via port

Popup (extension icon click)
  └── Settings form only (API key management)
```

## Why Background Worker for API Calls

Content scripts in Manifest V3 **cannot** make cross-origin requests. Only the background service worker has access to `host_permissions`. The worker acts as a relay:
1. Content script opens a port via `chrome.runtime.connect`
2. Worker receives the PR URL, runs the full pipeline
3. Worker streams results back via `port.postMessage()`

## Component Breakdown

```
src/
  lib/                              # Pure business logic (no browser deps)
    types.ts                        # Shared types + message types
    errors.ts                       # Custom error classes
    parse-pr-url.ts                 # URL → {owner, repo, pullNumber}
    github-client.ts                # GitHub REST API: metadata + diff
    diff-utils.ts                   # truncate, filter, stats
    prompt-builder.ts               # (metadata, diff) → Claude messages
    claude-client.ts                # Raw fetch to Anthropic API (+ streaming)
    storage.ts                      # chrome.storage.sync wrapper

  content/                          # Sidebar UI (injected on PR pages)
    content-script.ts               # PR detection, toggle button, sidebar lifecycle
    sidebar/
      index.tsx                     # Shadow DOM mount
      Sidebar.tsx                   # Main component (state machine)
      sidebar.css                   # Tailwind (imported ?inline for shadow DOM)
      components/
        AnalyzeButton.tsx
        AnalysisResults.tsx
        LoadingState.tsx
        ErrorState.tsx

  popup/                            # Settings only
    App.tsx                         # API key form
    popup.css

  background/                       # API relay
    service-worker.ts               # onConnect/onMessage handlers
    message-types.ts                # Typed message definitions
```

## Data Flow

```
1. User navigates to a GitHub PR page
2. Content script detects PR via turbo:load / MutationObserver / popstate
3. Toggle button injected into GitHub's .gh-header-actions
4. User clicks toggle → sidebar opens (shadow DOM)
5. User clicks "Analyze" → content script opens port:
   chrome.runtime.connect({ name: 'analyze' })
6. Background worker receives port, orchestrates:
   a. getApiKeys() → chrome.storage.sync
   b. parsePrUrl(url) → {owner, repo, pullNumber}
   c. fetchPrMetadata() → PrMetadata          [PROGRESS: fetching_metadata]
   d. fetchPrDiff() → rawDiff                  [PROGRESS: fetching_diff]
   e. filterDiff() → truncateDiff()            [PROGRESS: processing_diff]
   f. buildAnalysisPrompt() → messages
   g. analyzeWithClaudeStream() → SSE chunks   [PROGRESS: analyzing]
      → relay STREAM_CHUNK for each text delta
   h. Parse final JSON                         [COMPLETE: AnalysisResponse]
7. Sidebar renders results progressively
```

## Message Protocol

```typescript
// Content script → Background (via port)
{ type: 'START_ANALYSIS', prUrl: string }

// Background → Content script (via port)
{ type: 'PROGRESS', stage: 'fetching_metadata' | 'fetching_diff' | 'processing_diff' | 'analyzing' }
{ type: 'STREAM_CHUNK', text: string }
{ type: 'COMPLETE', data: AnalysisResponse }
{ type: 'ERROR', error: string, code?: ErrorCode }

// One-shot messages (chrome.runtime.sendMessage)
{ type: 'CHECK_API_KEYS' } → { hasKeys: boolean }
```

## Key Implementation Details

### PR Detection (GitHub SPA)
Triple-layer: `turbo:load` event (GitHub uses Turbo Drive), `popstate` for back/forward, MutationObserver on `<title>` as fallback.

### Shadow DOM
Sidebar styles isolated via `attachShadow({mode: 'open'})`. Tailwind CSS imported as inline string (`?inline` Vite suffix) and injected into shadow root `<style>` tag.

### Claude SSE Streaming
`analyzeWithClaudeStream(prompt, apiKey, onChunk)` sends `stream: true` to Anthropic API. Parses `content_block_delta` SSE events from `ReadableStream`. Accumulates text, calls `onChunk` per delta. Parses final JSON on `message_stop`.

### Storage
`chrome.storage.sync` (not local) — keys persist across Chrome instances signed into the same Google account.

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UI location | Sidebar on GitHub PR page | Contextual — user sees review alongside the PR |
| Style isolation | Shadow DOM | Prevents GitHub CSS from affecting sidebar and vice versa |
| API relay | Background service worker | MV3 content scripts can't make cross-origin requests |
| Streaming | chrome.runtime.connect port | Persistent connection for progressive updates |
| Claude API | Raw fetch with stream:true | No SDK; works natively in service worker |
| Key storage | chrome.storage.sync | Cross-device persistence |
| PR detection | turbo:load + MutationObserver | Handles GitHub's SPA navigation |

## Security Model

1. **User-provided keys** — stored in `chrome.storage.sync`, encrypted at rest by Chrome
2. **host_permissions** — explicitly declares api.github.com and api.anthropic.com
3. **No remote code** — all code bundled; no eval(), no CDN
4. **Shadow DOM** — sidebar cannot be manipulated by GitHub's JavaScript
5. **activeTab** — minimal permission for tab URL detection
