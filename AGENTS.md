# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install       # Install dependencies
pnpm build         # Compile TypeScript to dist/
pnpm dev           # Run with MCP Inspector (for local testing)
pnpm start         # Run compiled server directly
```

### Publishing

```bash
pnpm changeset         # Create a changeset (describe changes)
pnpm changeset version # Bump version based on changesets
pnpm release           # Build + publish to npm
```

There are no tests in this project.

## Architecture

This is a single-tool MCP server that exposes `sequentialthinking_tools`. It is adapted from the [MCP Sequential Thinking Server](https://github.com/modelcontextprotocol/servers/blob/main/src/sequentialthinking/index.ts) but focused on **tool recommendations** rather than tool execution — the MCP client executes tools; this server only tracks and organizes recommendations.

### Source files (`src/`)

- **`types.ts`** — TypeScript interfaces: `ThoughtData`, `ToolRecommendation`, `StepRecommendation`, `Tool`, `ServerConfig`
- **`schema.ts`** — Valibot schemas mirroring the types, plus `SEQUENTIAL_THINKING_TOOL` constant with the full tool description
- **`index.ts`** — Entry point: creates `McpServer` (via `tmcp`), instantiates `ToolAwareSequentialThinkingServer`, registers the tool, starts stdio transport

### Key design points

- Uses `tmcp` + `@tmcp/adapter-valibot` + `@tmcp/transport-stdio` (not the official `@modelcontextprotocol/sdk`)
- Schema validation is handled by `tmcp` via the Valibot adapter; `processThought` receives pre-validated input
- `ToolAwareSequentialThinkingServer` maintains in-memory `thought_history` (capped at `MAX_HISTORY_SIZE`, default 1000) and a `branches` map for branching thought paths
- All server-side logging goes to `stderr` (never stdout, which is reserved for the MCP stdio protocol)
- The server reads its own `package.json` at runtime to populate `name`/`version` in the MCP server info
- `MAX_HISTORY_SIZE` env var controls history retention

### Data flow

1. LLM calls `sequentialthinking_tools` with a `thought`, `available_mcp_tools`, step info, etc.
2. `processThought` validates, appends `current_step` to `previous_steps`, stores in history, formats and logs to stderr
3. Returns JSON with `thought_number`, `total_thoughts`, `next_thought_needed`, branch state, and the step recommendation fields
4. LLM reads the response, executes recommended tools itself, then calls the tool again for the next thought
