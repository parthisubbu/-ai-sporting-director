/**
 * AI Provider Abstraction
 * Supports OpenAI-compatible providers: OpenAI, Groq, Together AI, OpenRouter, etc.
 */

import OpenAI from "openai";

export type AIProviderType = "openai" | "groq" | "together" | "openrouter" | "custom";

export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey: string;
  baseURL: string;
  model: string;
}

// ── Validation ────────────────────────────────────────────────
export function validateConfig(config: Partial<AIProviderConfig>): AIProviderConfig {
  const provider = (config.provider || process.env.AI_PROVIDER || "openai") as AIProviderType;
  const apiKey = config.apiKey || process.env.AI_API_KEY;
  const baseURL = config.baseURL || process.env.AI_BASE_URL;
  const model = config.model || process.env.AI_MODEL;

  if (!apiKey) {
    throw new Error("AI_API_KEY environment variable is not set");
  }

  if (!model) {
    throw new Error("AI_MODEL environment variable is not set");
  }

  if (!baseURL) {
    throw new Error("AI_BASE_URL environment variable is not set");
  }

  return { provider, apiKey, baseURL, model };
}

// ── Provider-specific defaults ────────────────────────────────
export function getProviderDefaults(provider: AIProviderType): {
  baseURL: string;
  displayName: string;
} {
  const defaults: Record<AIProviderType, { baseURL: string; displayName: string }> = {
    openai: {
      baseURL: "https://api.openai.com/v1",
      displayName: "OpenAI",
    },
    groq: {
      baseURL: "https://api.groq.com/openai/v1",
      displayName: "Groq Cloud",
    },
    together: {
      baseURL: "https://api.together.xyz/v1",
      displayName: "Together AI",
    },
    openrouter: {
      baseURL: "https://openrouter.io/api/v1",
      displayName: "OpenRouter",
    },
    custom: {
      baseURL: "http://localhost:8000/v1",
      displayName: "Custom Provider",
    },
  };

  return defaults[provider] || defaults.custom;
}

// ── Client factory ────────────────────────────────────────────
export function createAIClient(overrideConfig?: Partial<AIProviderConfig>): OpenAI {
  const config = validateConfig(overrideConfig || {});

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
}

// ── Error classification ──────────────────────────────────────
export class AIProviderError extends Error {
  constructor(
    message: string,
    public code: "MISSING_KEY" | "INVALID_MODEL" | "TIMEOUT" | "RATE_LIMIT" | "PROVIDER_UNAVAILABLE" | "UNKNOWN",
    public originalError?: Error
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}

export function classifyError(error: unknown): AIProviderError {
  if (error instanceof AIProviderError) {
    return error;
  }

  const err = error as any;
  const message = err?.message || String(error);
  const status = err?.status || err?.statusCode;

  // Missing API key
  if (message.includes("API key") || message.includes("authentication")) {
    return new AIProviderError(
      "AI API key is invalid or missing",
      "MISSING_KEY",
      err instanceof Error ? err : undefined
    );
  }

  // Invalid model
  if (message.includes("model") || status === 404) {
    return new AIProviderError(
      `AI model is invalid or not available`,
      "INVALID_MODEL",
      err instanceof Error ? err : undefined
    );
  }

  // Timeout
  if (message.includes("timeout") || message.includes("ETIMEDOUT")) {
    return new AIProviderError(
      "AI provider request timed out",
      "TIMEOUT",
      err instanceof Error ? err : undefined
    );
  }

  // Rate limit
  if (status === 429 || message.includes("rate")) {
    return new AIProviderError(
      "AI provider rate limit exceeded",
      "RATE_LIMIT",
      err instanceof Error ? err : undefined
    );
  }

  // Provider unavailable
  if (status === 503 || status === 502 || message.includes("unavailable")) {
    return new AIProviderError(
      "AI provider is currently unavailable",
      "PROVIDER_UNAVAILABLE",
      err instanceof Error ? err : undefined
    );
  }

  // Unknown error
  return new AIProviderError(
    `AI provider error: ${message}`,
    "UNKNOWN",
    err instanceof Error ? err : undefined
  );
}

// ── Retry logic with exponential backoff ──────────────────────
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  timeout: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  timeout: 60000,
};

export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: AIProviderError | undefined;
  let delay = finalConfig.initialDelayMs;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), finalConfig.timeout)
        ),
      ]);
    } catch (error) {
      lastError = classifyError(error);

      // Don't retry on non-retryable errors
      if (
        lastError.code === "MISSING_KEY" ||
        lastError.code === "INVALID_MODEL"
      ) {
        throw lastError;
      }

      // Don't retry on last attempt
      if (attempt === finalConfig.maxRetries) {
        throw lastError;
      }

      // Wait before retrying
      console.warn(
        `AI request failed (attempt ${attempt + 1}/${finalConfig.maxRetries + 1}), retrying in ${delay}ms...`,
        lastError.message
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * finalConfig.backoffMultiplier, finalConfig.maxDelayMs);
    }
  }

  throw lastError || new AIProviderError("Unknown error", "UNKNOWN");
}
