import { NextRequest } from 'next/server';
import { Prisma, QuotationStatus } from '@prisma/client';
import { mapQuotationRecord } from '@/lib/agency';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { createIntegrationQuotation } from '@/lib/integration-runtime';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  return withIntegrationAuth({
    request,
    scope: 'quotations:read',
    handler: async ({ requestId, organizationId }) => {
      const { searchParams } = request.nextUrl;
      const page = Number(searchParams.get('page') ?? 1);
      const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100);
      const search = searchParams.get('search') ?? undefined;
      const status = searchParams.get('status') ?? undefined;
      const skip = (page - 1) * limit;

      const where: Prisma.QuotationWhereInput = {
        organizationId,
        ...(status ? { status: { equals: status as QuotationStatus } } : {}),
        ...(search
          ? {
              OR: [
                { number: { contains: search, mode: 'insensitive' } },
                { notes: { contains: search, mode: 'insensitive' } },
                { client: { name: { contains: search, mode: 'insensitive' } } },
                { client: { company: { contains: search, mode: 'insensitive' } } }
              ]
            }
          : {})
      };

      const [items, total] = await Promise.all([
        prisma.quotation.findMany({
          where,
          include: {
            client: true,
            _count: { select: { items: true } },
            items: { include: { product: true } }
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip,
          take: limit
        }),
        prisma.quotation.count({ where })
      ]);

      return integrationSuccess(requestId, {
        items: items.map(mapQuotationRecord),
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
    scope: 'quotations:write',
    handler: async ({ requestId, organizationId }) => {
      const body = (await request.json().catch(() => null)) as {
        number?: string | null;
        clientId?: number;
        serviceIds?: number[];
        status?: QuotationStatus;
        total?: number;
        validUntil?: string | null;
        notes?: string | null;
        itemsCount?: number;
      } | null;

      if (!body?.clientId || !Number.isInteger(body.clientId)) {
        return integrationError(
          requestId,
          'INVALID_QUOTATION_PAYLOAD',
          'clientId is required',
          400
        );
      }

      const created = await createIntegrationQuotation(
        {
          number: body.number ?? null,
          clientId: body.clientId,
          serviceIds: body.serviceIds ?? [],
          status: body.status ?? 'DRAFT',
          total: body.total ?? 0,
          validUntil: body.validUntil ?? null,
          notes: body.notes ?? null,
          itemsCount: body.itemsCount ?? Math.max(body.serviceIds?.length ?? 1, 1)
        },
        organizationId
      );

      return integrationSuccess(requestId, created, { status: 201 });
    }
  });
}
