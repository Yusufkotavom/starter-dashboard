import { NextRequest } from 'next/server';
import { Prisma, SubscriptionInterval } from '@prisma/client';
import {
  mapSubscriptionPlanRecord,
  normalizeSubscriptionPlanPayload
} from '@/features/subscriptions/api/mappers';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { parsePageParams } from '@/lib/integration-v1';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  return withIntegrationAuth({
    request,
    scope: 'subscription-plans:read',
    handler: async ({ requestId, organizationId }) => {
      const { searchParams } = request.nextUrl;
      const { page, limit, skip } = parsePageParams(searchParams, 50);
      const search = searchParams.get('search') ?? undefined;
      const interval = searchParams.get('interval') ?? undefined;
      const isActive = searchParams.get('isActive') ?? undefined;

      const where: Prisma.SubscriptionPlanWhereInput = {
        organizationId,
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

      return integrationSuccess(requestId, {
        items: items.map(mapSubscriptionPlanRecord),
        total_items: total,
        page,
        per_page: limit,
        total_pages: Math.max(Math.ceil(total / limit), 1)
      });
    }
  });
}

export async function POST(request: NextRequest) {
  return withIntegrationAuth({
    request,
    scope: 'subscription-plans:write',
    handler: async ({ requestId, organizationId }) => {
      const body = (await request.json().catch(() => null)) as {
        name?: string;
        slug?: string;
        description?: string | null;
        serviceId?: number | null;
        price?: number;
        interval?: string;
        isActive?: boolean;
      } | null;

      if (!body?.name?.trim() || !body.slug?.trim() || body.price === undefined) {
        return integrationError(
          requestId,
          'INVALID_SUBSCRIPTION_PLAN_PAYLOAD',
          'name, slug, and price are required',
          400
        );
      }

      const created = await prisma.subscriptionPlan.create({
        data: {
          organizationId,
          ...normalizeSubscriptionPlanPayload({
            name: body.name,
            slug: body.slug,
            description: body.description ?? null,
            serviceId: body.serviceId ?? null,
            price: body.price,
            interval: (body.interval ?? 'MONTHLY') as SubscriptionInterval,
            isActive: body.isActive ?? true
          })
        },
        include: {
          service: true,
          _count: { select: { subscriptions: true } }
        }
      });

      return integrationSuccess(requestId, mapSubscriptionPlanRecord(created), { status: 201 });
    }
  });
}
