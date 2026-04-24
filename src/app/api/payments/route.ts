import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
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
      include: { invoice: { include: { client: true } } },
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
  const created = await prisma.payment.create({
    data: normalizePaymentPayload(body),
    include: { invoice: { include: { client: true } } }
  });

  return NextResponse.json(mapPaymentRecord(created), { status: 201 });
}
