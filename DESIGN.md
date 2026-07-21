# HERD — Design & Build Plan

## Thesis

A living, real-time artificial economy: a fast, correct market where **evolutionary trading
agents** live, compete, and die — and humans can jump in and try to beat them.

One asset. Play money. Server-authoritative. No blockchain, no LLMs in the trading loop.

## Principles (the guardrails)

1. **Depth in one lane, not breadth.** Quality comes from a correct, fast, living market — not
   from more features. Every proposed feature must pass: *does this deepen the "living market"
   thesis, or just widen the surface?* If it widens, cut it.
2. **Server is the source of truth.** Clients send *intent* ("buy 5"), never state. Never trust a
   client-supplied price, balance, or fill.
3. **Play money only, never cashable out.** No real money buys anything tradeable-for-value (that
   would be gambling / money transmission). Real payments, if added, are test-mode and cosmetic.
4. **The market is never dead.** Agents provide 24/7 liquidity and drama even with zero humans.



## What we are NOT building

Postgres · Redis (until scale-out) · Celery · Docker · Grafana · auth with passwords ·
user-created assets (v1) · blockchain · LLM trading brains · mobile app.

## Architecture

```
Browser (static HTML/JS)                       Server (single Node/Bun + TypeScript process)
────────────────────────                       ──────────────────────────────────────────────
 optimistic UI, price chart   ── WS intent ──►  Gateway (WS): auth, rate-limit, validate
 interpolated between ticks                        │  enqueue orders
 renders latest snapshot      ◄─ WS snapshot ──    ▼
                                 (20–33 Hz)      Engine (single-threaded event loop)
                                                   │  matches orders / applies AMM
                                                   │  posts to Ledger (double-entry)
                                                   │  appends to Event Log (append-only)
                                                   ▼
                                                 Snapshot broadcaster (fixed tick, delta)
                                                   ▲
                                                 Agents (in-process): evolved strategies
                                                 submit orders like any other client
```

20 * 1/sec     = 0.04 sec

**Key latency idea:** decouple *ingest* (per-order, immediate) from *broadcast* (fixed tick,
batched, delta-compressed). Clients only need the latest state → drop stale snapshots for slow
consumers (backpressure). One process serves thousands of connections; shard behind a pub/sub
gateway tier only if it actually blows up.

**Why single-threaded engine:** all orders funnel into one ordered queue, processed one at a time.
No locks, no races, fully deterministic → replayable from the event log. (LMAX Disruptor pattern.)

## Core data model (in-memory)

```ts
Account   { id, kind: 'user'|'agent'|'house', displayName }
Ledger    { balances: Map<accountId, cents>, INVARIANT: sum === constant }
Position  { accountId, qty, avgCost }            // per account, one asset
Order     { id, accountId, side: 'buy'|'sell', qty, idempotencyKey }
Trade     { id, price, qty, buyer, seller, ts }
Event     { seq, type, payload }                 // the append-only log = source of truth
Snapshot  { price, recentTrades[], topOfBook, leaderboardDelta, ts }
```

**Settlement = double-entry.** Every trade posts balanced debits/credits across accounts. The
invariant `sum(balances) === constant` is asserted after every transaction; drift = bug, detectable.
Every order carries an idempotency key; replays are no-ops.

## Tech stack

- **Server:** Bun + TypeScript + `ws` (velocity; swap to Go later if you want the latency flex).
- **Client:** one static `index.html` + vanilla JS/Canvas. No framework.
- **Persistence:** append-only event log (file) + periodic state snapshot. Recovery = replay tail.
- **Deploy:** single small box (Fly.io / Railway / a VPS). Static page on the same server.

---

## Build plan (each milestone ships something demoable)

### M1 — "it's real-time" *(the dopamine proof)*
Goal: two browser tabs trade the same asset and both see the price move live.
- `server/index.ts`: WS server, in-memory `price`, one AMM function `applyTrade(side, qty)` →
  new price (start with linear/log price impact; tune later).
- On `{type:'trade', side, qty}` → update price → broadcast `{price}` to all sockets.
- `public/index.html`: connect WS, BUY/SELL buttons, draw price as a live line on `<canvas>`.
- **Done when:** open 2 tabs, click BUY in one, price jumps in both instantly.

### M2 — "it's a game"
Goal: money, positions, and a reason to compete.
- Add `Ledger` (balances) + `Position` per connection; new users get $1,000.
- Reject trades that overdraw (server-side check before applying).
- Broadcast a **leaderboard** (realized + unrealized P&L) in the snapshot.
- Client: optimistic UI (move on click, reconcile on snapshot); interpolate the price line.
- Tune the price-impact curve until it *feels* fun (twitchy enough to be exciting, damped enough
  to not be nonsense).
- **Done when:** trading changes your balance/rank live and the curve feels good.

### M2.5 — "the books balance" *(the payments/fintech flex)*
Goal: settlement done to real-payments standard.
- Refactor settlement into **double-entry** postings over a house/user/fee account set.
- Assert `sum(balances) === constant` after every transaction (throw on drift).
- Add **idempotency keys** to orders; dedupe replays.
- Wire the **append-only event log**; make the engine replay it on boot → crash recovery.
- **Done when:** kill and restart the server → state restored from the log; invariant never trips.

### M3 — "the crowd"
Goal: survive many people and abuse.
- Batched **snapshot broadcaster** at a fixed tick (30–50ms), delta vs last snapshot.
- **Backpressure:** per-socket, keep only the newest pending snapshot; drop stale.
- **Rate limit** per connection (token bucket, N orders/sec).
- Anonymous identity: name + **HMAC-signed session cookie** (no passwords).
- Live chat / reactions (this is where pump-and-dump coordination gets funny).
- Load test: simulate ~2k bot connections; capture the numbers (that graph is an X post).
- **Done when:** 2k simulated clients trade without the server melting.

### M4 — "the living economy" *(the centerpiece)*
Goal: evolutionary agents that make the market alive and dramatic.
- Agent = **parameterized strategy** (momentum / mean-reversion / market-maker / contrarian /
  noise), numeric params, submits orders through the same path as humans.
- **Fitness** = P&L over a rolling window. Rank the population.
- **Evolution:** bottom performers *die*; top performers *reproduce* with mutation + crossover.
  New agents spawn to keep population constant.
- Cosmetic layer only: name + avatar (+ optional flavor banter in chat — never touches decisions).
- **Done when:** with zero humans, the market runs 24/7, agents visibly rise/die, and a human can
  join and compete.

### Phase 2 (only if earned)
- Limit **order book** (price-time priority) layered on the AMM — the deeper quant flex.
- Periodic **IPO auction** dropping a new meme asset (the original auction engine, reborn).
- Stripe **test-mode** cosmetic top-up (webhooks + signature verify + reconciliation) — build only
  if actively targeting payments companies.

## Two-audience framing

Same code, two front doors:
- **Playful landing page** → for X / sharing (chaos, memes, "beat the bots").
- **`DESIGN.md` + an "Engineering" section** → for recruiters (matching engine, deterministic
  replay, double-entry ledger, backpressure, evolutionary agents).

## Skills each phase demonstrates

| Phase | Skill signal | Best for |
|---|---|---|
| M1–M2 | real-time WS state, price-impact model, optimistic UI | generalist / frontend-infra |
| M2.5 | double-entry ledger, idempotency, event sourcing, recovery | **fintech / payments** |
| M3 | low-latency fan-out, backpressure, rate-limiting, load test | **infra / trading systems** |
| M4 | agent-based market sim, genetic algorithms, fitness/evolution | **quant / hedge funds** |
