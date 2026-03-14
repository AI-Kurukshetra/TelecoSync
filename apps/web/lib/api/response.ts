import { NextResponse } from "next/server";

type TmfResponse<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json<TmfResponse<T>>({ data, meta });
}

export function created<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json<TmfResponse<T>>({ data, meta }, { status: 201 });
}
