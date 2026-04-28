import { NextRequest } from 'next/server';
import { InvoiceStatus } from '@prisma/client';
import { mapInvoiceRecord } from '@/lib/agency';
import { buildInvoiceDocument } from '@/lib/agency-workflows';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { invalidIdResponse, parseIdParam } from '@/lib/integration-v1';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'invoices:read',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const invoiceId = parseIdParam(id);
      if (!invoiceId) return invalidIdResponse(requestId);

      const item = await prisma.invoice.findFirst({
        where: { id: invoiceId, organizationId },
        include: { client: true, project: true, payments: { select: { amount: true } } }
      });

      if (!item) {
        return integrationError(requestId, 'INVOICE_NOT_FOUND', `Invoice ${id} not found`, 404);
      }

      return integrationSuccess(requestId, mapInvoiceRecord(item));
    }
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'invoices:write',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const invoiceId = parseIdParam(id);
      if (!invoiceId) return invalidIdResponse(requestId);

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

      const existing = await prisma.invoice.findFirst({
        where: { id: invoiceId, organizationId },
        select: { id: true, number: true }
      });
      if (!existing) {
        return integrationError(requestId, 'INVOICE_NOT_FOUND', `Invoice ${id} not found`, 404);
      }

      const updated = await prisma.invoice.update({
        where: { id: existing.id },
        data: await buildInvoiceDocument(
          prisma,
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
          existing.number,
          organizationId
        ),
        include: { client: true, project: true, payments: { select: { amount: true } } }
      });

      return integrationSuccess(requestId, mapInvoiceRecord(updated));
    }
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'invoices:write',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const invoiceId = parseIdParam(id);
      if (!invoiceId) return invalidIdResponse(requestId);

      const existing = await prisma.invoice.findFirst({
        where: { id: invoiceId, organizationId },
        select: { id: true }
      });
      if (!existing) {
        return integrationError(requestId, 'INVOICE_NOT_FOUND', `Invoice ${id} not found`, 404);
      }

      await prisma.invoice.delete({ where: { id: existing.id } });
      return integrationSuccess(requestId, { success: true });
    }
  });
}
