import { createHmac } from "crypto";

export function signWebhookPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export async function deliverWebhook(input: {
  payload: Record<string, unknown>;
  secret: string;
  targetUrl: string;
  headers?: Record<string, string>;
}) {
  const body = JSON.stringify(input.payload);
  const signature = signWebhookPayload(body, input.secret);
  const response = await fetch(input.targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-telecosync-signature": signature,
      ...(input.headers ?? {})
    },
    body
  });

  return {
    ok: response.ok,
    status: response.status,
    body: await response.text()
  };
}
