import { integrationError } from '@/lib/integration-api';

export function parsePositiveInt(value: string | null, fallback: number): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 1) {
    return fallback;
  }
  return Math.trunc(num);
}

export function parsePageParams(searchParams: URLSearchParams, defaultLimit = 20, maxLimit = 100) {
  const page = parsePositiveInt(searchParams.get('page'), 1);
  const limit = Math.min(parsePositiveInt(searchParams.get('limit'), defaultLimit), maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function parseIdParam(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export function invalidIdResponse(requestId: string, name = 'id') {
  return integrationError(requestId, 'INVALID_ID', `${name} must be a positive integer`, 400);
}
