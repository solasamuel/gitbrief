# GitBrief

A Chrome browser extension that provides AI-powered GitHub PR reviews. Paste a pull request URL or let it auto-detect from your current tab, and get an instant structured code review: plain-English summary, key changes, risks, and actionable suggestions.

Users provide their own API keys — no server, no account, no data collection.

## How It Works

1. Click the GitBrief extension icon while on a GitHub PR page (or paste a URL manually)
2. The extension fetches the diff and metadata via the GitHub REST API
3. The diff is processed (filtered, truncated if needed) and sent to Claude for analysis
4. You get back a structured review with:
   - A plain-English summary of what the PR does
   - Key changes highlighted by file with impact level
   - Potential risks flagged by severity
   - Actionable suggestions for improvement

Works with **public and private repos** (private repos require a GitHub token with `repo` scope).

## Setup

### Prerequisites

- Chrome (or Chromium-based browser)
- An [Anthropic API key](https://console.anthropic.com/)
- (Optional) A [GitHub personal access token](https://github.com/settings/tokens) for private repos and higher rate limits

### Install from Source

```bash
git clone https://github.com/solasamuel/gitbrief.git
cd gitbrief
npm install
npm run build
```

Then load the extension:
1. Open `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist/` directory

### Configure API Keys

1. Click the GitBrief extension icon
2. Go to **Settings** (or right-click the icon > Options)
3. Enter your Anthropic API key (required)
4. Enter your GitHub token (optional, for private repos)
5. Click Save

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Platform | Chrome Extension (Manifest V3) |
| Language | TypeScript |
| UI | React, Tailwind CSS v4 |
| AI | Claude Sonnet via raw fetch to Anthropic API |
| GitHub | REST API v3 (raw fetch) |
| Bundler | Vite + @crxjs/vite-plugin |
| Testing | Vitest, @testing-library/react |

## Development

```bash
npm run dev          # Start Vite dev server (HMR for extension)
npm run build        # Production build to dist/
npm run package      # Build + create gitbrief-extension.zip
```

Load the `dist/` directory as an unpacked extension in Chrome for development.

### Testing

```bash
npm run test          # Run all tests once
npm run test:watch    # Run tests in watch mode
```

Tests use Vitest and are organized in `__tests__/` directories alongside the code they test. The [Vitest VS Code extension](https://marketplace.visualstudio.com/items?itemName=vitest.explorer) provides integrated test discovery.

### Code Quality

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript type checking (tsc --noEmit)
```

## Project Structure

```
src/
  lib/                              # Pure business logic
    parse-pr-url.ts                 # GitHub PR URL parser
    github-client.ts                # GitHub REST API client
    diff-utils.ts                   # Diff truncation and filtering
    prompt-builder.ts               # Claude prompt construction
    claude-client.ts                # Claude API client (raw fetch)
    storage.ts                      # chrome.storage.local wrapper
    analyzer.ts                     # Orchestration layer
    types.ts                        # Shared TypeScript types
    errors.ts                       # Custom error classes
  popup/                            # Extension popup UI
    App.tsx                         # Main popup component
    components/                     # UI components
  options/                          # Settings page (API keys)
  background/                       # Service worker
  content/                          # Content script (optional)
docs/
  solution-architecture.md          # System design
  product-backlog.json              # Ordered backlog
  testing-plan.json                 # Test plan
```

## Branching Strategy

```
main            <- production
  └── develop   <- integration branch
        └── feature/BL-{id}-{description}
```

- Feature branches: `feature/BL-{id}-{short-description}`
- Commit messages: `feat(BL-002): add PR URL parser with validation`
- Each backlog item = one feature branch, TDD (red-green-refactor), merge to develop

## Privacy & Security

- **No server** — all API calls happen directly from the extension to GitHub and Anthropic
- **Your keys stay local** — stored in Chrome's encrypted extension storage, never transmitted anywhere else
- **No analytics, no tracking, no data collection**
- **Open source** — inspect the code yourself

## License

MIT
