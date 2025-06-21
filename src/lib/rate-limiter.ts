export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: Request) => string | Promise<string>;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  statusCode?: number;
  store?: RateLimitStore;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  used: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | null>;
  increment(key: string, windowMs: number): Promise<RateLimitEntry>;
  cleanup(): Promise<void>;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class InMemoryStore implements RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    this.startCleanup();
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup().catch(console.error);
    }, 60000);
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.resetTime) {
      this.store.delete(key);
      return null;
    }

    return entry;
  }

  async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || now > existing.resetTime) {
      const newEntry = { count: 1, resetTime: now + windowMs };
      this.store.set(key, newEntry);
      return newEntry;
    }

    const updated = {
      count: existing.count + 1,
      resetTime: existing.resetTime,
    };
    this.store.set(key, updated);
    return updated;
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.store.delete(key);
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.store.clear();
  }
}

export class RateLimiter {
  private config: Required<Omit<RateLimitConfig, "store">> & {
    store: RateLimitStore;
  };
  private requestHistory = new Map<
    string,
    { success: boolean; timestamp: number }[]
  >();

  constructor(config: RateLimitConfig) {
    this.validateConfig(config);

    this.config = {
      keyGenerator: this.defaultKeyGenerator,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: "Too many requests, please try again later.",
      statusCode: 429,
      store: new InMemoryStore(),
      ...config,
    };
  }

  private validateConfig(config: RateLimitConfig): void {
    if (!config.windowMs || config.windowMs <= 0) {
      throw new Error("windowMs must be a positive number");
    }
    if (!config.maxRequests || config.maxRequests <= 0) {
      throw new Error("maxRequests must be a positive number");
    }
  }

  private defaultKeyGenerator(request: Request): string {
    try {
      const url = new URL(request.url);
      const forwarded = request.headers.get("x-forwarded-for");
      const realIp = request.headers.get("x-real-ip");
      const cfConnectingIp = request.headers.get("cf-connecting-ip");

      let ip = "unknown";
      if (cfConnectingIp) {
        ip = cfConnectingIp;
      } else if (forwarded) {
        ip = forwarded.split(",")[0].trim();
      } else if (realIp) {
        ip = realIp;
      }

      return `${ip}:${url.pathname}`;
    } catch (error) {
      console.error("Error generating rate limit key:", error);
      return "unknown:unknown";
    }
  }

  private shouldSkipRequest(key: string, success: boolean): boolean {
    if (
      !this.config.skipSuccessfulRequests &&
      !this.config.skipFailedRequests
    ) {
      return false;
    }

    const history = this.requestHistory.get(key) || [];
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const recentHistory = history.filter(
      entry => entry.timestamp > windowStart
    );
    this.requestHistory.set(key, recentHistory);

    if (this.config.skipSuccessfulRequests && success) {
      return true;
    }

    if (this.config.skipFailedRequests && !success) {
      return true;
    }

    return false;
  }

  private recordRequest(key: string, success: boolean): void {
    if (
      !this.config.skipSuccessfulRequests &&
      !this.config.skipFailedRequests
    ) {
      return;
    }

    const history = this.requestHistory.get(key) || [];
    const now = Date.now();

    history.push({ success, timestamp: now });

    const windowStart = now - this.config.windowMs;
    const recentHistory = history.filter(
      entry => entry.timestamp > windowStart
    );
    this.requestHistory.set(key, recentHistory);
  }

  async check(
    request: Request,
    responseSuccess?: boolean
  ): Promise<RateLimitResult> {
    try {
      const key = await this.config.keyGenerator(request);

      if (
        responseSuccess !== undefined &&
        this.shouldSkipRequest(key, responseSuccess)
      ) {
        return {
          success: true,
          limit: this.config.maxRequests,
          used: 0,
          remaining: this.config.maxRequests,
          reset: Math.ceil((Date.now() + this.config.windowMs) / 1000),
        };
      }

      const entry = await this.config.store.increment(
        key,
        this.config.windowMs
      );

      const success = entry.count <= this.config.maxRequests;
      const remaining = Math.max(0, this.config.maxRequests - entry.count);
      const reset = Math.ceil(entry.resetTime / 1000);
      const retryAfter = success
        ? undefined
        : Math.ceil((entry.resetTime - Date.now()) / 1000);

      if (responseSuccess !== undefined) {
        this.recordRequest(key, responseSuccess);
      }

      return {
        success,
        limit: this.config.maxRequests,
        used: entry.count,
        remaining,
        reset,
        retryAfter,
      };
    } catch (error) {
      console.error("Rate limit check failed:", error);
      return {
        success: true,
        limit: this.config.maxRequests,
        used: 0,
        remaining: this.config.maxRequests,
        reset: Math.ceil((Date.now() + this.config.windowMs) / 1000),
      };
    }
  }

  async middleware(request: Request): Promise<Response | null> {
    const result = await this.check(request);

    if (!result.success) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toString(),
      };

      if (result.retryAfter) {
        headers["Retry-After"] = result.retryAfter.toString();
      }

      return new Response(
        JSON.stringify({
          error: this.config.message,
          limit: result.limit,
          used: result.used,
          remaining: result.remaining,
          reset: result.reset,
          retryAfter: result.retryAfter,
        }),
        {
          status: this.config.statusCode,
          headers,
        }
      );
    }

    return null;
  }

  destroy(): void {
    if (this.config.store instanceof InMemoryStore) {
      this.config.store.destroy();
    }
    this.requestHistory.clear();
  }
}

export const createRateLimiter = (config: RateLimitConfig): RateLimiter =>
  new RateLimiter(config);

export const rateLimitConfigs = {
  improvePrompt: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    message:
      "Too many prompt improvement requests, please wait before trying again.",
  },
  default: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    message: "Too many requests, please try again later.",
  },
} as const;
