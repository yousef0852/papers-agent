# AI Mind — Deploy & Validation Runbook

Goal: get the working loop onto a **public URL** so you can put it in front of strangers, with analytics and a willingness-to-pay signal wired in. This is the "validation-ready" checklist from the Phase 1 sprint.

Topology: **Vercel (web)** → **Railway/Render (API)** → **Neon (Postgres)** → **Anthropic**.

---

## 0. Prerequisites (free tiers are fine)

- [ ] [Neon](https://neon.tech) account (Postgres) — you likely already have this
- [ ] [Anthropic](https://console.anthropic.com) API key
- [ ] [Vercel](https://vercel.com) account (web hosting)
- [ ] [Railway](https://railway.app) **or** [Render](https://render.com) account (API hosting)
- [ ] [PostHog](https://posthog.com) account (analytics) — optional but strongly recommended for validation

---

## 1. Database (Neon)

1. Create a Neon project; copy the connection string (`postgresql://…`).
2. You'll use this as `DATABASE_URL` for both local dev and the deployed API.

---

## 2. API (FastAPI) — Railway or Render

The API lives in `apps/api`. It needs Python 3.14 (see `.python-version`) and `uv`.

**Environment variables to set on the host:**

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon connection string |
| `ANTHROPIC_API_KEY` | your Anthropic key |
| `ALLOW_ORIGINS` | `https://<your-vercel-domain>` (comma-separated; add localhost too while testing) |

**Start command:**

```bash
uv run uvicorn main:app --host 0.0.0.0 --port $PORT
```

**One-time DB setup** (run against the Neon DB before/at first deploy):

```bash
cd apps/api
uv run alembic upgrade head    # creates notebook + waitlist tables
uv run python seed_db.py       # loads the 10 seed papers
```

> Tip on Railway/Render: run the two setup commands once from a local shell pointed at the production `DATABASE_URL`, or add them as a release/pre-deploy command.

Verify: open `https://<your-api-domain>/health` → should return `{"status":"ok"}`.

---

## 3. Web (Next.js) — Vercel

The web app lives in `apps/web`.

1. Import the repo into Vercel; set **Root Directory** to `apps/web`.
2. Set environment variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<your-api-domain>` |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key (or leave unset to disable analytics) |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` (or your region) |

3. Deploy. Visit the Vercel URL → landing page at `/`, notebook at `/app`.
4. Go back to the API host and make sure `ALLOW_ORIGINS` includes the exact Vercel domain, then redeploy the API.

---

## 4. Verify the validation instrumentation

Once live, confirm each signal fires:

- [ ] **Open `/app`** → PostHog receives `notebook_opened`
- [ ] **Send a tutor message** → `tutor_message_sent` (with `turn` number)
- [ ] **Tutor adds a node** → `node_added`
- [ ] **Click Export in the header** → a JSON file downloads + `graph_exported`
- [ ] **Submit email on the landing "Founding members" section** → `founding_member_clicked` then `waitlist_joined`, and a row lands in the `waitlist` table

**Read your willingness-to-pay signal** (the fake-door results):

```sql
select source, count(*) from waitlist group by source;
select email, source, created_at from waitlist order by created_at desc;
```

---

## 5. The metrics that matter (set these up in PostHog)

| Metric | How |
|---|---|
| **Activation** | Funnel: `notebook_opened` → `tutor_message_sent` → `node_added` |
| **The aha-return (north star)** | Retention report on `notebook_opened` (or `tutor_message_sent`), 7-day window. Target: ≥25% return within a week |
| **Engagement depth** | Avg `node_added` count per user |
| **Willingness to pay** | `founding_member_clicked` / unique landing visitors |

Pair this with the **Sean Ellis PMF survey** (“How would you feel if you could no longer use AI Mind?”) after ~2 weeks of usage. ≥40% “very disappointed” = green light to decide a funding path.

---

## Notes

- Analytics no-ops cleanly when `NEXT_PUBLIC_POSTHOG_KEY` is unset — safe to ship without it, but you lose the validation signal.
- The waitlist endpoint takes no payment; it only stores emails. Wiring real Stripe billing is a later phase — don't build it during validation.
