import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapQuotationRecord } from '@/lib/agency';
import { buildQuotationDocument } from '@/lib/agency-workflows';
import type { QuotationMutationPayload } from '@/features/quotations/api/types';
import { buildOrganizationReadScope, getActiveOrganizationId } from '@/lib/workspace';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;
  const quotation = await prisma.quotation.findFirst({
    where: {
      id: Number(id),
      ...buildOrganizationReadScope(organizationId)
    },
    include: {
      client: true,
      _count: { select: { items: true } },
      items: { include: { product: true } }
    }
  });

  if (!quotation) {
    return NextResponse.json({ message: `Quotation with ID ${id} not found` }, { status: 404 });
  }

  return NextResponse.json(mapQuotationRecord(quotation));
}

export async function PUT(request: NextRequest, { params }: Params) {
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;
  const body = (await request.json()) as QuotationMutationPayload;

  try {
    const existing = await prisma.quotation.findFirst({
      where: {
        id: Number(id),
        ...buildOrganizationReadScope(organizationId)
      },
      select: { number: true }
    });
    if (!existing) {
      return NextResponse.json({ message: `Quotation with ID ${id} not found` }, { status: 404 });
    }
    const payload = await buildQuotationDocument(prisma, body, existing.number, organizationId);

    const quotation = await prisma.quotation.update({
      where: { id: Number(id) },
      data: {
        ...payload,
        items: {
          deleteMany: {},
          create: payload.items?.create ?? []
        }
      },
      include: {
        client: true,
        _count: { select: { items: true } },
        items: { include: { product: true } }
      }
    });

    return NextResponse.json(mapQuotationRecord(quotation));
  } catch {
    return NextResponse.json({ message: `Quotation with ID ${id} not found` }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;

  try {
    const existing = await prisma.quotation.findFirst({
      where: {
        id: Number(id),
        ...buildOrganizationReadScope(organizationId)
      },
      select: { id: true }
    });
    if (!existing) {
      return NextResponse.json({ message: `Quotation with ID ${id} not found` }, { status: 404 });
    }
    await prisma.quotation.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: `Quotation with ID ${id} not found` }, { status: 404 });
  }
}
