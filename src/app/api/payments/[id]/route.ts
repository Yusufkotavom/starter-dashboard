import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { mapPaymentRecord } from '@/lib/agency';
import { syncInvoicePaymentState } from '@/lib/payment-workflows';
import type { PaymentMutationPayload } from '@/features/payments/api/types';

type Params = { params: Promise<{ id: string }> };

function normalizePaymentPayload(body: PaymentMutationPayload): Prisma.PaymentUncheckedUpdateInput {
  return {
    invoiceId: body.invoiceId,
    amount: new Prisma.Decimal(body.amount),
    method: body.method,
    reference: body.reference?.trim() || null,
    paidAt: new Date(body.paidAt),
    notes: body.notes?.trim() || null
  };
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id: Number(id) },
    include: { invoice: { include: { client: true, payments: { select: { amount: true } } } } }
  });

  if (!payment) {
    return NextResponse.json({ message: `Payment with ID ${id} not found` }, { status: 404 });
  }

  return NextResponse.json(mapPaymentRecord(payment));
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as PaymentMutationPayload;

  try {
    const payment = await prisma.$transaction(async (tx) => {
      const existing = await tx.payment.findUnique({ where: { id: Number(id) } });
      if (!existing) {
        throw new Error('NOT_FOUND');
      }

      const updated = await tx.payment.update({
        where: { id: Number(id) },
        data: normalizePaymentPayload(body)
      });

      await syncInvoicePaymentState(tx, existing.invoiceId);
      if (existing.invoiceId !== body.invoiceId) {
        await syncInvoicePaymentState(tx, body.invoiceId);
      }

      return tx.payment.findUniqueOrThrow({
        where: { id: updated.id },
        include: { invoice: { include: { client: true, payments: { select: { amount: true } } } } }
      });
    });

    return NextResponse.json(mapPaymentRecord(payment));
  } catch {
    return NextResponse.json({ message: `Payment with ID ${id} not found` }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: Number(id) } });
      if (!payment) {
        throw new Error('NOT_FOUND');
      }

      await tx.payment.delete({ where: { id: Number(id) } });
      await syncInvoicePaymentState(tx, payment.invoiceId);
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: `Payment with ID ${id} not found` }, { status: 404 });
  }
}
