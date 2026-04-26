import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthenticatedDashboardUser } from '@/lib/integration-keys';
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
