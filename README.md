# AI Sporting Director

Elite AI-powered football career management for EA Sports FC Career Mode.

---

## Stack

- **Next.js 14** + TypeScript + Tailwind CSS
- **Supabase** (PostgreSQL + Auth + Storage)
- **OpenAI-compatible AI** (Together AI, Groq, OpenRouter, etc.)
- **GioAc96 FC Parser** for save file extraction
- **Vercel** deployment

---

## Setup

### 1. Clone & install

```bash
git clone <your-repo>
cd ai-sporting-director
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations in the SQL editor:
   - `database/migrations/001_initial.sql`
   - `database/migrations/002_rls.sql`
3. Create a storage bucket named `career-saves` (set to private)
4. Add storage RLS policy (see comment in 002_rls.sql)

### 3. AI Provider Setup

Choose one OpenAI-compatible provider:

#### Groq Cloud (Recommended)
1. Get API key from [console.groq.com](https://console.groq.com)
2. Set env vars:
   ```
   AI_PROVIDER=groq
   AI_API_KEY=gsk_...
   AI_MODEL=llama-3.1-70b-versatile
   AI_BASE_URL=https://api.groq.com/openai/v1
   ```

#### Other providers
- **OpenAI**: Set `AI_BASE_URL=https://api.openai.com/v1`
- **Together AI**: Set `AI_BASE_URL=https://api.together.xyz/v1`
- **OpenRouter**: Set `AI_BASE_URL=https://openrouter.io/api/v1`

**Features**:
- Automatic retry with exponential backoff
- Error handling for missing keys, timeouts, rate limits
- Works with any OpenAI-compatible API

### 4. FC Career Mode Parser

```bash
cd ~/fc25-parser
npm run dev -- -p 3001
```

The parser microservice runs on port 3001. Set `PARSER_SERVICE_URL=http://localhost:3001` in `.env.local`.

### 5. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Provider (Groq recommended)
AI_PROVIDER=groq
AI_API_KEY=your-groq-api-key
AI_MODEL=llama-3.1-70b-versatile
AI_BASE_URL=https://api.groq.com/openai/v1

# Parser service
PARSER_SERVICE_URL=http://localhost:3001

STORAGE_BUCKET=career-saves
```

### 6. Run

Start in two terminals:

**Terminal 1 — Parser microservice:**
```bash
cd ~/fc25-parser
npm run dev -- -p 3001
```

**Terminal 2 — Main app:**
```bash
npm run dev
```

Open http://localhost:3002 (or next available port)

---

## User Flow

1. Sign up → Create a Career
2. Upload your `.sav` file from EA Sports FC
3. Parser extracts 18,000+ players in the background
4. Go to **Reports** → Generate Squad Analysis, Transfer Targets, Tactical Advice
5. Chat with your **AI Sporting Director** for real-time football intelligence

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

**Environment variables** (set in Vercel dashboard):
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
AI_PROVIDER=groq
AI_API_KEY=your-groq-key
AI_MODEL=llama-3.1-70b-versatile
AI_BASE_URL=https://api.groq.com/openai/v1
PARSER_SERVICE_URL=https://your-parser-service-url
```

**Parser deployment:**
Deploy the parser as a separate service:
- Clone `https://github.com/GioAc96/fc-cm-web-parser`
- Deploy to Railway, Fly.io, or similar
- Set `PARSER_SERVICE_URL` to the deployed URL

---

## Testing

```bash
npm test
```

---

## Architecture

```
User → Upload .sav → Supabase Storage
                   → Parser (microservice) → 18k players in DB

User → AI Chat → Context Builder (squad + filtered targets only)
              → AI API (with retry + error handling) → Response
              → DB (conversation history)
```

### AI Provider Error Handling

All AI requests include:
- **Automatic retry** with exponential backoff (max 3 retries)
- **Timeout handling** (60s default, configurable)
- **Error classification**:
  - Missing API key → Immediate failure
  - Invalid model → Immediate failure
  - Rate limit (429) → Retry with backoff
  - Timeout → Retry with backoff
  - Provider unavailable (502/503) → Retry with backoff

Errors are logged with full context for debugging.

### Security
- Row Level Security on all tables
- Users can only access their own careers/players/reports
- Service role key never exposed to client
- All API routes validate session via Supabase Auth
- AI API keys stored only server-side (not exposed to browser)

---

## Checklist

- [x] Authentication (signup/login)
- [x] Career creation + management
- [x] Save file upload with progress + status polling
- [x] Parser integration (GioAc96)
- [x] 18k+ player database with chunked insertion
- [x] Full-text search + filtered player table
- [x] AI squad analysis
- [x] AI transfer recommendations
- [x] AI tactical advice
- [x] AI chat with career context
- [x] Report viewer with markdown rendering
- [x] Row Level Security
- [x] Vercel deployment ready
