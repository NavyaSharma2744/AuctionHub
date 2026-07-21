# AuctionHub — Roadmap

**What we are building:** a live, multiplayer, play-money trading floor.
Open the page → pick a name → get $1,000 of fake money → trade a handful of
fictional assets against everyone else online. Prices move because of real
buying and selling. A leaderboard shows who's winning. Random "news events"
shake the market. New assets launch through short live auctions. Later, AI
agents with personalities join the floor — they compete, go broke, die, and
evolve.

It is a **game**, not a finance product: no real money, ever.

**Who this document is for:** a complete beginner. Each phase is small, ends
with something you can see working, and teaches one new idea. Do them in
order. Don't start a phase until the previous one's "Done when" is true.

---

## The finalized stack (what we use and why)

| Piece | Choice | Why |
|---|---|---|
| Language | JavaScipt everywhere r| one language for frontend AND backend — half the learning cost |
| Frontend | React + Vite | how modern UIs are built; Vite runs it during development |
| Price chart | `lightweight-charts` library | professional-looking trading chart in a few lines |
| Backend | Node.js + Express | runs JavaScript on the server; Express handles web requests simply |
| Real-time | `ws` (WebSockets) | a phone line that stays open between browser and server — this is the low-latency part |
| Database | none at first → SQLite later | start with everything in the server's memory; add a real DB when we feel the pain of losing data on restart |
| Deploy | one small cloud box (later) | so the project has a real URL to share |

**The one rule of the whole system:** the server is the boss. Browsers only
*ask* ("I want to buy 5 WOOF"); the server decides, updates the truth, and
tells everyone. A browser is never trusted about prices or balances.

## The world (game design, kept small)

- **4 fictional assets** in 3 classes — e.g. `WOOF` (meme), `NIMBUS` (tech),
  `BREW` (commodity), `GOLDX` (safe haven). Names/lore can change; count stays small.
- Every player starts with **$1,000**. Net worth = cash + value of holdings.
- Prices move from **order flow** (buying pushes up, selling pushes down) plus a
  gentle random drift so the market never sits still.
- **Leaderboard** ranks everyone by net worth, live.
- **News events** ("NIMBUS servers on fire! 🔥") randomly shock a price — drama button.
- **IPO auctions**: occasionally a brand-new asset launches via a 60-second live
  auction — highest bidders get the first shares. (This is the "auction" in AuctionHub.)
- **Agents** (late phases): bots with personalities trade alongside humans. Broke
  agent = dead agent, forever. A new agent is born from the best performers with
  small mutations (a genetic algorithm — evolution, not magic).

---

## Phases

### Phase 0 — Tools on the table ✅ (mostly done)
Install and understand the tools: **Node.js** (runs JS outside a browser),
**VS Code** (editor), **git** (saves snapshots of your work), the **terminal**.
Scaffold the frontend with Vite.
**Done when:** `npm run dev` inside `frontend/` shows a page in the browser, and
you can say in one sentence what Node, npm, Vite, and git each do.

### Phase 1 — A market you can see (React basics, fake data)
Build the whole screen with **hardcoded** data: a list of the 4 assets with
prices, a portfolio panel ($1,000, no holdings), BUY/SELL buttons that update
numbers on screen (locally only, for now).
*Learn:* what a component is, props, state (`useState`), rendering lists,
handling clicks.
**Done when:** the page looks like a tiny trading floor and clicking BUY changes
the numbers — even though it's all pretend.

### Phase 2 — A backend exists (HTTP)
First Node + Express server. One endpoint: `GET /api/market` returns the assets
and prices as JSON. The frontend **fetches** it instead of hardcoding.
*Learn:* what a server is, ports, HTTP request/response, JSON, fetch,
frontend and backend as two separate running programs.
**Done when:** you change a price in the server code, refresh the browser, and
the new price appears.

### Phase 3 — It's alive (WebSockets)
Add WebSockets. The server "ticks" every second: nudges prices with a small
random walk and pushes the new state to **every connected browser**. Open two
windows — both move together. The chart library comes in here.
*Learn:* HTTP vs WebSocket, broadcasting, why polling is worse, drawing live data.
**Done when:** two side-by-side browser windows show the same prices moving in
lockstep, with a live chart.

### Phase 4 — Real trading (the heart)
Players join with a name and get $1,000 **on the server**. BUY/SELL buttons now
send intents over the WebSocket. The server checks the money is there, executes,
moves the price by the trade's impact, and broadcasts. Portfolios are real now.
*Learn:* server-authoritative state, validation ("never trust the client"),
sessions, the trade → price-impact → broadcast loop.
**Done when:** two windows trade against each other: one buys, the price jumps
for both, balances change correctly, and you cannot spend money you don't have.

### Phase 5 — Make it a game
Leaderboard (live net-worth ranking), profit/loss coloring, trade feed
("Rhea bought 10 WOOF"), news events that shock prices, sounds/polish.
*Learn:* deriving displayed data from raw state, designing for fun, UI polish.
**Done when:** a friend plays it for 10 minutes without you explaining anything —
and wants to beat you.

### Phase 6 — Memory that survives (database)
Restarting the server currently wipes the world. Add **SQLite**: accounts,
holdings, and trade history stored on disk; reload them on startup.
*Learn:* what a database is, tables, primary keys, INSERT/SELECT, and why
in-memory + database differ.
**Done when:** kill the server, restart it, and everyone's money and holdings
are exactly as before.

### Phase 7 — The auction
A scheduled event: "NEW ASSET IPO in 30s!" A 60-second live auction sells the
first shares of a brand-new asset to the highest bidders, then it trades
normally like the others.
*Learn:* timed server events, auction rules (English auction), state machines.
**Done when:** an IPO runs start-to-finish with two human bidders and the new
asset appears on the board.

### Phase 8 — Enter the bots
Agents join through the **same WebSocket door as humans** (no cheating, no
special access). Each has a personality = a simple strategy with knobs:
momentum chaser, value hunter, market maker, contrarian, pure chaos. Give them
names and avatars; they show on the leaderboard.
*Learn:* strategies as small functions, randomness with intent, simulation.
**Done when:** with zero humans online, the market still moves, and the
leaderboard is a battle of bot personalities.

### Phase 9 — Death and evolution
Fitness = profit over a rolling window. An agent hitting $0 **dies** — removed
forever. The population replaces it by breeding the top performers: copy their
strategy knobs, mix them, add small mutations. Watch the population get better.
*Learn:* genetic algorithms for real (fitness, selection, crossover, mutation).
**Done when:** you can watch generations turn over — bad strategies visibly go
extinct while good ones spread.

### Phase 10 — Break it on purpose (security)
Now attack our own system: an agent that sends garbage messages, one that spams
1,000 orders/second, one that tries negative quantities or fake balances. Every
successful cheat becomes a fix: input validation, rate limiting, server-side
checks everywhere.
*Learn:* thinking like an attacker, validation, rate limits, why the server
being the boss (rule #1) is a *security* property.
**Done when:** the attack agents run at full blast and the market stays correct —
money is conserved, no cheat works.

### Phase 11 — Ship it
Deploy to a real URL. Frontend built to static files, server on a small cloud
box, both live. Write the README that shows it off (screenshots, a GIF, how it
works inside).
**Done when:** someone on another network plays it from a link — and a recruiter
scrolling the README understands what was built in 30 seconds.

---

## Possible extensions (after Phase 11 — the "wow" shelf)
- Agent chat banter on the floor (cosmetic personality, never affects trades)
- Local LLM-driven agent personalities (Ollama) — flavor on top of strategies
- Seasons: weekly reset with a hall of fame
- Spectator mode: watch the bot economy like an aquarium
- A "market crash" klaxon and circuit breakers

Rules of the road: never trust the client · money is only ever moved by the
server · every phase must end demoable · when in doubt, keep it smaller.
