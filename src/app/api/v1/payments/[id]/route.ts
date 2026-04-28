import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { mapPaymentRecord } from '@/lib/agency';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { invalidIdResponse, parseIdParam } from '@/lib/integration-v1';
import { syncInvoicePaymentState } from '@/lib/payment-workflows';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'payments:read',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const paymentId = parseIdParam(id);
      if (!paymentId) return invalidIdResponse(requestId);

      const item = await prisma.payment.findFirst({
        where: { id: paymentId, organizationId },
        include: { invoice: { include: { client: true, payments: { select: { amount: true } } } } }
      });

      if (!item) {
        return integrationError(requestId, 'PAYMENT_NOT_FOUND', `Payment ${id} not found`, 404);
      }

      return integrationSuccess(requestId, mapPaymentRecord(item));
    }
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'payments:write',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const paymentId = parseIdParam(id);
      if (!paymentId) return invalidIdResponse(requestId);

      const body = (await request.json().catch(() => null)) as {
        invoiceId?: number;
        amount?: number;
        method?: string;
        reference?: string | null;
        paidAt?: string;
        notes?: string | null;
      } | null;

      if (!body?.invoiceId || !Number.isInteger(body.invoiceId) || !body?.paidAt) {
        return integrationError(
          requestId,
          'INVALID_PAYMENT_PAYLOAD',
          'invoiceId and paidAt are required',
          400
        );
      }

      const targetInvoiceId = body.invoiceId;
      const targetPaidAt = body.paidAt;

      try {
        const item = await prisma.$transaction(async (tx) => {
          const existing = await tx.payment.findFirst({
            where: { id: paymentId, organizationId }
          });

          if (!existing) {
            throw new Error('NOT_FOUND');
          }

          const updated = await tx.payment.update({
            where: { id: existing.id },
            data: {
              organizationId,
              invoiceId: body.invoiceId,
              amount: new Prisma.Decimal(body.amount ?? 0),
              method: body.method?.trim() || 'BANK_TRANSFER',
              reference: body.reference?.trim() || null,
              paidAt: new Date(targetPaidAt),
              notes: body.notes?.trim() || null
            }
          });

          await syncInvoicePaymentState(tx, existing.invoiceId);
          if (existing.invoiceId !== targetInvoiceId) {
            await syncInvoicePaymentState(tx, targetInvoiceId);
          }

          return tx.payment.findUniqueOrThrow({
            where: { id: updated.id },
            include: {
              invoice: { include: { client: true, payments: { select: { amount: true } } } }
            }
          });
        });

        return integrationSuccess(requestId, mapPaymentRecord(item));
      } catch {
        return integrationError(requestId, 'PAYMENT_NOT_FOUND', `Payment ${id} not found`, 404);
      }
    }
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return withIntegrationAuth({
    request,
    scope: 'payments:write',
    handler: async ({ requestId, organizationId }) => {
      const { id } = await params;
      const paymentId = parseIdParam(id);
      if (!paymentId) return invalidIdResponse(requestId);

      try {
        await prisma.$transaction(async (tx) => {
          const existing = await tx.payment.findFirst({
            where: { id: paymentId, organizationId }
          });

          if (!existing) {
            throw new Error('NOT_FOUND');
          }

          await tx.payment.delete({ where: { id: existing.id } });
          await syncInvoicePaymentState(tx, existing.invoiceId);
        });
      } catch {
        return integrationError(requestId, 'PAYMENT_NOT_FOUND', `Payment ${id} not found`, 404);
      }

      return integrationSuccess(requestId, { success: true });
    }
  });
}
