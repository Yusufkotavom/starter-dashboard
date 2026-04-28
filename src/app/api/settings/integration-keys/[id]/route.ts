import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthenticatedDashboardUser, rotateIntegrationApiKey } from '@/lib/integration-keys';
import { normalizeIntegrationScopes } from '@/lib/integration-scopes';
import { getActiveOrganizationId } from '@/lib/workspace';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  await requireAuthenticatedDashboardUser();
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;
  const apiKeyId = Number(id);

  if (!Number.isInteger(apiKeyId) || apiKeyId <= 0) {
    return NextResponse.json({ message: 'Invalid key id' }, { status: 400 });
  }

  const existing = await prisma.integrationApiKey.findFirst({
    where: {
      id: apiKeyId,
      organizationId
    },
    select: {
      id: true
    }
  });

  if (!existing) {
    return NextResponse.json({ message: `Integration key ${id} not found` }, { status: 404 });
  }

  await prisma.integrationApiKey.update({
    where: { id: existing.id },
    data: {
      isActive: false
    }
  });

  return NextResponse.json({
    success: true
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  await requireAuthenticatedDashboardUser();
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;
  const apiKeyId = Number(id);

  if (!Number.isInteger(apiKeyId) || apiKeyId <= 0) {
    return NextResponse.json({ message: 'Invalid key id' }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    scopes?: string[];
    isActive?: boolean;
  } | null;

  const existing = await prisma.integrationApiKey.findFirst({
    where: { id: apiKeyId, organizationId }
  });
  if (!existing) {
    return NextResponse.json({ message: `Integration key ${id} not found` }, { status: 404 });
  }

  try {
    const updated = await prisma.integrationApiKey.update({
      where: { id: existing.id },
      data: {
        ...(body?.name !== undefined ? { name: body.name.trim() } : {}),
        ...(Array.isArray(body?.scopes) ? { scopes: normalizeIntegrationScopes(body.scopes) } : {}),
        ...(typeof body?.isActive === 'boolean' ? { isActive: body.isActive } : {})
      }
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      scopes: updated.scopes,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt.toISOString()
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('INVALID_SCOPES:')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to update integration key' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  await requireAuthenticatedDashboardUser();
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;
  const apiKeyId = Number(id);

  if (!Number.isInteger(apiKeyId) || apiKeyId <= 0) {
    return NextResponse.json({ message: 'Invalid key id' }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as {
    action?: 'rotate';
    name?: string;
    scopes?: string[];
    disablePrevious?: boolean;
  } | null;

  if (body?.action !== 'rotate') {
    return NextResponse.json({ message: 'Unsupported action' }, { status: 400 });
  }

  try {
    const result = await rotateIntegrationApiKey({
      id: apiKeyId,
      organizationId,
      name: body.name,
      scopes: Array.isArray(body.scopes) ? body.scopes : undefined,
      disablePrevious: body.disablePrevious
    });

    return NextResponse.json(
      {
        key: result.key,
        record: result.record
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return NextResponse.json({ message: `Integration key ${id} not found` }, { status: 404 });
    }
    if (error instanceof Error && error.message.startsWith('INVALID_SCOPES:')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to rotate integration key' }, { status: 500 });
  }
}
