# Rove — Setup & Integration Guide

This guide walks through configuring and running Rove locally, verifying clean builds, running the benchmark suite, and integrating Rove into agent runtimes (Google Antigravity, Anthropic Claude Code, Cursor, and Windsurf).

---

## 1. Prerequisites

* **Node.js**: Version 22.0.0 or higher (`node -v`)
* **pnpm**: Version 10.0.0 or higher (`npm install -g pnpm`)
* **Git**: Version 2.40+

---

## 2. Installation & Clean-Room Verification

Clone the repository and install all dependencies:

```bash
git clone https://github.com/rove-finance/rove.git
cd rove
pnpm install
```

Run the complete verification suite across all 5 workspace packages and applications:

```bash
pnpm verify
```

This executes:
* `turbo run typecheck test build`
* Runs 35 unit and integration tests across `@rove/core`, `@rove/binance-agent-os`, `@rove/benchmark`, and `@rove/skill`.
* Compiles TypeScript definitions to `./dist/`.
* Bundles the production web application with Vite.

---

## 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Default settings in `.env`:
```bash
# Safety Gate: MUST remain false unless operator explicitly authorizes live execution
ROVE_ENABLE_LIVE_TRADE=false

# Binance Agent OS MCP Streamable HTTP Gateway
BINANCE_AGENTIC_MCP_URL=https://agent.binance.com/mcp/agentic

# Maximum allowable snapshot skew in milliseconds
ROVE_MAX_SNAPSHOT_SKEW_MS=1500
```

---

## 4. Connecting Binance Agent OS MCP

Binance Agent OS uses **RFC 9207 OAuth 2.0 with PKCE** over Streamable HTTP / JSON-RPC.

### Option A: Antigravity IDE
In `~/.gemini/config/mcp_config.json`:
```json
{
  "mcpServers": {
    "binance": {
      "serverUrl": "https://agent.binance.com/mcp/agentic"
    }
  }
}
```
Upon startup, Antigravity prompts for Binance OAuth authorization and registers all 81 MCP tools.

### Option B: Claude Code CLI
```bash
claude mcp add binance --transport http https://agent.binance.com/mcp/agentic
```

### Option C: Cursor / Windsurf
Add the MCP configuration to `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "binance": {
      "url": "https://agent.binance.com/mcp/agentic"
    }
  }
}
```

---

## 5. Running the Web Application

Launch the local reactive dashboard:

```bash
pnpm --filter rove-web dev
```
Open `http://localhost:5173` in your browser.

The web app features:
1. **Interactive What-If Simulator**: Adjust objectives, assets, exposure fractions, leverage, and carry caps to watch Route Cards update in real-time.
2. **Rove Bench Explorer**: Inspect the 20-intent benchmark matrix, ablations, and cost delta comparisons.
3. **Ground-Truth Evidence**: View live MCP endpoints, tool catalog counts, and verification statuses.

---

## 6. Running Benchmark & Live Demos

### Re-run the 100-Snapshot Benchmark:
```bash
node scripts/run-benchmark.mjs
```
Generates `benchmarks/results.json`, `benchmarks/results.csv`, and `evidence/headline.json`.

### Re-run Live Read Snapshot & Route Card Generation:
```bash
node scripts/generate-live-demo.mjs
```
Generates live evaluation markdown files in `evidence/live/`.
