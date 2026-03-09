# AI Soroswap Integration

_Time Estimate: 60 mins (Vibe Coding)_

Soroswap is an open-source protocol designed for liquidity provision and token trading on the Soroban blockchain. It operates without the need for intermediaries, ensuring a secure, transparent, and efficient trading environment.

Soroswap consists of three main components:

* **Soroswap AMM**: An Automated Market Maker that facilitates token swaps and liquidity provision.
* **Soroswap Aggregator**: An AMM Aggregator that optimizes trading routes across various liquidity pools.
* **Soroswap API**: The Soroswap API serves as the core interface to quote trades by aggregating liquidity from all available Stellar DEXs — including those on Soroban (Soroswap, Phoenix, Aqua) and the Stellar Classic DEX.

There are multiple ways to integrate Soroswap into your project, depending on your needs and technical stack. The easiest way to get started is to use the Soroswap API, which provides a simple REST interface for quoting trades and accessing liquidity across all Stellar DEXs.

For more advanced use cases, you can also interact directly with the Soroswap AMM smart contracts on Soroban. This allows you to build custom trading interfaces, create your own liquidity pools, or integrate Soroswap functionality directly into your dApp's backend.

A third option is to use the TypeScript SDK, which provides a convenient wrapper around the Soroswap API and smart contracts. The SDK simplifies the process of building custom integrations and can be used in both frontend and backend applications.

## Why Use Soroswap?
* **Optimized Aggregated Routing** - Best price. Every time.
* **Plug-and-Play REST API** - REST endpoints for everything
* **Smooth Integration** - From zero to production, fast
* **Gasless Trustlines** - Trustlines without the friction

Learn more about Soroswap and get started with these resources:

* [Documentation]()
* [Soroswap Website]()
* [Soroswap GitHub]()
* [Soroswap API Reference]()
* [Soroswap SDK]()


## Vibe Coding
Soroswap is a well-documented, mature project in the Stellar Ecosystem, with an easy-to-use API, great documentation and a lot of example projects and open source projects, so Claude Code is very capable of integrating DeFindex.

A simple prompt to build a simple DeFindex-based dApp could look like this:

```
create an application using stellar freighter wallet and soroswap to make my own token swap application.
```

This will build a Next.js dapp with the Freighter wallet integration and the Soroswap integration, allowing users to connect their wallet, create vaults, deposit XLM, and earn yield on their assets.

# StellarSwap DEX — Build Report

**Project:** `stellar-soroswap-dex`
**Date:** 2026-03-02
**Outcome:** ✅ Success — running at http://localhost:3004

---

## Overview

Built a token swap DEX application ("StellarSwap") using the Stellar Freighter browser wallet and the Soroswap aggregator protocol. The app lets users swap tokens on the Stellar/Soroban network, routing through four DEX protocols simultaneously (Soroswap AMM, Phoenix, Aqua, SDEX) to get the best price.

---

## Build Timeline

### Phase 1 — Research

**Goal:** Understand the Soroswap API and SDK before writing any code.

Two parallel research approaches were used:
1. A `claude-code-guide` sub-agent was launched to look up Soroswap documentation
2. Direct `WebSearch` and `WebFetch` calls were made to gather API details

**Sub-agent failure:** The `claude-code-guide` agent hit a dead end — rather than searching the web, it attempted to inspect `settings.json` for permission configuration and stalled, returning no useful information.

**Recovery:** Switched to direct `WebSearch` queries which successfully surfaced:
- The `@soroswap/sdk` npm package and its GitHub repo
- The 4-step swap flow: `quote → build → sign → send`
- Testnet token contract addresses (XLM, USDC)
- API key requirements and base URL (`https://api.soroswap.finance`)
- The Soroswap docs beginner guide and API reference

---

### Phase 2 — Project Scaffolding

```bash
npx create-next-app@latest stellar-soroswap-dex \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --no-turbopack --yes
```

**Result:** Next.js **16.1.6** with React 19, TypeScript, Tailwind CSS, App Router.

**Gotcha — `tail` command not found:**
The first `npx create-next-app` call piped output to `tail -20` to limit log noise. This failed immediately because `tail` is not available in the sandboxed shell environment. Fixed by removing the pipe and capturing full output.

```bash
# ❌ Failed
npx create-next-app ... 2>&1 | tail -20

# ✅ Fixed
npx create-next-app ... 2>&1
```

---

### Phase 3 — Dependency Installation

```bash
npm install @stellar/freighter-api @stellar/stellar-sdk @soroswap/sdk
```

| Package | Version installed |
|---|---|
| `@soroswap/sdk` | ^0.3.8 |
| `@stellar/freighter-api` | ^6.0.1 |
| `@stellar/stellar-sdk` | ^14.5.0 |

**Gotcha — Package name ambiguity:**
The Soroswap GitHub README showed the install command as `pnpm install soroswap-sdk` (unscoped). The npm registry URL however clearly showed the package lives at `@soroswap/sdk` (scoped). The README was outdated/incorrect. Used `@soroswap/sdk` which resolved correctly.

**SDK introspection:**
Before writing any code, the SDK was probed at the Node.js REPL to confirm the actual exports and method signatures, avoiding assumptions:

```js
// Confirmed exports
Object.keys(require('@soroswap/sdk'))
// → ['SoroswapSDK', 'HttpClient', 'TradeType', 'SupportedAssetLists',
//    'SupportedPlatforms', 'SupportedNetworks', 'SupportedProtocols', ...]

// Confirmed enum values
SupportedNetworks   → { TESTNET: 'testnet', MAINNET: 'mainnet' }
SupportedProtocols  → { SOROSWAP, PHOENIX, AQUA, SDEX }
TradeType           → { EXACT_IN: 'EXACT_IN', EXACT_OUT: 'EXACT_OUT' }

// Confirmed instance methods
['quote', 'build', 'send', 'getAssetList', 'getPools', 'getPrice', ...]
```

This step prevented several potential bugs (e.g., wrong enum values, non-existent methods).

---

### Phase 4 — Architecture Decision: Server-Side SDK

**Key constraint discovered:** `@soroswap/sdk` requires a secret API key (`sk_...`) from Soroswap. Embedding this in client-side code would expose it publicly.

**Solution:** All SDK calls are kept entirely server-side in Next.js API route handlers. The client only calls internal API routes — the real Soroswap API key never reaches the browser.

```
Client (browser)
  │
  ├── POST /api/soroswap/quote   ──▶  SoroswapSDK.quote()
  ├── POST /api/soroswap/build   ──▶  SoroswapSDK.build()   → unsigned XDR
  └── POST /api/soroswap/send    ──▶  SoroswapSDK.send()    ← signed XDR
       ↑
  Freighter signs the XDR client-side (private key never leaves the wallet)
```

This follows the same pattern established in `stellar-defindex-yield` where `@defindex/sdk` was similarly server-only.

---

### Phase 5 — API Routes

Four routes were created under `src/app/api/soroswap/`:

| Route | Method | Purpose |
|---|---|---|
| `/tokens` | GET | Returns token list; falls back to hardcoded if no API key |
| `/quote` | POST | Gets best-price quote across all protocols |
| `/build` | POST | Builds unsigned XDR transaction from a quote |
| `/send` | POST | Broadcasts signed XDR to the Stellar network |

**Gotcha — `amount` must be `BigInt`:**
The `quote()` method requires the amount as a JavaScript `BigInt`, not a plain number or string. Passing a number silently produces wrong results or throws. A `toBaseUnits()` helper was written to convert decimal strings (e.g. `"10.5"`) to the correct 7-decimal base units as `BigInt`.

```ts
// ❌ Wrong
amount: 10000000   // number — type error

// ✅ Correct
amount: BigInt(toBaseUnits("10.5", 7).toString())  // → 105000000n
```

**Gotcha — `slippageBps` is a string, not a number:**
Despite looking like a numeric parameter, `slippageBps` must be passed as a string (e.g. `'50'` for 0.5%). Passing a number causes SDK validation errors.

**Graceful API key handling:**
Rather than crashing, all routes check for the key and return a descriptive `503` error if it's missing. The `/tokens` route degrades gracefully to hardcoded tokens so the UI still renders without a key.

---

### Phase 6 — Components

**`WalletButton`** — Freighter wallet connect/disconnect.

*Gotcha — SSR crash with Freighter:*
`@stellar/freighter-api` uses `window` and other browser APIs internally. Importing it at the top of a `'use client'` component still causes a Next.js SSR build error because the module is evaluated during server-side rendering. Fixed with dynamic `import()` inside async functions:

```ts
// ❌ Crashes SSR
import { isConnected } from '@stellar/freighter-api';

// ✅ Safe — only runs in the browser
const freighter = await import('@stellar/freighter-api');
const result = await freighter.isConnected();
```

*Gotcha — `signTransaction` response shape:*
In `@stellar/freighter-api` v6, `signTransaction()` returns an object `{ signedTxXdr, signerAddress }`, not the XDR string directly. Additionally, it may include an `error` field on failure rather than throwing. Both cases are handled:

```ts
const signResult = await freighter.signTransaction(unsignedXdr, { ... });
if (signResult?.error) throw new Error(signResult.error);
const signedXdr = signResult?.signedTxXdr;  // ← not just `signResult`
```

**`TokenSelector`** — Searchable token picker modal.

A `mousedown` listener on `document` closes the modal when clicking outside, cleaned up in a `useEffect` return to avoid memory leaks.

**`SwapWidget`** — Core swap logic with full state machine.

Quote fetching is debounced at **600ms** to avoid hammering the API on every keystroke. A `useRef` timer is used rather than `useState` to avoid triggering re-renders on debounce ticks.

Status machine states: `idle → quoting → building → signing → sending → success | error`

Price impact is color-coded: green (<1%), yellow (1–5%), red (>5%).

---

### Phase 7 — Layout & Styling

**Gotcha — `layout.tsx` already exists:**
`create-next-app` generates a default `layout.tsx`. The Write tool rejects writing to an unread file. Had to `Read` the existing file first before overwriting it — a safety mechanism that prevents accidental overwrites.

The generated `globals.css` used Tailwind v4 syntax (`@import "tailwindcss"`) rather than the older v3 `@tailwind` directives. The new syntax was preserved rather than replaced.

---

### Phase 8 — Configuration

`launch.json` at the project root already had entries for three other Stellar projects. The new entry was appended:

```json
{
  "name": "stellar-soroswap-dex",
  "runtimeExecutable": "/usr/local/bin/node",
  "runtimeArgs": ["node_modules/.bin/next", "dev", "--port", "3004"],
  "port": 3004,
  "cwd": "/Users/carsten.jacobsen/Documents/Claude Code/stellar-soroswap-dex"
}
```

Port **3004** was chosen to avoid conflicts with existing projects (3000, 3002, 3003).

---

### Phase 9 — Verification

Server started cleanly in **829ms**. After page load:
- No server-side errors
- No browser console errors
- Token API route returned 200 with the token list
- XLM and USDC pre-populated in the swap widget
- Token selector dropdown opened and closed correctly
- Network toggle (testnet/mainnet) functional

**Gotcha — `preview_snapshot` tool failure:**
The accessibility snapshot tool returned `"t.slice is not a function"` — an internal MCP tool error, unrelated to the app itself. The `preview_screenshot` tool was used instead for visual verification.

---

## Final File Structure

```
stellar-soroswap-dex/
├── src/
│   ├── app/
│   │   ├── layout.tsx                      # Root layout, Geist font, dark bg
│   │   ├── page.tsx                        # Main page, wallet/network state
│   │   ├── globals.css                     # Tailwind v4, custom scrollbar
│   │   └── api/soroswap/
│   │       ├── quote/route.ts              # POST — get price quote
│   │       ├── build/route.ts              # POST — build unsigned XDR
│   │       ├── send/route.ts               # POST — broadcast signed XDR
│   │       └── tokens/route.ts             # GET  — token list
│   ├── components/
│   │   ├── WalletButton.tsx                # Freighter connect/disconnect
│   │   ├── TokenSelector.tsx               # Searchable token picker
│   │   └── SwapWidget.tsx                  # Core swap UI and logic
│   └── lib/
│       └── tokens.ts                       # Token list, unit conversion helpers
├── .env.local.example                      # API key template
└── BUILD_REPORT.md                         # This file
```

---

## Known Limitations & Next Steps

| Item | Notes |
|---|---|
| **Token list** | Currently only XLM + USDC on testnet; mainnet tokens need API key to expand |
| **Wallet balance display** | Shows `—`; requires Stellar Horizon/RPC call per-token |
| **Transaction history** | Not implemented; would require indexer or Horizon account lookup |
| **EXACT_OUT trade type** | Quote route supports it but UI only exposes EXACT_IN |
| **Launchtube (gasless)** | `send(xdr, false)` — gasless service disabled; user needs XLM for fees |
| **Error message quality** | Soroswap API errors can be verbose; could add a mapping layer |
| **Mainnet token addresses** | The hardcoded mainnet XLM/USDC contracts need verification |

---

## Key Lessons

1. **Always introspect SDKs at the REPL** before coding against them — README docs are often wrong or outdated (package names, method signatures, enum values).
2. **Secret API keys → server-side only** — use Next.js API routes as a proxy layer.
3. **Freighter must be dynamically imported** on the client side to avoid SSR crashes.
4. **`BigInt` is strict** — the Soroswap SDK will not silently coerce numbers.
5. **The Write tool requires a prior Read** on existing files — this is a safety guard, not a bug.
6. **Shell environment limitations** — common Unix utilities like `tail` may not be available; prefer capturing full output.
