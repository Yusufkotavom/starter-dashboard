import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function getActiveOrganizationId(): Promise<string | null> {
  const { orgId } = await auth();
  return orgId ?? null;
}

export function buildOrganizationScope(organizationId: string | null): {
  organizationId?: string | null;
} {
  if (!organizationId) {
    return {};
  }

  return {
    organizationId
  };
}

export function buildOrganizationReadScope(
  organizationId: string | null
): {} | { OR: [{ organizationId: string }, { organizationId: null }] } {
  if (!organizationId) {
    return {};
  }

  return {
    OR: [{ organizationId }, { organizationId: null }]
  };
}

export function forbiddenOrganizationResponse() {
  return NextResponse.json(
    { message: 'Select an active workspace before accessing this resource.' },
    { status: 403 }
  );
}
