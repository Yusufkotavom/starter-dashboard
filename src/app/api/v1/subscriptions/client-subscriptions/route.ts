import { NextRequest } from 'next/server';
import { Prisma, SubscriptionStatus } from '@prisma/client';
import {
  mapClientSubscriptionRecord,
  normalizeClientSubscriptionPayload
} from '@/features/subscriptions/api/mappers';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { parsePageParams } from '@/lib/integration-v1';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  return withIntegrationAuth({
    request,
    scope: 'client-subscriptions:read',
    handler: async ({ requestId, organizationId }) => {
      const { searchParams } = request.nextUrl;
      const { page, limit, skip } = parsePageParams(searchParams, 50);
      const search = searchParams.get('search') ?? undefined;
      const status = searchParams.get('status') ?? undefined;
      const planId = searchParams.get('planId') ?? undefined;
      const clientId = searchParams.get('clientId') ?? undefined;

      const where: Prisma.ClientSubscriptionWhereInput = {
        organizationId,
        ...(status ? { status: status as SubscriptionStatus } : {}),
        ...(planId ? { planId: Number(planId) } : {}),
        ...(clientId ? { clientId: Number(clientId) } : {}),
        ...(search
          ? {
              OR: [
                { client: { name: { contains: search, mode: 'insensitive' } } },
                { client: { company: { contains: search, mode: 'insensitive' } } },
                { plan: { name: { contains: search, mode: 'insensitive' } } }
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

      return integrationSuccess(requestId, {
        items: items.map(mapClientSubscriptionRecord),
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
    scope: 'client-subscriptions:write',
    handler: async ({ requestId, organizationId }) => {
      const body = (await request.json().catch(() => null)) as {
        clientId?: number;
        planId?: number;
        projectId?: number | null;
        status?: SubscriptionStatus;
        startDate?: string;
        nextBillingDate?: string | null;
        endDate?: string | null;
        autoRenew?: boolean;
        priceOverride?: number | null;
        notes?: string | null;
      } | null;

      if (!body?.clientId || !body?.planId || !body?.startDate) {
        return integrationError(
          requestId,
          'INVALID_CLIENT_SUBSCRIPTION_PAYLOAD',
          'clientId, planId, and startDate are required',
          400
        );
      }

      const created = await prisma.clientSubscription.create({
        data: {
          organizationId,
          ...normalizeClientSubscriptionPayload({
            clientId: body.clientId,
            planId: body.planId,
            projectId: body.projectId ?? null,
            status: body.status ?? 'ACTIVE',
            startDate: body.startDate,
            nextBillingDate: body.nextBillingDate ?? null,
            endDate: body.endDate ?? null,
            autoRenew: body.autoRenew ?? true,
            priceOverride: body.priceOverride ?? null,
            notes: body.notes ?? null
          })
        },
        include: {
          client: true,
          plan: true,
          project: true,
          _count: { select: { invoices: true } }
        }
      });

      return integrationSuccess(requestId, mapClientSubscriptionRecord(created), { status: 201 });
    }
  });
}
