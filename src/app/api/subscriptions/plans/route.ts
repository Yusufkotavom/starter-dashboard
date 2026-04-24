import { NextRequest, NextResponse } from 'next/server';
import { Prisma, SubscriptionInterval } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  mapSubscriptionPlanRecord,
  normalizeSubscriptionPlanPayload
} from '@/features/subscriptions/api/mappers';
import type { SubscriptionPlanMutationPayload } from '@/features/subscriptions/api/types';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 50);
  const search = searchParams.get('search') ?? undefined;
  const interval = searchParams.get('interval') ?? undefined;
  const isActive = searchParams.get('isActive') ?? undefined;
  const skip = (page - 1) * limit;

  const where: Prisma.SubscriptionPlanWhereInput = {
    ...(interval ? { interval: interval as SubscriptionInterval } : {}),
    ...(isActive ? { isActive: isActive === 'true' } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
            { service: { name: { contains: search, mode: 'insensitive' } } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.subscriptionPlan.findMany({
      where,
      include: {
        service: true,
        _count: { select: { subscriptions: true } }
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      skip,
      take: limit
    }),
    prisma.subscriptionPlan.count({ where })
  ]);

  return NextResponse.json({
    items: items.map(mapSubscriptionPlanRecord),
    total_items: total
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as SubscriptionPlanMutationPayload;
  const created = await prisma.subscriptionPlan.create({
    data: normalizeSubscriptionPlanPayload(body),
    include: {
      service: true,
      _count: { select: { subscriptions: true } }
    }
  });

  return NextResponse.json(mapSubscriptionPlanRecord(created), { status: 201 });
}
