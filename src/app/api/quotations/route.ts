import { NextRequest, NextResponse } from 'next/server';
import { Prisma, QuotationStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { buildQuotationOrderBy, mapQuotationRecord } from '@/lib/agency';
import { buildQuotationDocument } from '@/lib/agency-workflows';
import type { QuotationMutationPayload } from '@/features/quotations/api/types';

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
      include: {
        client: true,
        _count: { select: { items: true } },
        items: { include: { product: true } }
      },
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
    data: await buildQuotationDocument(prisma, body),
    include: {
      client: true,
      _count: { select: { items: true } },
      items: { include: { product: true } }
    }
  });

  return NextResponse.json(mapQuotationRecord(created), { status: 201 });
}
