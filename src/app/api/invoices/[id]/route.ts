import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { mapInvoiceRecord } from '@/lib/agency';
import type { InvoiceMutationPayload } from '@/features/invoices/api/types';

type Params = { params: Promise<{ id: string }> };

function normalizeInvoicePayload(body: InvoiceMutationPayload): Prisma.InvoiceUncheckedUpdateInput {
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

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id: Number(id) },
    include: { client: true, project: true }
  });

  if (!invoice) {
    return NextResponse.json({ message: `Invoice with ID ${id} not found` }, { status: 404 });
  }

  return NextResponse.json(mapInvoiceRecord(invoice));
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as InvoiceMutationPayload;

  try {
    const invoice = await prisma.invoice.update({
      where: { id: Number(id) },
      data: normalizeInvoicePayload(body),
      include: { client: true, project: true }
    });

    return NextResponse.json(mapInvoiceRecord(invoice));
  } catch {
    return NextResponse.json({ message: `Invoice with ID ${id} not found` }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    await prisma.invoice.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: `Invoice with ID ${id} not found` }, { status: 404 });
  }
}
