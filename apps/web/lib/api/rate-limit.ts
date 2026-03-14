import { NextResponse, type NextRequest } from "next/server";

type RateLimitPolicy = {
  key: string;
  limit: number;
  windowSeconds: number;
};

const redisRestUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisRestToken = process.env.UPSTASH_REDIS_REST_TOKEN;

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function resolvePolicy(request: NextRequest): RateLimitPolicy | null {
  const path = request.nextUrl.pathname;
  const ip = getClientIp(request);

  if (path === "/api/auth/login") {
    return {
      key: `ratelimit:login:${ip}`,
      limit: 10,
      windowSeconds: 60
    };
  }

  if (path === "/api/auth/register") {
    return {
      key: `ratelimit:register:${ip}`,
      limit: 5,
      windowSeconds: 60 * 5
    };
  }

  if (path === "/api/auth/forgot-password") {
    return {
      key: `ratelimit:forgot-password:${ip}`,
      limit: 5,
      windowSeconds: 60 * 10
    };
  }

  if (path === "/api/webhooks/inbound") {
    return {
      key: `ratelimit:inbound:${ip}`,
      limit: 120,
      windowSeconds: 60
    };
  }

  return null;
}

async function incrementCounter(policy: RateLimitPolicy) {
  const headers = {
    Authorization: `Bearer ${redisRestToken ?? ""}`,
    "Content-Type": "application/json"
  };
  const encodedKey = encodeURIComponent(policy.key);
  const incrementResponse = await fetch(
    `${redisRestUrl}/incr/${encodedKey}`,
    {
      method: "POST",
      headers
    }
  );

  if (!incrementResponse.ok) {
    throw new Error(`Rate limit increment failed with status ${incrementResponse.status}.`);
  }

  const incrementResult = (await incrementResponse.json()) as {
    result?: number;
  };
  const count = Number(incrementResult.result ?? 0);

  if (count === 1) {
    await fetch(`${redisRestUrl}/expire/${encodedKey}/${policy.windowSeconds}`, {
      method: "POST",
      headers
    });
  }

  return count;
}

export async function enforceRateLimit(request: NextRequest) {
  if (!redisRestUrl || !redisRestToken) {
    return null;
  }

  const policy = resolvePolicy(request);

  if (!policy) {
    return null;
  }

  try {
    const count = await incrementCounter(policy);

    if (count > policy.limit) {
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "Rate limit exceeded."
          }
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(policy.windowSeconds)
          }
        }
      );
    }
  } catch {
    return null;
  }

  return null;
}
