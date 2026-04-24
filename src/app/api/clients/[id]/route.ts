import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { mapClientRecord } from '@/lib/agency';
import type { ClientMutationPayload } from '@/features/clients/api/types';
import { buildOrganizationReadScope, getActiveOrganizationId } from '@/lib/workspace';

type Params = { params: Promise<{ id: string }> };

function normalizeClientPayload(body: ClientMutationPayload): Prisma.ClientUpdateInput {
  return {
    name: body.name.trim(),
    email: body.email.trim().toLowerCase(),
    phone: body.phone?.trim() || null,
    company: body.company?.trim() || null,
    address: body.address?.trim() || null,
    status: body.status,
    notes: body.notes?.trim() || null
  };
}

export async function GET(_request: NextRequest, { params }: Params) {
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;
  const client = await prisma.client.findFirst({
    where: {
      id: Number(id),
      ...buildOrganizationReadScope(organizationId)
    }
  });

  if (!client) {
    return NextResponse.json({ message: `Client with ID ${id} not found` }, { status: 404 });
  }

  return NextResponse.json(mapClientRecord(client));
}

export async function PUT(request: NextRequest, { params }: Params) {
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;
  const body = (await request.json()) as ClientMutationPayload;

  try {
    const existing = await prisma.client.findFirst({
      where: {
        id: Number(id),
        ...buildOrganizationReadScope(organizationId)
      },
      select: { id: true }
    });
    if (!existing) {
      return NextResponse.json({ message: `Client with ID ${id} not found` }, { status: 404 });
    }
    const client = await prisma.client.update({
      where: { id: existing.id },
      data: normalizeClientPayload(body)
    });

    return NextResponse.json(mapClientRecord(client));
  } catch {
    return NextResponse.json({ message: `Client with ID ${id} not found` }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;

  try {
    const existing = await prisma.client.findFirst({
      where: {
        id: Number(id),
        ...buildOrganizationReadScope(organizationId)
      },
      select: { id: true }
    });
    if (!existing) {
      return NextResponse.json({ message: `Client with ID ${id} not found` }, { status: 404 });
    }
    await prisma.client.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: `Client with ID ${id} not found` }, { status: 404 });
  }
}
