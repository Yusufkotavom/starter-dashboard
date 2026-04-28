export const INTEGRATION_SCOPES = [
  '*',
  'clients:read',
  'clients:write',
  'quotations:read',
  'quotations:write',
  'invoices:read',
  'invoices:write',
  'projects:read',
  'projects:write',
  'docs:read',
  'docs:write',
  'tasks:read',
  'tasks:write',
  'payments:read',
  'payments:write',
  'products:read',
  'products:write',
  'categories:read',
  'categories:write',
  'subscription-plans:read',
  'subscription-plans:write',
  'client-subscriptions:read',
  'client-subscriptions:write',
  'communications:write',
  'communications:attach',
  'pipeline:read',
  'pipeline:write',
  'settings:read',
  'settings:write'
] as const;

export type IntegrationScope = (typeof INTEGRATION_SCOPES)[number];

const INTEGRATION_SCOPE_SET = new Set<string>(INTEGRATION_SCOPES);

export function normalizeIntegrationScopes(scopes: string[]): string[] {
  const normalized = scopes.map((scope) => scope.trim()).filter(Boolean);

  if (normalized.includes('*')) {
    return ['*'];
  }

  const deduped = [...new Set(normalized)];
  const invalid = deduped.filter((scope) => !INTEGRATION_SCOPE_SET.has(scope));
  if (invalid.length > 0) {
    throw new Error(`INVALID_SCOPES:${invalid.join(',')}`);
  }

  return deduped.toSorted();
}
