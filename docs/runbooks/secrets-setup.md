# Secrets & Environment Setup

Operational runbook for setting up the **1Password vault** that is the system of record for every credential in this project (per [ADR-007](../dev/MASTER-bec-architecture-decisions.md#adr-007--secrets-management-vercel-env-vars--1password-as-system-of-record)), and the mapping from each credential to its corresponding `.env` variable (validated by the Zod schema in `packages/config/src/env.ts`, per [ADR-038](../dev/MASTER-bec-architecture-decisions.md#adr-038--per-environment-configuration-local-preview-production)).

This is a **living document**. When a new credential is added, update both this file and `.env.example`.

---

## 1. Why 1Password

ADR-007 selected 1Password as the system of record because:

- Single dashboard for every credential across Vercel, Cloudflare, Neon, Resend, AWS, Anthropic, PostHog, Sentry, Axiom, Backblaze, Upstash, and Cloudflare Turnstile.
- Rotation reminders per item (default 90 days; 30 days for webhook-signing secrets).
- 1Password CLI (`op`) integrates cleanly with both Vercel's `env pull` flow (for Vercel-hosted apps) and with local development on the operator's Mac (for the agent runtime per ADR-004).
- Per-environment scoping is preserved — every item documents which environments use it (development / preview / production).

Real values **never** live in this repo, in a Slack thread, in a personal `.env`, or in a screenshot. They live in 1Password and are pulled on demand.

---

## 2. Account + Vault Setup (one-time, ~10 min)

### 2.1. 1Password account

If you don't already have one:

1. Sign up for a 1Password **Individual** or **Families** account at <https://1password.com/sign-up>. Either tier supports CLI access. (Business plan is required only if you later add multiple operators.)
2. Set a strong master password and store the Emergency Kit somewhere offline.

### 2.2. Create the project vault

In the 1Password desktop app or web UI:

1. **Sidebar → Vaults → New Vault.**
2. **Name:** `BEC-Production`.
3. **Description:** `bestemeraldcoast-agency — system of record for every credential. See docs/runbooks/secrets-setup.md.`
4. **Icon:** any.
5. **Access:** keep it owner-only for now. (When a future contractor onboards, share specific items rather than the whole vault.)

Confirm the vault exists by running:

```bash
op vault list
# Expected: BEC-Production appears in the list.
```

### 2.3. Install the 1Password CLI

On macOS (the operator runtime per ADR-004):

```bash
brew install --cask 1password-cli
```

Verify:

```bash
op --version
# Expected: 2.x or newer
```

### 2.4. Sign in to the CLI

The first time:

```bash
op account add --address my.1password.com --email <your-email>
# Follow the prompts; paste your Secret Key when asked.
```

After that, an interactive shell session (with biometric unlock if you've enabled the desktop app integration):

```bash
eval $(op signin)
```

Add the eval line (or `op signin --account my`) to your shell profile so every new terminal starts with `op` ready to use.

Test access:

```bash
op vault list   # should include BEC-Production
op item list --vault BEC-Production   # initially empty
```

---

## 3. Item Template

Every credential in the vault uses the same item structure so everything is uniformly searchable:

| Field | Type | Example | Notes |
|---|---|---|---|
| Title | string | `Anthropic API key — bec-prod` | `<service> <kind> — <env>`. Always include the env to avoid mixing prod and dev. |
| Category | password / API Credential | API Credential | Use 1Password's built-in "API Credential" template where it fits. |
| **`value`** | concealed | `sk-ant-…` | The actual secret. |
| **`vendor_url`** | URL | `https://console.anthropic.com/settings/keys` | Where you generated this; needed for rotation. |
| **`rotation_due`** | date | `2026-08-10` | 90 days from creation, or 30 days for webhook-signing secrets per ADR-007. |
| **`env_used`** | string | `development, preview, production` | Comma-separated list of environments. |
| **`env_var`** | string | `ANTHROPIC_API_KEY` | The `.env` variable name from `packages/config/src/env.ts`. Lets you find an item by `env_var` quickly. |
| **`adr`** | string | `ADR-018` | Which ADR mandates this credential. |
| Notes | string | "Daily cap $5, monthly cap $100 (ADR-018)." | Anything else worth remembering. |

The custom fields (`vendor_url`, `rotation_due`, `env_used`, `env_var`, `adr`) are added per item via the **Add new field** menu. Once you've created one item, copy it as a template for the rest.

---

## 4. Credentials to Provision

The order below mirrors the deferral markers in `docs/dev/status/next-step.md` — provision each block **before** the commit that needs it. Required-now-for-Commit-0.4 is at the top. The Zod schema in `packages/config/src/env.ts` validates these names; the `.env.example` at the repo root mirrors them with inline comments.

### 4.1. Need before Commit 0.4 (Logger + Sentry)

| `.env` var | Service | Where to generate | 1Password item title | ADR |
|---|---|---|---|---|
| `SENTRY_DSN` | [Sentry](https://sentry.io) | Projects → New: create 3 projects: `bec-editorial`, `bec-ops-console`, `bec-newsletter-public`. Each project → Settings → Client Keys (DSN) → **DSN** field. | `Sentry DSN — bec-editorial` (and equivalents for the other two) | ADR-012 |
| `SENTRY_AUTH_TOKEN` | Sentry | Settings → Account → User Auth Tokens → New Token. Scopes: `project:read`, `project:releases`, `org:read`. | `Sentry auth token — bec-prod` | ADR-012 |
| `AXIOM_TOKEN` | [Axiom](https://axiom.co) | Settings → API Tokens → Create. Permissions: ingest + query on your dataset. | `Axiom API token — bec-prod` | ADR-012 |
| `AXIOM_DATASET` | Axiom | Datasets → Create dataset (suggested name: `bec-logs`). Use the dataset **name** string. | `Axiom dataset — bec-logs` (or store as a note on the API token item) | ADR-012 |

For local dev, the schema only requires `DATABASE_URL` — the four observability vars are optional in dev and become required in production. So you can populate Sentry/Axiom now and the dev `pnpm dev` will still pass.

### 4.2. Need before Commit 0.6 (CI baseline)

| `.env` var | Service | Where to generate | 1Password item title | ADR |
|---|---|---|---|---|
| `DATABASE_URL` | [Neon](https://neon.tech) via [Vercel Marketplace](https://vercel.com/marketplace/neon) | Vercel project → Storage tab → Add Neon → use the pooled connection URL. | `Neon DATABASE_URL — bec-prod` | ADR-002 |
| `DATABASE_URL_UNPOOLED` | Neon | Same Neon dashboard, direct connection URL (no `?pgbouncer=true`). For migrations. | `Neon DATABASE_URL_UNPOOLED — bec-prod` | ADR-002 |

Vercel Pro account itself is a separate prereq (for Turborepo Remote Cache) — no env var, just an account upgrade.

### 4.3. Need before Phase 1 (DB, ops console, Scout)

| `.env` var | Service | Where to generate / value | 1Password item title | ADR |
|---|---|---|---|---|
| `ANTHROPIC_API_KEY` | [Anthropic Console](https://console.anthropic.com/settings/keys) | API keys → Create. **Set a monthly budget cap of $570** in the org's billing settings before generating (ADR-018). Must start with `sk-ant-`. | `Anthropic API key — bec-prod` | ADR-018 |
| `AGENT_API_KEY` | You generate it | Run `openssl rand -hex 32` on the Mac and use the hex string. | `Agent API key — bec-prod` | ADR-003 |
| `NEXTAUTH_SECRET` | You generate it | Run `openssl rand -hex 32`. Must be ≥ 32 chars (schema-enforced). | `NextAuth secret — bec-prod` | Phase 1 |
| `NEXTAUTH_URL` | You set | `https://ops.bestemeraldcoast.com` in production; `http://localhost:3001` locally. | `NextAuth URL — bec-prod` | Phase 1 |
| `GOOGLE_MAPS_API_KEY` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) | Enable APIs: Places API + Geocoding API + Maps JavaScript API. Create an API key, then restrict it (HTTP referrers for browser use; or IP address for server-only). | `Google Maps API key — bec-prod` | Phase 1 |

Plus: **Cloudflare DNS** for the 8 domains (no env var; DNS records only, per ADR-008).

### 4.4. Need before Phase 2 (Outreach + Editorial Foundation)

| `.env` var | Service | Where to generate | 1Password item title | ADR |
|---|---|---|---|---|
| `RESEND_API_KEY` | [Resend](https://resend.com/api-keys) | Verify the sending domain `mail.bestemeraldcoast.com` first (Domains → Add Domain; place the DKIM/SPF/DMARC records in Cloudflare DNS). Then API Keys → Create. Must start with `re_`. | `Resend API key — bec-prod` | ADR-013 |
| `UPSTASH_REDIS_REST_URL` | [Upstash](https://console.upstash.com) | Redis → Create database (free tier). Use the **REST URL** field. | `Upstash Redis REST URL — bec-prod` | ADR-017 |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash | Same Redis database → **REST Token** field. | `Upstash Redis REST token — bec-prod` | ADR-017 |
| `TURNSTILE_SECRET_KEY` | [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile) | Turnstile → Add site (one site key covers all 8 domains). Use the **Secret key** (server). | `Cloudflare Turnstile secret — bec-prod` | ADR-017 |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile | Same Turnstile site → **Site key** (public). | `Cloudflare Turnstile site key — bec-prod` (or store in the same item) | ADR-017 |
| `POSTHOG_API_KEY` (server) | [PostHog](https://us.posthog.com) | Project → Settings → Project API Keys → use the **Personal API key** if you'll do server-side capture. | `PostHog server API key — bec-prod` | ADR-011 |
| `NEXT_PUBLIC_POSTHOG_KEY` (client) | PostHog | Same project → **Project API key** (the public one starting with `phc_`). | `PostHog client API key — bec-prod` | ADR-011 |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog | Usually `https://us.i.posthog.com` (US region per ADR-011). | (literal, no item) | ADR-011 |
| `BLOB_READ_WRITE_TOKEN` | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) | Project → Storage → Connect Blob → Vercel auto-generates the token; visible in the project's Environment Variables. | `Vercel Blob read-write token — bec-prod` | ADR-005 |

### 4.5. Need before Phase 3 (Newsletter)

| `.env` var | Service | Where to generate | 1Password item title | ADR |
|---|---|---|---|---|
| `AWS_ACCESS_KEY_ID` | [AWS IAM](https://us-east-1.console.aws.amazon.com/iam/home) | Create an IAM user `bec-ses-sender` with the `AmazonSESFullAccess` managed policy (or scope down to `ses:SendEmail`, `ses:SendRawEmail` on the verified domain). Generate access keys for the user. | `AWS IAM access key id — bec-ses-sender` | ADR-013 |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM | Same IAM user → secret access key. | `AWS IAM secret access key — bec-ses-sender` | ADR-013 |
| `AWS_REGION` | AWS | The region where SES is configured (default `us-east-1`). | (literal, no item) | ADR-013 |
| **SES sandbox exit request** | [AWS Support Center](https://us-east-1.console.aws.amazon.com/support/home) | Service quota increase → SES → "Move out of sandbox". **Submit ASAP** — 24-48h+ AWS turnaround. | Track the case # as a note on the IAM item. | ADR-013 |

### 4.6. Need before Phase 4 (Asset generation)

| `.env` var | Service | Where to generate | 1Password item title | ADR |
|---|---|---|---|---|
| `B2_KEY_ID` | [Backblaze B2](https://secure.backblaze.com/app_keys.htm) | Application Keys → Add a New Application Key. Restrict to your bucket. | `Backblaze B2 key id — bec-prod` | ADR-005 |
| `B2_APPLICATION_KEY` | Backblaze B2 | Same key creation flow — the secret part. | `Backblaze B2 application key — bec-prod` | ADR-005 |
| `B2_BUCKET` | Backblaze B2 | Buckets → Create Bucket (private, lifecycle rules per ADR-006). Use the bucket name. | `Backblaze B2 bucket — bec-prod` | ADR-005 |
| `B2_ENDPOINT` | Backblaze B2 | S3-compatible endpoint URL for your region (shown in the bucket details, e.g. `https://s3.us-west-002.backblazeb2.com`). | (note on bucket item) | ADR-005 |

### 4.7. Need before Phase 6 (Growth engine / cron)

| `.env` var | Where to generate | 1Password item title | ADR |
|---|---|---|---|
| `CRON_SECRET` | Run `openssl rand -hex 32`. Vercel cron handlers verify `Authorization: Bearer ${CRON_SECRET}`. | `Vercel cron secret — bec-prod` | Phase 6 |

### 4.8. Safety rails — set manually in `.env` (no procurement)

| `.env` var | Default | When to flip |
|---|---|---|
| `PROD_DB_ALLOWED` | `false` | Set to `true` *only* when you're intentionally running a local migration against the prod Neon branch. (`assertProdDbAccessible()` checks this — ADR-038.) |
| `EMAIL_REAL_SEND_ENABLED` | `false` | Set to `true` *only* when you want a non-prod environment to send real email (rare — usually for sender-reputation warmup). (`shouldSendRealEmail()` checks this — ADR-038.) |

---

## 5. Local `.env` Integration

Once items exist in `BEC-Production`, you have three options for getting the values into your local `.env` file. Pick whichever fits your workflow.

### 5.1. Manual copy (simplest, fine for one-off)

1. Open the 1Password desktop app.
2. For each item, click the `value` field's "copy" button.
3. Paste into the matching variable in `.env`.

`.env` is gitignored (verified by the smoke test in Commit 0.1.7), so the file stays local.

### 5.2. `op inject` (recommended for repeatable setup)

Use a `.env.tpl` template that references 1Password items via `op://` URIs and let `op inject` materialize them into `.env`:

```bash
# One-time: create the template (keep .env.example as a separate, no-secrets doc)
cp .env.example .env.tpl
# Then edit .env.tpl to replace each placeholder with an op:// reference:
#   ANTHROPIC_API_KEY=op://BEC-Production/Anthropic API key — bec-prod/value
#   SENTRY_DSN=op://BEC-Production/Sentry DSN — bec-editorial/value
#   ... and so on.

# Materialize .env from .env.tpl + 1Password (re-run any time):
op inject -i .env.tpl -o .env --force
```

Add `.env.tpl` to `.gitignore` (the existing `.env*` rule already covers this — verify with `git check-ignore .env.tpl`).

### 5.3. `op run` (no secrets on disk — most secure)

Wrap each `pnpm` invocation in `op run`:

```bash
op run --env-file=.env.tpl -- pnpm dev
op run --env-file=.env.tpl -- pnpm turbo build
# ...
```

`op run` injects secrets into the child process's env vars at runtime and leaves no plaintext on disk. Trade-off: every command must be wrapped, and Next.js `next dev`'s hot-reload may need extra config to pick up env changes.

For Phase 0 the team is one operator, so **option 5.2 (`op inject`) is the recommended default**. Revisit when more operators or contractors join.

---

## 6. Rotation Policy

ADR-007 specifies:

- **Default rotation cadence:** every 90 days for each credential. Update the `rotation_due` field on each 1Password item.
- **Webhook-signing secrets** (Resend, Twilio, Cloudflare Turnstile callbacks, future Vercel cron): every 30 days.
- **Document each rotation** in `docs/runbooks/secret-rotations.md` (this file will be created when the first rotation actually happens — Phase 1+).

Set a recurring calendar event on the operator's calendar for "BEC secret rotation review" every Monday at 9am — 10-min triage of items where `rotation_due` is within 14 days. Don't batch rotations; do them as they come due.

---

## 7. Onboarding a Future Contractor (forward-looking)

Not needed for v1 (single-operator project), but documented for later:

1. Add the contractor to the 1Password Business plan (upgrade from Individual when this happens).
2. Create a sub-vault `BEC-Contractor-<name>` and share only the items they need.
3. Set a sharing-expiration date on the share.
4. Revoke sharing on contractor offboarding; rotate every credential the contractor had access to within 24h of offboarding.

---

## 8. Cross-References

- [ADR-007 — Secrets management: Vercel env vars + 1Password as system of record](../dev/MASTER-bec-architecture-decisions.md#adr-007--secrets-management-vercel-env-vars--1password-as-system-of-record)
- [ADR-038 — Per-environment configuration](../dev/MASTER-bec-architecture-decisions.md#adr-038--per-environment-configuration-local-preview-production)
- [`.env.example`](../../.env.example) — canonical list of every variable, mirrored by the Zod schema.
- [`packages/config/src/env.ts`](../../packages/config/src/env.ts) — the schema itself; boot fails loudly when a required var is missing.
- [`docs/dev/status/next-step.md`](../dev/status/next-step.md) § Operator Pre-Flight — operator's current checklist.
