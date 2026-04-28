import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { mapPaymentRecord } from '@/lib/agency';
import { integrationError, integrationSuccess, withIntegrationAuth } from '@/lib/integration-api';
import { parsePageParams } from '@/lib/integration-v1';
import { syncInvoicePaymentState } from '@/lib/payment-workflows';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  return withIntegrationAuth({
    request,
    scope: 'payments:read',
    handler: async ({ requestId, organizationId }) => {
      const { searchParams } = request.nextUrl;
      const { page, limit, skip } = parsePageParams(searchParams);
      const search = searchParams.get('search') ?? undefined;

      const where: Prisma.PaymentWhereInput = {
        organizationId,
        ...(search
          ? {
              OR: [
                { method: { contains: search, mode: 'insensitive' } },
                { reference: { contains: search, mode: 'insensitive' } },
                { invoice: { number: { contains: search, mode: 'insensitive' } } }
              ]
            }
          : {})
      };

      const [items, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          include: {
            invoice: { include: { client: true, payments: { select: { amount: true } } } }
          },
          orderBy: [{ paidAt: 'desc' }, { id: 'desc' }],
          skip,
          take: limit
        }),
        prisma.payment.count({ where })
      ]);

      return integrationSuccess(requestId, {
        items: items.map(mapPaymentRecord),
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
    scope: 'payments:write',
    handler: async ({ requestId, organizationId }) => {
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

      const created = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.create({
          data: {
            organizationId,
            invoiceId: body.invoiceId as number,
            amount: new Prisma.Decimal(body.amount ?? 0),
            method: body.method?.trim() || 'BANK_TRANSFER',
            reference: body.reference?.trim() || null,
            paidAt: new Date(body.paidAt as string),
            notes: body.notes?.trim() || null
          }
        });

        await syncInvoicePaymentState(tx, body.invoiceId as number);

        return tx.payment.findUniqueOrThrow({
          where: { id: payment.id },
          include: {
            invoice: { include: { client: true, payments: { select: { amount: true } } } }
          }
        });
      });

      return integrationSuccess(requestId, mapPaymentRecord(created), { status: 201 });
    }
  });
}
