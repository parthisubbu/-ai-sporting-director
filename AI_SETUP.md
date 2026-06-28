# AI Integration Setup - Groq Cloud

## Overview

The AI Sporting Director now uses **Groq Cloud** with a robust provider abstraction layer that supports any OpenAI-compatible API (OpenAI, Together AI, OpenRouter, etc.).

## Key Features

### 1. Provider Abstraction (`services/ai/provider.ts`)
- Supports: OpenAI, Groq, Together AI, OpenRouter, custom providers
- Configuration via environment variables: `AI_PROVIDER`, `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`
- Dynamic model selection (not hardcoded)
- Comprehensive error classification

### 2. Error Handling & Retry Logic
All AI requests include:
- **Automatic retry** with exponential backoff (default: 3 retries)
- **Timeout protection** (default: 60 seconds)
- **Error classification**:
  - `MISSING_KEY`: API key not configured → immediate failure
  - `INVALID_MODEL`: Model unavailable → immediate failure
  - `RATE_LIMIT` (429): Too many requests → retry with backoff
  - `TIMEOUT`: Request took too long → retry with backoff
  - `PROVIDER_UNAVAILABLE` (502/503): Service down → retry with backoff
  - `UNKNOWN`: Unexpected error → retry with backoff

### 3. AI Services Updated
All AI functions now use retry logic:
- `generateSquadAnalysis()`
- `generateTransferTargets()`
- `chatWithDirector()`
- `generateTacticalAdvice()`
- `generateDevelopmentReport()`
- `generateScoutingReport()`

### 4. API Routes with Error Handling
- `/api/reports` - Generate Sporting Director reports (squad, transfer, tactical, etc.)
- `/api/chat` - Chat with AI coach with career context
- Both routes properly handle `AIProviderError` and return appropriate HTTP status codes

## Configuration

### Environment Variables

```env
# AI Provider
AI_PROVIDER=groq                              # groq, openai, together, openrouter, custom
AI_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx           # Your API key
AI_MODEL=llama-3.1-70b-versatile              # Model ID for the provider
AI_BASE_URL=https://api.groq.com/openai/v1   # Provider endpoint
```

### Provider Defaults

| Provider | Base URL |
|----------|----------|
| Groq | `https://api.groq.com/openai/v1` |
| OpenAI | `https://api.openai.com/v1` |
| Together AI | `https://api.together.xyz/v1` |
| OpenRouter | `https://openrouter.io/api/v1` |

### Groq Models

Available models for Groq:
- `llama-3.1-70b-versatile` (recommended)
- `mixtral-8x7b-32768`
- `gemma-7b-it`
- `llama-3.1-8b-instant` (fast, smaller)

See [Groq Console](https://console.groq.com/keys) for current models.

## Testing

### 1. Generate a Report
```bash
curl -X POST http://localhost:3002/api/reports \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "career_id": "your-career-id",
    "type": "squad"
  }'
```

### 2. Chat with Director
```bash
curl -X POST http://localhost:3002/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "career_id": "your-career-id",
    "message": "Who should I buy?",
    "history": []
  }'
```

### 3. Expected Success Response
```json
{
  "response": "Based on your Manchester United squad..."
}
```

### 4. Expected Error Responses

**Missing API Key:**
```json
{
  "error": "AI Provider Error: AI API key is invalid or missing",
  "code": "MISSING_KEY"
}
```
Status: 400

**Rate Limited:**
```json
{
  "error": "AI Provider Error: AI provider rate limit exceeded",
  "code": "RATE_LIMIT"
}
```
Status: 503 (retried 3 times before failing)

**Provider Unavailable:**
```json
{
  "error": "AI Provider Error: AI provider is currently unavailable",
  "code": "PROVIDER_UNAVAILABLE"
}
```
Status: 503 (retried 3 times before failing)

## Retry Logic Details

### Default Configuration
```typescript
{
  maxRetries: 3,
  initialDelayMs: 1000,          // Start with 1 second
  maxDelayMs: 30000,             // Cap at 30 seconds
  backoffMultiplier: 2,          // Double delay each retry
  timeout: 60000                 // 60 second request timeout
}
```

### Example Retry Schedule
1. Attempt 1: fails → wait 1s
2. Attempt 2: fails → wait 2s
3. Attempt 3: fails → wait 4s
4. Attempt 4: fails → return error

## Switching Providers

### To OpenAI:
```env
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_MODEL=gpt-4-turbo
AI_BASE_URL=https://api.openai.com/v1
```

### To Together AI:
```env
AI_PROVIDER=together
AI_API_KEY=...
AI_MODEL=meta-llama/Llama-3-70b-chat-hf
AI_BASE_URL=https://api.together.xyz/v1
```

## Debugging

### Enable Debug Logs
The system logs warnings when retrying:
```
AI request failed (attempt 1/4), retrying in 1000ms...
AI request failed (attempt 2/4), retrying in 2000ms...
```

### Check Environment
```bash
# Verify configuration is loaded
node -e "console.log({
  provider: process.env.AI_PROVIDER,
  model: process.env.AI_MODEL,
  hasKey: !!process.env.AI_API_KEY
})"
```

### Test Provider Connection
```typescript
import { createAIClient, validateConfig } from '@/services/ai/provider';

const client = createAIClient();
// If this succeeds, the configuration is correct
```

## Business Logic

No business logic has been changed. All AI service functions maintain the same interface and behavior. Only the provider implementation and error handling have been updated.

## Files Modified

- `services/ai/provider.ts` (NEW) - Provider abstraction layer
- `services/ai/index.ts` - Updated to use retry logic
- `app/api/reports/route.ts` - Added AI provider error handling
- `app/api/chat/route.ts` - Added AI provider error handling
- `.env.local` - Updated with Groq configuration
- `.env.local.example` - Documentation for all providers
- `README.md` - Updated setup and deployment docs

## Next Steps

1. ✅ AI provider abstraction with Groq support
2. ✅ Error handling and retry logic
3. ✅ API route error handling
4. 🔄 Test with real save files (when available)
5. 🔄 Optimize prompts for Groq's Llama model
6. 🔄 Add report versioning/history
7. 🔄 Implement report caching
