const DEFAULT_LIMIT = 25;
const DEFAULT_OFFSET = 0;
const MAX_LIMIT = 100;

type PaginationOptions = {
  defaultLimit?: number;
  maxLimit?: number;
  defaultOffset?: number;
};

export type PaginationInput = {
  limit: number;
  offset: number;
};

export function parsePagination(
  request: Request,
  options: PaginationOptions = {}
): PaginationInput {
  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit"));
  const offsetParam = Number(url.searchParams.get("offset"));
  const maxLimit = options.maxLimit ?? MAX_LIMIT;
  const defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT;
  const defaultOffset = options.defaultOffset ?? DEFAULT_OFFSET;

  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(Math.trunc(limitParam), 1), maxLimit)
    : defaultLimit;
  const offset = Number.isFinite(offsetParam)
    ? Math.max(Math.trunc(offsetParam), 0)
    : defaultOffset;

  return { limit, offset };
}

export function paginationMeta(input: PaginationInput, total: number | null) {
  const safeTotal = total ?? 0;

  return {
    pagination: {
      limit: input.limit,
      offset: input.offset,
      total: safeTotal,
      hasMore: input.offset + input.limit < safeTotal
    }
  };
}
