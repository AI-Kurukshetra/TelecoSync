import { NextResponse } from "next/server";

const errorStatusMap = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  INTERNAL_ERROR: 500
} as const;

type ErrorCode = keyof typeof errorStatusMap;

export function apiError(code: ErrorCode, message: string) {
  return NextResponse.json(
    {
      error: {
        code,
        message
      }
    },
    { status: errorStatusMap[code] }
  );
}
