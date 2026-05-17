# ClinicDocs Cloudflare Backend

This is an alternate backend for ClinicDocs AI. It does not replace `backend/`.

It runs on Cloudflare Workers and uses:

- Cloudflare Workers AI for chat and embeddings.
- Supabase Auth for login and token validation.
- Supabase Storage for storing uploaded PDFs and serving public file URLs.
- Supabase REST/RPC for `documents`, `query_logs`, and vector search.
- `unpdf` for PDF text extraction in the Worker runtime.

## Setup

Install dependencies:

```bash
cd backend-cloudflare
npm install
```

Create a public Supabase Storage bucket for uploaded PDFs:

`pdfs` is the default bucket name used by this project. If you use a different bucket,
set `SUPABASE_STORAGE_BUCKET` in `wrangler.toml` or as a Worker variable.

Set Cloudflare Worker secrets:

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_KEY
```

Run the Supabase migration:

```text
backend-cloudflare/migrations/001_cloudflare_workers_ai.sql
```

This migration changes `documents.embedding` to `vector(768)`, because the default
Cloudflare embedding model returns 768 dimensions. It truncates existing document
vectors, so upload/reindex PDFs again after running it.

## Development

Workers AI requires a remote binding and Cloudflare credentials. Add these to
the root `.env` before running locally:

```env
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
```

The API token needs permission to run Workers AI and Workers scripts for your
Cloudflare account.

Run with Docker Compose from the repo root:

```bash
docker compose -f docker-compose.cloudflare.yml up --build
```

This starts:

- Cloudflare Worker backend: `http://localhost:8787`
- Frontend pointed at that backend: `http://localhost:5173`

Or run just the Worker directly. The Worker runs locally, while the `AI` binding
connects to Cloudflare remotely:

```bash
npm run dev
```

Use the printed local URL as the frontend API base:

```env
VITE_API_BASE_URL=http://localhost:8787
```

## Deploy

```bash
npm run deploy
```

Then set the frontend env var to the deployed Worker URL:

```env
VITE_API_BASE_URL=https://clinicdocs-backend-cloudflare.<your-subdomain>.workers.dev
```

Uploaded PDFs are stored in Supabase Storage and the Worker keeps the public route:

```text
https://clinicdocs-backend-cloudflare.<your-subdomain>.workers.dev/pdf/<filename>.pdf
```
