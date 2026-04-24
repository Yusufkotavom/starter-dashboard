import { NextResponse } from 'next/server';
import { QuotationStatus } from '@prisma/client';
import {
  appendPortalNote,
  formatPortalDateTime,
  getPortalClientOrThrow
} from '@/lib/customer-portal';
import { prisma } from '@/lib/prisma';

interface PortalQuotationApprovalRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: Request, { params }: PortalQuotationApprovalRouteProps) {
  const { id } = await params;
  const quotationId = Number(id);

  if (!Number.isInteger(quotationId) || quotationId <= 0) {
    return NextResponse.json({ message: 'Invalid quotation id' }, { status: 400 });
  }

  const { client, email } = await getPortalClientOrThrow();
  const body = (await request.json().catch(() => null)) as { notes?: string } | null;
  const notes = body?.notes?.trim();

  const quotation = await prisma.quotation.findFirst({
    where: {
      id: quotationId,
      clientId: client.id
    }
  });

  if (!quotation) {
    return NextResponse.json({ message: 'Quotation not found' }, { status: 404 });
  }

  if (
    quotation.status === QuotationStatus.REJECTED ||
    quotation.status === QuotationStatus.EXPIRED
  ) {
    return NextResponse.json(
      { message: 'This quotation can no longer be approved from the portal' },
      { status: 409 }
    );
  }

  const auditNote = [
    `[Portal approval submitted ${formatPortalDateTime(new Date())}]`,
    `Customer email: ${email}`,
    notes ? `Customer note: ${notes}` : null
  ]
    .filter(Boolean)
    .join('\n');

  await prisma.quotation.update({
    where: { id: quotation.id },
    data: {
      status: QuotationStatus.APPROVED,
      notes: appendPortalNote(quotation.notes, auditNote)
    }
  });

  return NextResponse.json({
    message: 'Quotation approval was submitted successfully'
  });
}
