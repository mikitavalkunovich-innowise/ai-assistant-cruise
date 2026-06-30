# NCL AI Assistant Prototype

Dual-bot prototype for Norwegian Cruise Lines: **HR Hub** + **Compliance Auditor**.

## Stack

- Next.js 15 + TypeScript + Tailwind
- OpenAI GPT-4o-mini + text-embedding-3-small
- PostgreSQL + pgvector (Railway)

## Local Setup

```bash
cp .env.example .env.local
# Set OPENAI_API_KEY and DATABASE_URL

npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000

## Demo Accounts

| Email | Role | Password |
|-------|------|----------|
| `officer@ncl.demo` | Compliance officer | `demo123` |
| `newhire@ncl.demo` | New hire (onboarding) | `demo123` |
| `employee@ncl.demo` | Employee | `demo123` |

## Demo Script for Customer

1. **Landing** — choose HR Hub or Compliance Auditor
2. **Compliance → Monitor** — click "Run Scan Now" for real RSS regulatory news with AI severity classification
3. **Compliance → Q&A** — ask "What are USPH galley inspection requirements?" — see citations
4. **Compliance → Training** — view overdue certifications, preview Teams notification
5. **HR Hub** — ask leave policy questions in any language; login as `newhire@ncl.demo` for onboarding checklist
6. **Admin → Upload** — add PDF to HR or Compliance knowledge base

## Railway Deploy

1. Create Railway project, add PostgreSQL plugin
2. Set env vars: `OPENAI_API_KEY`, `DATABASE_URL` (from Railway Postgres)
3. Deploy from GitHub
4. Run once: `railway run npm run db:migrate && railway run npm run db:seed`

## Production Roadmap (not in prototype)

- Microsoft Teams / Copilot 365 publishing
- SAP SuccessFactors OData integration
- SharePoint KB sync
- Entra ID SSO
- Scheduled daily RSS scan (cron)
