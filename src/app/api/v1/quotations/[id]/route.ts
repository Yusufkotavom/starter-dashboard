import { NextRequest } from 'next/server';
import { QuotationStatus } from '@prisma/client';
import { mapQuotationRecord } from '@/lib/agency';
import { buildQuotationDocument } from '@/lib/agency-workflows';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { invalidIdResponse, parseIdParam } from '@/lib/integration-v1';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'quotations:read',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const quotationId = parseIdParam(id);
      if (!quotationId) return invalidIdResponse(requestId);

      const item = await prisma.quotation.findFirst({
        where: { id: quotationId, organizationId },
        include: {
          client: true,
          _count: { select: { items: true } },
          items: { include: { product: true } }
        }
      });

      if (!item) {
        return integrationError(requestId, 'QUOTATION_NOT_FOUND', `Quotation ${id} not found`, 404);
      }

      return integrationSuccess(requestId, mapQuotationRecord(item));
    }
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'quotations:write',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const quotationId = parseIdParam(id);
      if (!quotationId) return invalidIdResponse(requestId);

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

      const existing = await prisma.quotation.findFirst({
        where: { id: quotationId, organizationId },
        select: { id: true, number: true }
      });
      if (!existing) {
        return integrationError(requestId, 'QUOTATION_NOT_FOUND', `Quotation ${id} not found`, 404);
      }

      const payload = await buildQuotationDocument(
        prisma,
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
        existing.number,
        organizationId
      );

      const updated = await prisma.quotation.update({
        where: { id: existing.id },
        data: {
          ...payload,
          items: {
            deleteMany: {},
            create: payload.items?.create ?? []
          }
        },
        include: {
          client: true,
          _count: { select: { items: true } },
          items: { include: { product: true } }
        }
      });

      return integrationSuccess(requestId, mapQuotationRecord(updated));
    }
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'quotations:write',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const quotationId = parseIdParam(id);
      if (!quotationId) return invalidIdResponse(requestId);

      const existing = await prisma.quotation.findFirst({
        where: { id: quotationId, organizationId },
        select: { id: true }
      });
      if (!existing) {
        return integrationError(requestId, 'QUOTATION_NOT_FOUND', `Quotation ${id} not found`, 404);
      }

      await prisma.quotation.delete({ where: { id: existing.id } });
      return integrationSuccess(requestId, { success: true });
    }
  });
}
