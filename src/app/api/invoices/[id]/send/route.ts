import { NextRequest, NextResponse } from 'next/server';
import { InvoiceStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { renderInvoiceEmail, sendMail } from '@/lib/mailer';

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id: Number(id) },
    include: {
      client: true,
      project: true,
      payments: { select: { amount: true } }
    }
  });

  if (!invoice) {
    return NextResponse.json({ message: `Invoice with ID ${id} not found` }, { status: 404 });
  }

  const paidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const balanceDue = Math.max(Number(invoice.total) - paidAmount, 0);

  const mail = renderInvoiceEmail({
    number: invoice.number,
    clientName: invoice.client.name,
    company: invoice.client.company,
    total: Number(invoice.total),
    paidAmount,
    balanceDue,
    dueDate: invoice.dueDate?.toISOString() ?? null,
    notes: invoice.notes,
    projectName: invoice.project?.name ?? null
  });

  const result = await sendMail({
    ...mail,
    to: invoice.client.email
  });

  const nextStatus = invoice.status === InvoiceStatus.DRAFT ? InvoiceStatus.SENT : invoice.status;
  if (nextStatus !== invoice.status) {
    await prisma.invoice.update({
      where: { id: invoice.id },
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
