import { NextRequest } from 'next/server';
import { Prisma, ProductType } from '@prisma/client';
import { mapProductRecord } from '@/lib/catalog';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { parsePageParams } from '@/lib/integration-v1';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  return withIntegrationAuth({
    request,
    scope: 'products:read',
    handler: async ({ requestId, organizationId }) => {
      const { searchParams } = request.nextUrl;
      const { page, limit, skip } = parsePageParams(searchParams);
      const search = searchParams.get('search') ?? undefined;
      const type = searchParams.get('type') ?? undefined;

      const where: Prisma.ProductWhereInput = {
        organizationId,
        ...(type ? { type: { equals: type.toUpperCase() as ProductType } } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { category: { name: { contains: search, mode: 'insensitive' } } }
              ]
            }
          : {})
      };

      const [items, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: true,
            subscriptionPlans: {
              include: { _count: { select: { subscriptions: true } } }
            }
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip,
          take: limit
        }),
        prisma.product.count({ where })
      ]);

      return integrationSuccess(requestId, {
        items: items.map(mapProductRecord),
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
    scope: 'products:write',
    handler: async ({ requestId, organizationId }) => {
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

      const created = await prisma.product.create({
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

      return integrationSuccess(requestId, mapProductRecord(created), { status: 201 });
    }
  });
}
