import { NextRequest, NextResponse } from 'next/server';
import { QuotationStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { renderQuotationEmail, sendMail } from '@/lib/mailer';

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const quotation = await prisma.quotation.findUnique({
    where: { id: Number(id) },
    include: {
      client: true,
      items: {
        include: { product: true }
      }
    }
  });

  if (!quotation) {
    return NextResponse.json({ message: `Quotation with ID ${id} not found` }, { status: 404 });
  }

  const services = quotation.items
    .map((item) => item.product?.name ?? item.description)
    .filter(Boolean);

  const mail = renderQuotationEmail({
    number: quotation.number,
    clientName: quotation.client.name,
    company: quotation.client.company,
    total: Number(quotation.total),
    validUntil: quotation.validUntil?.toISOString() ?? null,
    notes: quotation.notes,
    services
  });

  const result = await sendMail({
    ...mail,
    to: quotation.client.email
  });

  const nextStatus =
    quotation.status === QuotationStatus.DRAFT ? QuotationStatus.SENT : quotation.status;
  if (nextStatus !== quotation.status) {
    await prisma.quotation.update({
      where: { id: quotation.id },
      data: { status: nextStatus }
    });
  }

  return NextResponse.json({
    success: true,
    provider: result.provider,
    messageId: result.id,
    status: nextStatus
  });
}
