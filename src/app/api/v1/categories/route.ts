import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { mapCategoryRecord } from '@/lib/catalog';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { parsePageParams } from '@/lib/integration-v1';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  return withIntegrationAuth({
    request,
    scope: 'categories:read',
    handler: async ({ requestId, organizationId }) => {
      const { searchParams } = request.nextUrl;
      const { page, limit, skip } = parsePageParams(searchParams);
      const search = searchParams.get('search') ?? undefined;

      const where: Prisma.CategoryWhereInput = {
        organizationId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
              ]
            }
          : {})
      };

      const [items, total] = await Promise.all([
        prisma.category.findMany({
          where,
          include: { _count: { select: { products: true } } },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip,
          take: limit
        }),
        prisma.category.count({ where })
      ]);

      return integrationSuccess(requestId, {
        items: items.map(mapCategoryRecord),
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
    scope: 'categories:write',
    handler: async ({ requestId, organizationId }) => {
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

      const created = await prisma.category.create({
        data: {
          organizationId,
          name: body.name.trim(),
          slug: body.slug.trim().toLowerCase(),
          description: body.description?.trim() || null
        },
        include: { _count: { select: { products: true } } }
      });

      return integrationSuccess(requestId, mapCategoryRecord(created), { status: 201 });
    }
  });
}
