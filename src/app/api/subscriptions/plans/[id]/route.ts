import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mapSubscriptionPlanRecord,
  normalizeSubscriptionPlanPayload
} from '@/features/subscriptions/api/mappers';
import type { SubscriptionPlanMutationPayload } from '@/features/subscriptions/api/types';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const item = await prisma.subscriptionPlan.findUnique({
    where: { id: Number(id) },
    include: {
      service: true,
      _count: { select: { subscriptions: true } }
    }
  });

  if (!item) {
    return NextResponse.json(
      { message: `Subscription plan with ID ${id} not found` },
      { status: 404 }
    );
  }

  return NextResponse.json(mapSubscriptionPlanRecord(item));
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as SubscriptionPlanMutationPayload;

  try {
    const updated = await prisma.subscriptionPlan.update({
      where: { id: Number(id) },
      data: normalizeSubscriptionPlanPayload(body),
      include: {
        service: true,
        _count: { select: { subscriptions: true } }
      }
    });

    return NextResponse.json(mapSubscriptionPlanRecord(updated));
  } catch {
    return NextResponse.json(
      { message: `Subscription plan with ID ${id} not found` },
      { status: 404 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    await prisma.subscriptionPlan.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { message: `Subscription plan with ID ${id} not found` },
      { status: 404 }
    );
  }
}
