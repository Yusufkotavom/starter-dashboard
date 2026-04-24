import { NextRequest, NextResponse } from 'next/server';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { buildInvoiceOrderBy, mapInvoiceRecord } from '@/lib/agency';
import type { InvoiceMutationPayload } from '@/features/invoices/api/types';

function normalizeInvoicePayload(body: InvoiceMutationPayload): Prisma.InvoiceUncheckedCreateInput {
  return {
    number: body.number.trim(),
    clientId: body.clientId,
    projectId: body.projectId ?? null,
    status: body.status,
    subtotal: new Prisma.Decimal(body.total),
    tax: new Prisma.Decimal(0),
    total: new Prisma.Decimal(body.total),
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
    paidAt: body.paidAt ? new Date(body.paidAt) : null,
    notes: body.notes?.trim() || null
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

  const where: Prisma.InvoiceWhereInput = {
    ...(status ? { status: { equals: status as InvoiceStatus } } : {}),
    ...(search
      ? {
          OR: [
            { number: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } },
            { client: { name: { contains: search, mode: 'insensitive' } } },
            { project: { name: { contains: search, mode: 'insensitive' } } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: { client: true, project: true },
      orderBy: buildInvoiceOrderBy(sort),
      skip,
      take: limit
    }),
    prisma.invoice.count({ where })
  ]);

  return NextResponse.json({
    items: items.map(mapInvoiceRecord),
    total_items: total
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as InvoiceMutationPayload;
  const created = await prisma.invoice.create({
    data: normalizeInvoicePayload(body),
    include: { client: true, project: true }
  });

  return NextResponse.json(mapInvoiceRecord(created), { status: 201 });
}
