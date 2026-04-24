import { NextRequest, NextResponse } from 'next/server';
import { Prisma, SubscriptionStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  mapClientSubscriptionRecord,
  normalizeClientSubscriptionPayload
} from '@/features/subscriptions/api/mappers';
import type { ClientSubscriptionMutationPayload } from '@/features/subscriptions/api/types';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 50);
  const search = searchParams.get('search') ?? undefined;
  const status = searchParams.get('status') ?? undefined;
  const planId = searchParams.get('planId') ?? undefined;
  const clientId = searchParams.get('clientId') ?? undefined;
  const skip = (page - 1) * limit;

  const where: Prisma.ClientSubscriptionWhereInput = {
    ...(status ? { status: status as SubscriptionStatus } : {}),
    ...(planId ? { planId: Number(planId) } : {}),
    ...(clientId ? { clientId: Number(clientId) } : {}),
    ...(search
      ? {
          OR: [
            { client: { name: { contains: search, mode: 'insensitive' } } },
            { client: { company: { contains: search, mode: 'insensitive' } } },
            { plan: { name: { contains: search, mode: 'insensitive' } } },
            { project: { name: { contains: search, mode: 'insensitive' } } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.clientSubscription.findMany({
      where,
      include: {
        client: true,
        plan: true,
        project: true,
        _count: { select: { invoices: true } }
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit
    }),
    prisma.clientSubscription.count({ where })
  ]);

  return NextResponse.json({
    items: items.map(mapClientSubscriptionRecord),
    total_items: total
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ClientSubscriptionMutationPayload;
  const created = await prisma.clientSubscription.create({
    data: normalizeClientSubscriptionPayload(body),
    include: {
      client: true,
      plan: true,
      project: true,
      _count: { select: { invoices: true } }
    }
  });

  return NextResponse.json(mapClientSubscriptionRecord(created), { status: 201 });
}
