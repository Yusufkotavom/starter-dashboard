import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  createIntegrationApiKey,
  mapIntegrationKeyRecord,
  requireAuthenticatedDashboardUser
} from '@/lib/integration-keys';
import { getActiveOrganizationId } from '@/lib/workspace';

export async function GET() {
  await requireAuthenticatedDashboardUser();
  const organizationId = await getActiveOrganizationId();
  const items = await prisma.integrationApiKey.findMany({
    where: {
      organizationId
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
  });

  return NextResponse.json({
    items: items.map(mapIntegrationKeyRecord)
  });
}

export async function POST(request: NextRequest) {
  await requireAuthenticatedDashboardUser();
  const activeOrganizationId = await getActiveOrganizationId();
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    scopes?: string[];
  } | null;

  if (!body?.name?.trim()) {
    return NextResponse.json({ message: 'name is required' }, { status: 400 });
  }

  const result = await createIntegrationApiKey({
    name: body.name,
    scopes: Array.isArray(body.scopes) && body.scopes.length > 0 ? body.scopes : ['*'],
    organizationId: activeOrganizationId
  });

  return NextResponse.json(
    {
      key: result.key,
      record: result.record
    },
    { status: 201 }
  );
}
