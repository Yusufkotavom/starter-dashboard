import { NextRequest } from 'next/server';
import { SubscriptionStatus } from '@prisma/client';
import {
  mapClientSubscriptionRecord,
  normalizeClientSubscriptionPayload
} from '@/features/subscriptions/api/mappers';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { invalidIdResponse, parseIdParam } from '@/lib/integration-v1';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'client-subscriptions:read',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const subscriptionId = parseIdParam(id);
      if (!subscriptionId) return invalidIdResponse(requestId);

      const item = await prisma.clientSubscription.findFirst({
        where: { id: subscriptionId, organizationId },
        include: {
          client: true,
          plan: true,
          project: true,
          _count: { select: { invoices: true } }
        }
      });

      if (!item) {
        return integrationError(
          requestId,
          'CLIENT_SUBSCRIPTION_NOT_FOUND',
          `Client subscription ${id} not found`,
          404
        );
      }

      return integrationSuccess(requestId, mapClientSubscriptionRecord(item));
    }
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'client-subscriptions:write',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const subscriptionId = parseIdParam(id);
      if (!subscriptionId) return invalidIdResponse(requestId);

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

      const existing = await prisma.clientSubscription.findFirst({
        where: { id: subscriptionId, organizationId },
        select: { id: true }
      });
      if (!existing) {
        return integrationError(
          requestId,
          'CLIENT_SUBSCRIPTION_NOT_FOUND',
          `Client subscription ${id} not found`,
          404
        );
      }

      const updated = await prisma.clientSubscription.update({
        where: { id: existing.id },
        data: {
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

      return integrationSuccess(requestId, mapClientSubscriptionRecord(updated));
    }
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'client-subscriptions:write',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const subscriptionId = parseIdParam(id);
      if (!subscriptionId) return invalidIdResponse(requestId);

      const existing = await prisma.clientSubscription.findFirst({
        where: { id: subscriptionId, organizationId },
        select: { id: true }
      });
      if (!existing) {
        return integrationError(
          requestId,
          'CLIENT_SUBSCRIPTION_NOT_FOUND',
          `Client subscription ${id} not found`,
          404
        );
      }

      await prisma.clientSubscription.delete({ where: { id: existing.id } });
      return integrationSuccess(requestId, { success: true });
    }
  });
}
