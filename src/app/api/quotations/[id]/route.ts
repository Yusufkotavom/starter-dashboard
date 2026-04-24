import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { mapQuotationRecord } from '@/lib/agency';
import type { QuotationMutationPayload } from '@/features/quotations/api/types';

type Params = { params: Promise<{ id: string }> };

function buildQuotationItems(total: number, itemsCount: number) {
  const safeCount = Math.max(itemsCount, 1);
  const unitAmount = Number((total / safeCount).toFixed(2));

  return Array.from({ length: safeCount }, (_, index) => ({
    description: `Service line ${index + 1}`,
    qty: new Prisma.Decimal(1),
    unitPrice: new Prisma.Decimal(unitAmount),
    amount: new Prisma.Decimal(unitAmount)
  }));
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const quotation = await prisma.quotation.findUnique({
    where: { id: Number(id) },
    include: { client: true, _count: { select: { items: true } } }
  });

  if (!quotation) {
    return NextResponse.json({ message: `Quotation with ID ${id} not found` }, { status: 404 });
  }

  return NextResponse.json(mapQuotationRecord(quotation));
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as QuotationMutationPayload;

  try {
    const quotation = await prisma.quotation.update({
      where: { id: Number(id) },
      data: {
        number: body.number.trim(),
        clientId: body.clientId,
        status: body.status,
        subtotal: new Prisma.Decimal(body.total),
        tax: new Prisma.Decimal(0),
        discount: new Prisma.Decimal(0),
        total: new Prisma.Decimal(body.total),
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        notes: body.notes?.trim() || null,
        items: {
          deleteMany: {},
          create: buildQuotationItems(body.total, body.itemsCount)
        }
      },
      include: { client: true, _count: { select: { items: true } } }
    });

    return NextResponse.json(mapQuotationRecord(quotation));
  } catch {
    return NextResponse.json({ message: `Quotation with ID ${id} not found` }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    await prisma.quotation.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: `Quotation with ID ${id} not found` }, { status: 404 });
  }
}
