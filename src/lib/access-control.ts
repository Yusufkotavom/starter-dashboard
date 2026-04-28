import type { User } from '@clerk/nextjs/server';

interface SessionClaimsLike {
  email?: unknown;
  email_address?: unknown;
  [key: string]: unknown;
}

function getAdminEmailSet(): Set<string> {
  const source = process.env.DASHBOARD_ADMIN_EMAILS ?? process.env.ADMIN_EMAILS ?? '';
  const items = source
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return new Set(items);
}

export function extractEmailFromSessionClaims(claims: unknown): string | null {
  const safeClaims = (claims ?? {}) as SessionClaimsLike;
  const email = typeof safeClaims.email === 'string' ? safeClaims.email : safeClaims.email_address;
  return typeof email === 'string' && email.trim().length > 0 ? email.toLowerCase() : null;
}

export function isDashboardAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  const adminEmails = getAdminEmailSet();
  if (adminEmails.size === 0) {
    return false;
  }

  return adminEmails.has(email.toLowerCase());
}

export function isDashboardAdminByClaims(claims: unknown): boolean {
  return isDashboardAdminEmail(extractEmailFromSessionClaims(claims));
}

export function isDashboardAdminUser(user: User): boolean {
  const email =
    user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)?.emailAddress ??
    null;

  if (isDashboardAdminEmail(email)) {
    return true;
  }

  const metadata = (user.publicMetadata ?? {}) as Record<string, unknown>;
  if (metadata.isAdmin === true) {
    return true;
  }

  return metadata.role === 'admin';
}
