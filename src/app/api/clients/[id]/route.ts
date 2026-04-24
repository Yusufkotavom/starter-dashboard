import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { mapClientRecord } from '@/lib/agency';
import type { ClientMutationPayload } from '@/features/clients/api/types';

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
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id: Number(id) } });

  if (!client) {
    return NextResponse.json({ message: `Client with ID ${id} not found` }, { status: 404 });
  }

  return NextResponse.json(mapClientRecord(client));
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as ClientMutationPayload;

  try {
    const client = await prisma.client.update({
      where: { id: Number(id) },
      data: normalizeClientPayload(body)
    });

    return NextResponse.json(mapClientRecord(client));
  } catch {
    return NextResponse.json({ message: `Client with ID ${id} not found` }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    await prisma.client.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: `Client with ID ${id} not found` }, { status: 404 });
  }
}
