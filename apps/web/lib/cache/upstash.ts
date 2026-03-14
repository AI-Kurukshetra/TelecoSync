type CacheValue = string | number | boolean | Record<string, unknown> | null;

const redisRestUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisRestToken = process.env.UPSTASH_REDIS_REST_TOKEN;

function getHeaders() {
  return {
    Authorization: `Bearer ${redisRestToken ?? ""}`,
    "Content-Type": "application/json"
  };
}

function isConfigured() {
  return Boolean(redisRestUrl && redisRestToken);
}

export async function getCacheJson<T>(key: string): Promise<T | null> {
  if (!isConfigured()) {
    return null;
  }

  const response = await fetch(
    `${redisRestUrl}/get/${encodeURIComponent(key)}`,
    {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store"
    }
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { result?: string | null };
  if (!payload.result) {
    return null;
  }

  try {
    return JSON.parse(payload.result) as T;
  } catch {
    return null;
  }
}

export async function setCacheJson(
  key: string,
  value: CacheValue,
  ttlSeconds: number
) {
  if (!isConfigured()) {
    return;
  }

  await fetch(
    `${redisRestUrl}/set/${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        value: JSON.stringify(value),
        ex: ttlSeconds
      }),
      cache: "no-store"
    }
  );
}
