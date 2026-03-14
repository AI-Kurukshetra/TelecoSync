export async function runRestConnector(input: {
  endpoint: string;
  payload: Record<string, unknown>;
  headers?: Record<string, string>;
  method?: "POST" | "PUT" | "PATCH";
}) {
  const response = await fetch(input.endpoint, {
    method: input.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      ...(input.headers ?? {})
    },
    body: JSON.stringify(input.payload)
  });

  return {
    status: response.ok ? ("success" as const) : ("failed" as const),
    httpStatus: response.status,
    body: await response.text()
  };
}
