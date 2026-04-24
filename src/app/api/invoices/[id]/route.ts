import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapInvoiceRecord } from '@/lib/agency';
import { buildInvoiceDocument } from '@/lib/agency-workflows';
import type { InvoiceMutationPayload } from '@/features/invoices/api/types';
import { buildOrganizationReadScope, getActiveOrganizationId } from '@/lib/workspace';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: Number(id),
      ...buildOrganizationReadScope(organizationId)
    },
    include: { client: true, project: true, payments: { select: { amount: true } } }
  });

  if (!invoice) {
    return NextResponse.json({ message: `Invoice with ID ${id} not found` }, { status: 404 });
  }

  return NextResponse.json(mapInvoiceRecord(invoice));
}

export async function PUT(request: NextRequest, { params }: Params) {
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;
  const body = (await request.json()) as InvoiceMutationPayload;

  try {
    const existing = await prisma.invoice.findFirst({
      where: {
        id: Number(id),
        ...buildOrganizationReadScope(organizationId)
      },
      select: { number: true }
    });
    if (!existing) {
      return NextResponse.json({ message: `Invoice with ID ${id} not found` }, { status: 404 });
    }

    const invoice = await prisma.invoice.update({
      where: { id: Number(id) },
      data: await buildInvoiceDocument(prisma, body, existing.number, organizationId),
      include: { client: true, project: true, payments: { select: { amount: true } } }
    });

    return NextResponse.json(mapInvoiceRecord(invoice));
  } catch {
    return NextResponse.json({ message: `Invoice with ID ${id} not found` }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;

  try {
    const existing = await prisma.invoice.findFirst({
      where: {
        id: Number(id),
        ...buildOrganizationReadScope(organizationId)
      },
      select: { id: true }
    });
    if (!existing) {
      return NextResponse.json({ message: `Invoice with ID ${id} not found` }, { status: 404 });
    }
    await prisma.invoice.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: `Invoice with ID ${id} not found` }, { status: 404 });
  }
}
