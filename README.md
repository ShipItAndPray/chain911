# chain911

**PagerDuty for crypto exploits.** Trusted alerts from verified researchers, instant broadcast to protocol teams, structured decision protocol, full audit trail.

**[Live App](https://chain911.vercel.app)** | **[GitHub Pages Demo](https://shipitandpray.github.io/chain911/)**

## What it does

When a crypto exploit happens, compliance tools take 2+ hours to flag it. Meanwhile, security researchers like ZachXBT and samczsun are coordinating on Telegram in real time.

chain911 bridges that gap:

1. **Verified reporters** submit alerts with evidence and on-chain addresses
2. **Auto-enrichment** pulls balance, transaction count, risk flags, and attribution
3. **Instant broadcast** to all subscribing protocol teams via Slack, Telegram, PagerDuty
4. **Decision protocol** — teams respond Acknowledge / Pause / Ignore, see what other teams decided
5. **Audit trail** — every alert, decision, and action is logged with timestamps

## Real data

Seeded with 11 real crypto exploits totaling $2.3B+ in losses:

- **Bybit** ($1.46B) — Lazarus Group social engineering
- **Cetus** ($230M) — Math overflow on Sui
- **WazirX** ($234.9M) — Multisig compromise (DPRK)
- **DMM Bitcoin** ($308M) — TraderTraitor key compromise
- **Drift Protocol** ($28.5M) — Oracle manipulation on Solana
- And 6 more with real attacker addresses from Etherscan

## Architecture

```
index.html + styles.css + app.js    Frontend (Vercel CDN)
api/*.js                            Backend (Vercel Serverless Functions)
Neon Postgres                       Database (Vercel Integration)
```

No frameworks. No build step. Three static files + six API routes.

## API

| Endpoint | Method | Description |
|---|---|---|
| `/api/alerts` | GET | List alerts with optional filters (?chain=ETH&severity=critical) |
| `/api/alerts` | POST | Submit a new alert |
| `/api/decisions` | GET/POST | Read or submit team decisions |
| `/api/reporters` | GET | List verified reporters with accuracy stats |
| `/api/audit` | GET | Searchable audit log |
| `/api/webhooks` | GET/PATCH | Manage webhook channels |
| `/api/seed` | POST | Seed database with real exploit data |

## Origin

Built in response to [this tweet](https://x.com/ol3gpetrov/status/2039469679635304943) by Oleg Petrov (SwapKit), who described how $100K+/year compliance tools are consistently slower than Telegram group chats during exploit response.

The product idea was refined through 5 iterations using autoresearch methodology, scoring against 6 binary evals. The winning insight: **the problem is not detection (humans are faster). It's coordination + audit trail.**

## Run locally

```sh
git clone https://github.com/ShipItAndPray/chain911
cd chain911
npm install
# Create .env.local with DATABASE_URL from your Neon Postgres
vercel env pull .env.local
open index.html
```
