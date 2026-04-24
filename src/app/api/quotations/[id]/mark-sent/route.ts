import { NextResponse } from 'next/server';
import { QuotationStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const quotationId = Number(id);

  if (!Number.isInteger(quotationId) || quotationId <= 0) {
    return NextResponse.json({ message: 'Invalid quotation id' }, { status: 400 });
  }

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    select: { id: true, status: true }
  });

  if (!quotation) {
    return NextResponse.json({ message: 'Quotation not found' }, { status: 404 });
  }

  const status =
    quotation.status === QuotationStatus.DRAFT ? QuotationStatus.SENT : quotation.status;

  if (status !== quotation.status) {
    await prisma.quotation.update({
      where: { id: quotation.id },
      data: { status }
    });
  }

  return NextResponse.json({
    success: true,
    quotationId: quotation.id,
    status
  });
}
