import { NextRequest, NextResponse } from 'next/server';
import { Prisma, QuotationStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { buildQuotationOrderBy, mapQuotationRecord } from '@/lib/agency';
import type { QuotationMutationPayload } from '@/features/quotations/api/types';

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

function normalizeQuotationPayload(
  body: QuotationMutationPayload
): Prisma.QuotationUncheckedCreateInput {
  return {
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
      create: buildQuotationItems(body.total, body.itemsCount)
    }
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 10);
  const search = searchParams.get('search') ?? undefined;
  const status = searchParams.get('status') ?? undefined;
  const sort = searchParams.get('sort') ?? undefined;
  const skip = (page - 1) * limit;

  const where: Prisma.QuotationWhereInput = {
    ...(status ? { status: { equals: status as QuotationStatus } } : {}),
    ...(search
      ? {
          OR: [
            { number: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } },
            { client: { name: { contains: search, mode: 'insensitive' } } },
            { client: { company: { contains: search, mode: 'insensitive' } } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.quotation.findMany({
      where,
      include: { client: true, _count: { select: { items: true } } },
      orderBy: buildQuotationOrderBy(sort),
      skip,
      take: limit
    }),
    prisma.quotation.count({ where })
  ]);

  return NextResponse.json({
    items: items.map(mapQuotationRecord),
    total_items: total
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as QuotationMutationPayload;
  const created = await prisma.quotation.create({
    data: normalizeQuotationPayload(body),
    include: { client: true, _count: { select: { items: true } } }
  });

  return NextResponse.json(mapQuotationRecord(created), { status: 201 });
}
