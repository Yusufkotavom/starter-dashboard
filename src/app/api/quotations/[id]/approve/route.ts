import { NextResponse } from 'next/server';
import { approveQuotationAndCreateInvoice } from '@/lib/billing-workflows';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const quotationId = Number(id);

  if (!Number.isInteger(quotationId) || quotationId <= 0) {
    return NextResponse.json({ message: 'Invalid quotation id' }, { status: 400 });
  }

  try {
    const result = await approveQuotationAndCreateInvoice(prisma, quotationId);

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'QUOTATION_NOT_FOUND') {
        return NextResponse.json({ message: 'Quotation not found' }, { status: 404 });
      }

      if (error.message === 'QUOTATION_NOT_APPROVABLE') {
        return NextResponse.json(
          { message: 'Rejected or expired quotations cannot be approved' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json({ message: 'Failed to approve quotation' }, { status: 500 });
  }
}
