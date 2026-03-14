import { apiError } from "@/lib/api/errors";

export function handleRouteError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return apiError("UNAUTHORIZED", "Authentication required.");
  }

  if (error instanceof Error && error.message.startsWith("Missing permission:")) {
    return apiError("FORBIDDEN", error.message);
  }

  if (error instanceof Error) {
    return apiError("INTERNAL_ERROR", error.message);
  }

  return apiError("INTERNAL_ERROR", "Unexpected server error.");
}
