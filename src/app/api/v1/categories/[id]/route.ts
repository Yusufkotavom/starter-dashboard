import { NextRequest } from 'next/server';
import { mapCategoryRecord } from '@/lib/catalog';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { invalidIdResponse, parseIdParam } from '@/lib/integration-v1';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'categories:read',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const categoryId = parseIdParam(id);
      if (!categoryId) return invalidIdResponse(requestId);

      const item = await prisma.category.findFirst({
        where: { id: categoryId, organizationId },
        include: { _count: { select: { products: true } } }
      });

      if (!item) {
        return integrationError(requestId, 'CATEGORY_NOT_FOUND', `Category ${id} not found`, 404);
      }

      return integrationSuccess(requestId, mapCategoryRecord(item));
    }
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'categories:write',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const categoryId = parseIdParam(id);
      if (!categoryId) return invalidIdResponse(requestId);

      const body = (await request.json().catch(() => null)) as {
        name?: string;
        slug?: string;
        description?: string;
      } | null;

      if (!body?.name?.trim() || !body.slug?.trim()) {
        return integrationError(
          requestId,
          'INVALID_CATEGORY_PAYLOAD',
          'name and slug are required',
          400
        );
      }

      const existing = await prisma.category.findFirst({
        where: { id: categoryId, organizationId },
        select: { id: true }
      });
      if (!existing) {
        return integrationError(requestId, 'CATEGORY_NOT_FOUND', `Category ${id} not found`, 404);
      }

      const updated = await prisma.category.update({
        where: { id: existing.id },
        data: {
          name: body.name.trim(),
          slug: body.slug.trim().toLowerCase(),
          description: body.description?.trim() || null
        },
        include: { _count: { select: { products: true } } }
      });

      return integrationSuccess(requestId, mapCategoryRecord(updated));
    }
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'categories:write',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const categoryId = parseIdParam(id);
      if (!categoryId) return invalidIdResponse(requestId);

      const existing = await prisma.category.findFirst({
        where: { id: categoryId, organizationId },
        select: { id: true }
      });
      if (!existing) {
        return integrationError(requestId, 'CATEGORY_NOT_FOUND', `Category ${id} not found`, 404);
      }

      await prisma.category.delete({ where: { id: existing.id } });
      return integrationSuccess(requestId, { success: true });
    }
  });
}
