# GitBrief Privacy Policy

**Last updated:** April 2026

## Overview

GitBrief is a Chrome browser extension that analyzes GitHub pull requests using AI. This privacy policy explains how GitBrief handles your data.

## Data Collection

**GitBrief does not collect, store, or transmit any personal data to any server operated by GitBrief or any third party.**

## Data Handling

### API Keys
- You provide your own Anthropic API key and optional GitHub token.
- These keys are stored locally in your browser using Chrome's encrypted extension storage (`chrome.storage.sync`).
- Keys are never transmitted anywhere except directly to the respective API services (Anthropic and GitHub) when you initiate an analysis.

### Pull Request Data
- When you click "Analyze," GitBrief fetches the pull request diff and metadata directly from the GitHub API using your browser.
- This data is sent to the Anthropic API for analysis.
- No pull request data is stored, cached, or logged by GitBrief.
- All API calls are made directly from your browser — there is no intermediary server.

### No Analytics or Tracking
- GitBrief does not include any analytics, telemetry, or tracking code.
- GitBrief does not use cookies.
- GitBrief does not collect usage statistics.

## Third-Party Services

GitBrief makes requests to the following services using your own API keys:

- **GitHub API** (api.github.com) — to fetch pull request metadata and diffs
- **Anthropic API** (api.anthropic.com) — to analyze diffs with Claude

These services have their own privacy policies:
- [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)
- [Anthropic Privacy Policy](https://www.anthropic.com/privacy)

## Permissions

GitBrief requests the following browser permissions:

| Permission | Purpose |
|-----------|---------|
| `storage` | Store your API keys in Chrome's encrypted extension storage |
| `activeTab` | Read the URL of the active tab to detect GitHub PR pages |
| `host_permissions` | Make API requests to GitHub and Anthropic |

## Changes

If this privacy policy changes, the updated version will be published in the GitBrief GitHub repository.

## Contact

For questions about this privacy policy, open an issue at [github.com/solasamuel/gitbrief](https://github.com/solasamuel/gitbrief).
