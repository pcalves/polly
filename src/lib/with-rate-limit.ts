import { NextRequest, NextResponse } from "next/server";
import { RateLimitConfig, createRateLimiter } from "./rate-limiter";

type APIHandler = (
  request: NextRequest
) => Promise<NextResponse> | NextResponse;

export function withRateLimit(
  config: RateLimitConfig,
  handler: APIHandler
): APIHandler {
  const rateLimiter = createRateLimiter(config);

  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const preCheckResult = await rateLimiter.check(request);

      if (!preCheckResult.success) {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": preCheckResult.limit.toString(),
          "X-RateLimit-Remaining": preCheckResult.remaining.toString(),
          "X-RateLimit-Reset": preCheckResult.reset.toString(),
        };

        if (preCheckResult.retryAfter) {
          headers["Retry-After"] = preCheckResult.retryAfter.toString();
        }

        return NextResponse.json(
          {
            error:
              config.message || "Too many requests, please try again later.",
            limit: preCheckResult.limit,
            used: preCheckResult.used,
            remaining: preCheckResult.remaining,
            reset: preCheckResult.reset,
            retryAfter: preCheckResult.retryAfter,
          },
          {
            status: config.statusCode || 429,
            headers,
          }
        );
      }

      const response = await handler(request);
      const isSuccess = response.status >= 200 && response.status < 300;

      if (config.skipSuccessfulRequests || config.skipFailedRequests) {
        await rateLimiter.check(request, isSuccess);
      }

      response.headers.set(
        "X-RateLimit-Limit",
        preCheckResult.limit.toString()
      );
      response.headers.set(
        "X-RateLimit-Remaining",
        preCheckResult.remaining.toString()
      );
      response.headers.set(
        "X-RateLimit-Reset",
        preCheckResult.reset.toString()
      );

      if (preCheckResult.retryAfter) {
        response.headers.set(
          "Retry-After",
          preCheckResult.retryAfter.toString()
        );
      }

      return response;
    } catch (error) {
      console.error("Rate limiting error:", error);
      return await handler(request);
    }
  };
}

export function withRateLimitByMethod(
  handler: APIHandler,
  methodConfigs: Record<string, RateLimitConfig>
): APIHandler {
  return async (request: NextRequest): Promise<NextResponse> => {
    const method = request.method.toLowerCase();
    const config = methodConfigs[method];

    if (config) {
      return withRateLimit(config, handler)(request);
    }

    return handler(request);
  };
}
