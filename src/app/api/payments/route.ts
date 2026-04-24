import { NextRequest, NextResponse } from 'next/server';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { buildPaymentOrderBy, mapPaymentRecord } from '@/lib/agency';
import type { PaymentMutationPayload } from '@/features/payments/api/types';

function normalizePaymentPayload(body: PaymentMutationPayload): Prisma.PaymentUncheckedCreateInput {
  return {
    invoiceId: body.invoiceId,
    amount: new Prisma.Decimal(body.amount),
    method: body.method,
    reference: body.reference?.trim() || null,
    paidAt: new Date(body.paidAt),
    notes: body.notes?.trim() || null
  };
}

async function syncInvoicePaymentState(
  tx: Prisma.TransactionClient,
  invoiceId: number
): Promise<void> {
  const invoice = await tx.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: { select: { amount: true, paidAt: true } } }
  });

  if (!invoice) return;

  const paidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const total = Number(invoice.total);
  const latestPaidAt =
    invoice.payments.length > 0
      ? invoice.payments
          .map((payment) => payment.paidAt)
          .toSorted((a, b) => b.getTime() - a.getTime())[0]
      : null;
  const isOverdue = !!invoice.dueDate && invoice.dueDate.getTime() < Date.now();

  let status: InvoiceStatus = invoice.status;
  if (invoice.status !== InvoiceStatus.CANCELLED) {
    if (paidAmount >= total && total > 0) {
      status = InvoiceStatus.PAID;
    } else if (paidAmount > 0) {
      status = InvoiceStatus.PARTIAL;
    } else if (isOverdue) {
      status = InvoiceStatus.OVERDUE;
    } else if (
      invoice.status === InvoiceStatus.PAID ||
      invoice.status === InvoiceStatus.PARTIAL ||
      invoice.status === InvoiceStatus.OVERDUE
    ) {
      status = InvoiceStatus.SENT;
    }
  }

  await tx.invoice.update({
    where: { id: invoiceId },
    data: {
      status,
      paidAt: status === InvoiceStatus.PAID ? latestPaidAt : null
    }
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 10);
  const search = searchParams.get('search') ?? undefined;
  const sort = searchParams.get('sort') ?? undefined;
  const skip = (page - 1) * limit;

  const where: Prisma.PaymentWhereInput = search
    ? {
        OR: [
          { method: { contains: search, mode: 'insensitive' } },
          { reference: { contains: search, mode: 'insensitive' } },
          { invoice: { number: { contains: search, mode: 'insensitive' } } },
          { invoice: { client: { name: { contains: search, mode: 'insensitive' } } } }
        ]
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { invoice: { include: { client: true, payments: { select: { amount: true } } } } },
      orderBy: buildPaymentOrderBy(sort),
      skip,
      take: limit
    }),
    prisma.payment.count({ where })
  ]);

  return NextResponse.json({
    items: items.map(mapPaymentRecord),
    total_items: total
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as PaymentMutationPayload;
  const created = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: normalizePaymentPayload(body)
    });

    await syncInvoicePaymentState(tx, body.invoiceId);

    return tx.payment.findUniqueOrThrow({
      where: { id: payment.id },
      include: { invoice: { include: { client: true, payments: { select: { amount: true } } } } }
    });
  });

  return NextResponse.json(mapPaymentRecord(created), { status: 201 });
}
