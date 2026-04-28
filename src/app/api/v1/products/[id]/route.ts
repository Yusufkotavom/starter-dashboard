import { NextRequest } from 'next/server';
import { Prisma, ProductType } from '@prisma/client';
import { mapProductRecord } from '@/lib/catalog';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { invalidIdResponse, parseIdParam } from '@/lib/integration-v1';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'products:read',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const productId = parseIdParam(id);
      if (!productId) return invalidIdResponse(requestId);

      const item = await prisma.product.findFirst({
        where: { id: productId, organizationId },
        include: {
          category: true,
          subscriptionPlans: {
            include: { _count: { select: { subscriptions: true } } }
          }
        }
      });

      if (!item) {
        return integrationError(requestId, 'PRODUCT_NOT_FOUND', `Product ${id} not found`, 404);
      }

      return integrationSuccess(requestId, mapProductRecord(item));
    }
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'products:write',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const productId = parseIdParam(id);
      if (!productId) return invalidIdResponse(requestId);

      const body = (await request.json().catch(() => null)) as {
        name?: string;
        description?: string;
        type?: 'product' | 'service' | 'PRODUCT' | 'SERVICE';
        category?: string;
        isDigital?: boolean;
        deliveryUrl?: string | null;
        photoUrl?: string | null;
        price?: number;
      } | null;

      if (!body?.name?.trim() || !body.description?.trim() || !body.category?.trim()) {
        return integrationError(
          requestId,
          'INVALID_PRODUCT_PAYLOAD',
          'name, description, and category are required',
          400
        );
      }

      const existing = await prisma.product.findFirst({
        where: { id: productId, organizationId },
        select: { id: true }
      });
      if (!existing) {
        return integrationError(requestId, 'PRODUCT_NOT_FOUND', `Product ${id} not found`, 404);
      }

      const updated = await prisma.product.update({
        where: { id: existing.id },
        data: {
          organizationId,
          name: body.name.trim(),
          description: body.description.trim(),
          type: body.type?.toUpperCase() === 'SERVICE' ? ProductType.SERVICE : ProductType.PRODUCT,
          categorySlug: body.category.trim(),
          isDigital: !!body.isDigital,
          deliveryUrl: body.deliveryUrl?.trim() || null,
          photoUrl: body.photoUrl?.trim() || null,
          price: new Prisma.Decimal(body.price ?? 0)
        },
        include: {
          category: true,
          subscriptionPlans: {
            include: { _count: { select: { subscriptions: true } } }
          }
        }
      });

      return integrationSuccess(requestId, mapProductRecord(updated));
    }
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'products:write',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const productId = parseIdParam(id);
      if (!productId) return invalidIdResponse(requestId);

      const existing = await prisma.product.findFirst({
        where: { id: productId, organizationId },
        select: { id: true }
      });
      if (!existing) {
        return integrationError(requestId, 'PRODUCT_NOT_FOUND', `Product ${id} not found`, 404);
      }

      await prisma.product.delete({ where: { id: existing.id } });
      return integrationSuccess(requestId, { success: true });
    }
  });
}
