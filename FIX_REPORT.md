# Fix Report — QA Blocker Pass

## Issues Fixed

### 1. openai / ts-node Dependencies
- Already present in `package.json` (`openai@^6.45.0`, `ts-node@^10.9.2`).
- No action required.

### 2. Parser Type Bug (Issue #3)
**Problem:** `birth_date` field used unsafe cast `new Date(...) as unknown as undefined`.  
**Fix:**
- Added `birth_date: string | null` and `nationality2: string | null` to `Player` interface (both exist as DB columns but were missing from TypeScript).
- Changed cast to `new Date(p.birthDate).toISOString().split("T")[0]` — returns a proper ISO date string.

### 3. .env.local.example (Issue #4)
Created `.env.local.example` with all required variables and inline comments.

### 4. Missing Routes (Issue #5)
Created:
- `app/career/[id]/scouting/page.tsx` — player search with filters, potential rating column, shortlist toggle
- `app/career/[id]/tactics/page.tsx` — formation selector, player roles per position, AI tactical report button
- `app/settings/page.tsx` — tabbed settings: Profile, AI Preferences, Notifications, Account controls

> Note: Sidebar links to `/career/[id]/scouting`, `/career/[id]/tactics`, and `/settings` — pages match these paths.

### 5. Missing Report Types (Issue #6)
Added to `services/ai/index.ts`:
- `generateDevelopmentReport` — growth plan, training focus, loan recommendations, timeline
- `generateScoutingReport` — hidden gems, shortlist, value assessment, tactical fit, risk

Added to `app/api/reports/route.ts`:
- `type === "development"` handler
- `type === "scouting"` handler (fetches under-21 targets automatically)

### 6. Storage RLS (Issue #7)
Uncommented the storage policy in `database/migrations/002_rls.sql` and added `WITH CHECK` clause so it enforces both read and write isolation per user.

### 7. Localhost Hardcoding (Issue #8)
`next.config.ts` now derives `allowedOrigins` from `NEXT_PUBLIC_APP_URL` env var with `localhost:3000` as development fallback.

### 8. Parser Environment (Issue #9)
Added combined check: if neither `PARSER_PATH` nor `PARSER_SERVICE_URL` is set, throws:
> "Parser not configured. Set PARSER_PATH or PARSER_SERVICE_URL in your environment."

### 9. Pre-existing TypeScript Errors (bonus)
Fixed implicit `any` types in `lib/supabase/server.ts` and `middleware.ts` (Supabase cookie callbacks).  
Fixed `batchInsertPlayers` supabase parameter type to avoid Supabase schema-inference conflicts.  
Added `@types/jest` and `"types": ["jest","node"]` to `tsconfig.json`.

---

## Files Changed

| File | Change |
|------|--------|
| `types/index.ts` | Added `birth_date`, `nationality2` to `Player` |
| `services/parser/index.ts` | Fixed `birth_date` cast; improved parser env error; fixed `batchInsertPlayers` signature |
| `services/ai/index.ts` | Added `generateDevelopmentReport`, `generateScoutingReport` |
| `app/api/reports/route.ts` | Added `development` and `scouting` report type handlers |
| `app/career/[id]/scouting/page.tsx` | **New** — scouting page |
| `app/career/[id]/tactics/page.tsx` | **New** — tactics page |
| `app/settings/page.tsx` | **New** — settings page |
| `database/migrations/002_rls.sql` | Enabled storage RLS policy |
| `next.config.ts` | Replaced `localhost:3000` with env-based URL |
| `lib/supabase/server.ts` | Fixed cookie callback types |
| `middleware.ts` | Fixed cookie callback types |
| `tsconfig.json` | Added `types: ["jest","node"]` |
| `.env.local.example` | **New** — environment variable reference |

---

## Verification Results

```
npm run typecheck  →  0 errors (excluding test file, handled by jest config)
npm test           →  16/16 tests passed
```

Routes verified to compile without TypeScript errors:
- `/career/[id]/scouting` ✓
- `/career/[id]/tactics` ✓
- `/settings` ✓

AI report types verified in route handler:
- `development` ✓
- `scouting` ✓
