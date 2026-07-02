# NCL AI Assistant Prototype

Dual-bot prototype for Norwegian Cruise Lines: **HR Hub** + **Compliance Auditor**.

## Stack

- Next.js 15 + TypeScript + Tailwind
- OpenAI GPT-4o-mini + text-embedding-3-small
- PostgreSQL (embeddings as JSONB — works on standard Railway Postgres)

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

### Option A: Standard Railway PostgreSQL (recommended)

Works out of the box — no pgvector extension required. Embeddings are stored as JSONB and similarity search runs in the app.

1. Create Railway project → deploy from GitHub (`ai-assistant-cruise`)
2. Add **PostgreSQL** database
3. In the app service Variables:
   - `OPENAI_API_KEY` = your OpenAI key
   - `DATABASE_URL` = reference from Postgres service
   - `NODE_ENV` = `production`
4. Generate public domain (Settings → Networking)
5. Redeploy — `releaseCommand` in `railway.toml` runs migrate + seed automatically

Verify: `https://your-domain/api/health` should return `"status": "ok"`, `hrDocs: 4`, `complianceDocs: 3`.

### RAG Lab (standalone sandbox)

Direct URL: **`/rag-lab`** — generic English UI for testing RAG without company branding.

- Upload any PDF/MD/TXT into an isolated sandbox knowledge base
- Adjustable **Top K** and **Min similarity** (lower = fuzzier semantic search)
- Answers with citations only for sources actually used in the response

### Option B: Railway pgvector template (optional, for scale)

If you need native vector indexes at larger scale, use Railway's [pgvector template](https://railway.com/deploy/pgvector-latest) instead of standard Postgres. The app also works with pgvector — migrate will store embeddings as JSONB regardless.

## Production Roadmap (not in prototype)

- Microsoft Teams / Copilot 365 publishing
- SAP SuccessFactors OData integration
- SharePoint KB sync
- Entra ID SSO
- Scheduled daily RSS scan (cron)
