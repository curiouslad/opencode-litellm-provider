# OpenCode LiteLLM Provider Plugin TODO

## Phase 1: Foundation & Project Setup
- [x] Initialize project structure (`package.json`, `tsconfig.json`, `src/`)
- [x] Implement Configuration Handler (`src/config.ts`) for `~/.config/opencode/auth.json`

## Phase 2: Core Logic
- [x] Implement LiteLLM API Client (`src/client.ts`) — model discovery + capability enrichment via `/model/info`
- [x] Implement Provider Plugin Entry Point (`src/index.ts`) with dynamic model discovery

## Phase 3: Management Tools
- [x] Implement `litellm:connect` tool (`src/tools.ts`) for Add/List/Remove servers
- [x] Auth hook with SDK-compliant contract (`label`, correct return types)
- [x] Connection verification during setup (fetches models to validate key + URL)
- [x] Input validation on prompts (alias format, URL format, key presence)

## Phase 4: Build & Deployment
- [x] Configure Build Script (single bundled JS output, clean dist)
- [x] Implement Auto-Install Script to `~/.config/opencode/plugins/`

## Phase 5: Validation
- [x] Verify multi-server support
- [x] Verify automatic model detection on session start
- [x] Verify capability enrichment from `/model/info` endpoint
- [x] Test suite — 9 tests covering config hook, auth hook, tool, capabilities, validation
