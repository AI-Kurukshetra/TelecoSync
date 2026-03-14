export async function runPaymentGatewayConnector(input: {
  endpoint: string;
  payload: Record<string, unknown>;
  apiKey?: string;
}) {
  const response = await fetch(input.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(input.apiKey ? { Authorization: `Bearer ${input.apiKey}` } : {})
    },
    body: JSON.stringify(input.payload)
  });

  return {
    status: response.ok ? ("success" as const) : ("failed" as const),
    httpStatus: response.status,
    body: await response.text()
  };
}
