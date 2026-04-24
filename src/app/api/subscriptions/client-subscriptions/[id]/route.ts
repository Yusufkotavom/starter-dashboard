import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mapClientSubscriptionRecord,
  normalizeClientSubscriptionPayload
} from '@/features/subscriptions/api/mappers';
import type { ClientSubscriptionMutationPayload } from '@/features/subscriptions/api/types';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const item = await prisma.clientSubscription.findUnique({
    where: { id: Number(id) },
    include: {
      client: true,
      plan: true,
      project: true,
      _count: { select: { invoices: true } }
    }
  });

  if (!item) {
    return NextResponse.json(
      { message: `Client subscription with ID ${id} not found` },
      { status: 404 }
    );
  }

  return NextResponse.json(mapClientSubscriptionRecord(item));
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as ClientSubscriptionMutationPayload;

  try {
    const updated = await prisma.clientSubscription.update({
      where: { id: Number(id) },
      data: normalizeClientSubscriptionPayload(body),
      include: {
        client: true,
        plan: true,
        project: true,
        _count: { select: { invoices: true } }
      }
    });

    return NextResponse.json(mapClientSubscriptionRecord(updated));
  } catch {
    return NextResponse.json(
      { message: `Client subscription with ID ${id} not found` },
      { status: 404 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    await prisma.clientSubscription.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { message: `Client subscription with ID ${id} not found` },
      { status: 404 }
    );
  }
}
