import { POST as registerPost } from "@/app/api/auth/register/route";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  return registerPost(
    new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({
        ...body,
        role: "customer"
      })
    })
  );
}
