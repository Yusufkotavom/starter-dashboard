import { NextRequest } from 'next/server';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { mapInvoiceRecord } from '@/lib/agency';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { createIntegrationInvoice } from '@/lib/integration-runtime';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  return withIntegrationAuth({
    request,
    scope: 'invoices:read',
    handler: async ({ requestId, organizationId }) => {
      const { searchParams } = request.nextUrl;
      const page = Number(searchParams.get('page') ?? 1);
      const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100);
      const search = searchParams.get('search') ?? undefined;
      const status = searchParams.get('status') ?? undefined;
      const skip = (page - 1) * limit;

      const where: Prisma.InvoiceWhereInput = {
        organizationId,
        ...(status ? { status: { equals: status as InvoiceStatus } } : {}),
        ...(search
          ? {
              OR: [
                { number: { contains: search, mode: 'insensitive' } },
                { notes: { contains: search, mode: 'insensitive' } },
                { client: { name: { contains: search, mode: 'insensitive' } } },
                { project: { name: { contains: search, mode: 'insensitive' } } }
              ]
            }
          : {})
      };

      const [items, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          include: { client: true, project: true, payments: { select: { amount: true } } },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip,
          take: limit
        }),
        prisma.invoice.count({ where })
      ]);

      return integrationSuccess(requestId, {
        items: items.map(mapInvoiceRecord),
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
    scope: 'invoices:write',
    handler: async ({ requestId, organizationId }) => {
      const body = (await request.json().catch(() => null)) as {
        number?: string | null;
        clientId?: number;
        projectId?: number | null;
        status?: InvoiceStatus;
        total?: number;
        dueDate?: string | null;
        paidAt?: string | null;
        notes?: string | null;
      } | null;

      if (!body?.clientId || !Number.isInteger(body.clientId)) {
        return integrationError(requestId, 'INVALID_INVOICE_PAYLOAD', 'clientId is required', 400);
      }

      const created = await createIntegrationInvoice(
        {
          number: body.number ?? null,
          clientId: body.clientId,
          projectId: body.projectId ?? null,
          status: body.status ?? 'DRAFT',
          total: body.total ?? 0,
          dueDate: body.dueDate ?? null,
          paidAt: body.paidAt ?? null,
          notes: body.notes ?? null
        },
        organizationId
      );

      return integrationSuccess(requestId, created, { status: 201 });
    }
  });
}
