import { NextRequest, NextResponse } from 'next/server';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { buildInvoiceOrderBy, mapInvoiceRecord } from '@/lib/agency';
import { buildInvoiceDocument, isDocumentNumberConflict } from '@/lib/agency-workflows';
import type { InvoiceMutationPayload } from '@/features/invoices/api/types';
import { buildOrganizationReadScope, getActiveOrganizationId } from '@/lib/workspace';

export async function GET(request: NextRequest) {
  const organizationId = await getActiveOrganizationId();
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 10);
  const search = searchParams.get('search') ?? undefined;
  const status = searchParams.get('status') ?? undefined;
  const sort = searchParams.get('sort') ?? undefined;
  const skip = (page - 1) * limit;

  const where: Prisma.InvoiceWhereInput = {
    ...buildOrganizationReadScope(organizationId),
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
      include: { client: true, project: true, payments: { select: { amount: true } } },
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
  const organizationId = await getActiveOrganizationId();
  const body = (await request.json()) as InvoiceMutationPayload;
  let created: Prisma.InvoiceGetPayload<{
    include: { client: true; project: true; payments: { select: { amount: true } } };
  }> | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      created = await prisma.invoice.create({
        data: await buildInvoiceDocument(prisma, body, undefined, organizationId),
        include: { client: true, project: true, payments: { select: { amount: true } } }
      });
      break;
    } catch (error) {
      if (!isDocumentNumberConflict(error) || attempt === 4) {
        throw error;
      }
    }
  }

  if (!created) {
    return NextResponse.json({ message: 'Failed to create invoice' }, { status: 500 });
  }

  return NextResponse.json(mapInvoiceRecord(created), { status: 201 });
}
