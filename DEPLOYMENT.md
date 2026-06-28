# DEPLOYMENT GUIDE — AI Sporting Director

Complete production deployment guide for Vercel + Supabase + Railway.

---

## Prerequisites

- Node.js 20+
- Python 3.12+ (for parser microservice)
- Supabase account (free tier works)
- Vercel account
- Railway account (for parser microservice)
- AI provider API key (Together AI / Groq / OpenRouter)

---

## Step 1 — Supabase Setup

### 1.1 Create Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a region close to your users
3. Note your **Project URL** and **API keys** (Settings → API)

### 1.2 Run Migrations

In the Supabase SQL editor, run each migration in order:

```sql
-- 1. Run 001_initial.sql
-- 2. Run 002_rls.sql
```

### 1.3 Create Storage Bucket

1. Supabase Dashboard → Storage → New Bucket
2. Name: `career-saves`
3. Public: **OFF** (must be private)
4. File size limit: `209715200` (200MB)

### 1.4 Set Storage Policies

In Storage → `career-saves` → Policies, add these policies:

**INSERT (upload)**
```sql
(bucket_id = 'career-saves' and auth.uid()::text = (storage.foldername(name))[1])
```

**SELECT (read)**
```sql
(bucket_id = 'career-saves' and auth.uid()::text = (storage.foldername(name))[1])
```

**DELETE**
```sql
(bucket_id = 'career-saves' and auth.uid()::text = (storage.foldername(name))[1])
```

---

## Step 2 — Parser Microservice (Railway)

### 2.1 Get the parser

```bash
cd parser-service
git clone https://github.com/GioAc96/fc25-career-mode-save-editor
```

### 2.2 Deploy to Railway

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

Or via Railway dashboard:
1. New Project → Deploy from GitHub repo
2. Point to the `parser-service/` directory
3. Railway auto-detects the Dockerfile

### 2.3 Set Railway environment variables

```
PARSER_REPO_PATH=/app/fc25-career-mode-save-editor
PARSER_SERVICE_SECRET=your-random-32-char-secret
```

### 2.4 Note your parser URL

Railway will give you a URL like `https://parser-service.up.railway.app`.

---

## Step 3 — Vercel Deployment (Next.js)

### 3.1 Push to GitHub

```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

### 3.2 Import to Vercel

1. [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select your repository
3. Framework Preset: **Next.js**
4. Root Directory: `/` (project root)

### 3.3 Set Environment Variables in Vercel

In Project Settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL         = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY    = your-anon-key
SUPABASE_SERVICE_ROLE_KEY        = your-service-role-key
AI_API_KEY                       = your-ai-provider-key
AI_MODEL                         = meta-llama/Llama-3.3-70B-Instruct-Turbo
AI_BASE_URL                      = https://api.together.xyz/v1
PARSER_SERVICE_URL               = https://your-parser.up.railway.app
PARSER_SERVICE_SECRET            = your-random-32-char-secret
NEXT_PUBLIC_APP_URL              = https://your-app.vercel.app
```

### 3.4 Deploy

Click **Deploy**. Vercel builds and deploys automatically.

### 3.5 Verify deployment

```
https://your-app.vercel.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "services": {
    "api": "ok",
    "parser": "ok",
    "ai": "configured",
    "supabase": "configured"
  }
}
```

---

## Step 4 — Post-deployment checks

### ✅ Authentication
- [ ] Sign up with a new email
- [ ] Receive verification email (if enabled in Supabase Auth settings)
- [ ] Sign in successfully
- [ ] Redirected to dashboard

### ✅ Upload
- [ ] Upload a `.fifacareer` file
- [ ] See progress indicator
- [ ] Job polling works (status updates)

### ✅ Parser
- [ ] Parser microservice `/health` returns OK
- [ ] Upload triggers parse job
- [ ] Players appear in database after parsing

### ✅ AI
- [ ] Generate a Squad Analysis report
- [ ] Report contains squad rating, strengths, transfers
- [ ] Chat responds to questions

### ✅ Security
- [ ] User A cannot access User B's careers
- [ ] Unauthenticated requests return 401
- [ ] Files in storage are not publicly accessible

---

## Scaling Considerations

### Database
- Indexes are already optimised for 18k+ player queries
- If latency increases, consider Supabase connection pooling (PgBouncer)
- For very large deployments, add a read replica

### Parser
- Railway's hobby plan handles typical load
- Scale horizontally if many concurrent uploads
- Consider adding a proper job queue (BullMQ) for high volume

### AI
- Together AI / Groq have rate limits — implement queuing if needed
- Cache reports — only regenerate when career data changes
- Monitor token usage via AI provider dashboard

---

## Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (secret) |
| `AI_API_KEY` | ✅ | AI provider API key |
| `AI_MODEL` | ✅ | Model identifier |
| `AI_BASE_URL` | ✅ | OpenAI-compatible base URL |
| `PARSER_SERVICE_URL` | ✅ | Parser microservice URL |
| `PARSER_SERVICE_SECRET` | ✅ | Shared secret for parser auth |
| `NEXT_PUBLIC_APP_URL` | Optional | App URL for redirects |
