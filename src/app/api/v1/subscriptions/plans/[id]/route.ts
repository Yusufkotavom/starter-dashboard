import { NextRequest } from 'next/server';
import { SubscriptionInterval } from '@prisma/client';
import {
  mapSubscriptionPlanRecord,
  normalizeSubscriptionPlanPayload
} from '@/features/subscriptions/api/mappers';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { invalidIdResponse, parseIdParam } from '@/lib/integration-v1';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'subscription-plans:read',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const planId = parseIdParam(id);
      if (!planId) return invalidIdResponse(requestId);

      const item = await prisma.subscriptionPlan.findFirst({
        where: { id: planId, organizationId },
        include: {
          service: true,
          _count: { select: { subscriptions: true } }
        }
      });

      if (!item) {
        return integrationError(
          requestId,
          'SUBSCRIPTION_PLAN_NOT_FOUND',
          `Subscription plan ${id} not found`,
          404
        );
      }

      return integrationSuccess(requestId, mapSubscriptionPlanRecord(item));
    }
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'subscription-plans:write',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const planId = parseIdParam(id);
      if (!planId) return invalidIdResponse(requestId);

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

      const existing = await prisma.subscriptionPlan.findFirst({
        where: { id: planId, organizationId },
        select: { id: true }
      });
      if (!existing) {
        return integrationError(
          requestId,
          'SUBSCRIPTION_PLAN_NOT_FOUND',
          `Subscription plan ${id} not found`,
          404
        );
      }

      const updated = await prisma.subscriptionPlan.update({
        where: { id: existing.id },
        data: {
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

      return integrationSuccess(requestId, mapSubscriptionPlanRecord(updated));
    }
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'subscription-plans:write',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const planId = parseIdParam(id);
      if (!planId) return invalidIdResponse(requestId);

      const existing = await prisma.subscriptionPlan.findFirst({
        where: { id: planId, organizationId },
        select: { id: true }
      });
      if (!existing) {
        return integrationError(
          requestId,
          'SUBSCRIPTION_PLAN_NOT_FOUND',
          `Subscription plan ${id} not found`,
          404
        );
      }

      await prisma.subscriptionPlan.delete({ where: { id: existing.id } });
      return integrationSuccess(requestId, { success: true });
    }
  });
}
