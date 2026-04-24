import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { mapPaymentRecord } from '@/lib/agency';
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
    include: { invoice: { include: { client: true } } }
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
    const payment = await prisma.payment.update({
      where: { id: Number(id) },
      data: normalizePaymentPayload(body),
      include: { invoice: { include: { client: true } } }
    });

    return NextResponse.json(mapPaymentRecord(payment));
  } catch {
    return NextResponse.json({ message: `Payment with ID ${id} not found` }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    await prisma.payment.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: `Payment with ID ${id} not found` }, { status: 404 });
  }
}
