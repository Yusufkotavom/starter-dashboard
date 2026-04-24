import { NextRequest, NextResponse } from 'next/server';
import { buildInvoicePaymentLink, markInvoiceAsSent } from '@/lib/billing-workflows';
import { mapMessageRecord } from '@/lib/communications';
import { buildDocumentUrl, createDocumentToken, getDocumentOrigin } from '@/lib/documents/shared';
import { getInvoiceDocumentData } from '@/lib/documents/invoices';
import { CommunicationChannel, ConversationStatus, MessageDirection } from '@/lib/prisma-client';
import { prisma } from '@/lib/prisma';
import { renderInvoiceWhatsAppMessage, sendWhatsAppMessage } from '@/lib/whatsapp';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const invoiceId = Number(id);
  const invoice = await getInvoiceDocumentData(prisma, invoiceId);

  if (!invoice) {
    return NextResponse.json({ message: `Invoice with ID ${id} not found` }, { status: 404 });
  }

  if (!invoice.clientPhone) {
    return NextResponse.json(
      { message: 'Client phone is required before sending via WhatsApp' },
      { status: 400 }
    );
  }

  const invoiceRecord = await prisma.invoice.findUnique({
    where: { id: invoice.id },
    select: {
      clientId: true,
      organizationId: true
    }
  });

  if (!invoiceRecord) {
    return NextResponse.json({ message: `Invoice with ID ${id} not found` }, { status: 404 });
  }

  const origin = getDocumentOrigin(request);
  const documentToken = createDocumentToken('invoice', invoice.id);
  const documentUrl = buildDocumentUrl(origin, 'invoice', invoice.id, documentToken);
  const payment = await buildInvoicePaymentLink(origin, invoice.id);
  const messageBody = renderInvoiceWhatsAppMessage({
    number: invoice.number,
    clientName: invoice.clientName,
    company: invoice.clientCompany,
    total: invoice.total,
    balanceDue: invoice.balanceDue,
    dueDate: invoice.dueDate,
    documentUrl,
    paymentLink: payment.paymentLink
  });

  const conversation = await prisma.conversation.upsert({
    where: {
      channel_phone: {
        channel: CommunicationChannel.WHATSAPP,
        phone: invoice.clientPhone
      }
    },
    create: {
      organizationId: invoiceRecord.organizationId,
      channel: CommunicationChannel.WHATSAPP,
      phone: invoice.clientPhone,
      displayName: invoice.clientCompany || invoice.clientName,
      clientId: invoiceRecord.clientId,
      status: ConversationStatus.OPEN,
      lastMessagePreview: messageBody,
      lastMessageAt: new Date()
    },
    update: {
      clientId: invoiceRecord.clientId,
      displayName: invoice.clientCompany || invoice.clientName,
      status: ConversationStatus.OPEN,
      lastMessagePreview: messageBody,
      lastMessageAt: new Date()
    }
  });

  const result = await sendWhatsAppMessage({
    phone: invoice.clientPhone,
    body: messageBody,
    documentUrl,
    conversationId: conversation.id,
    externalThreadId: conversation.externalThreadId,
    metadata: {
      source: 'invoice-send',
      invoiceId: invoice.id,
      invoiceNumber: invoice.number
    }
  });

  const message = await prisma.messageLog.create({
    data: {
      organizationId: invoiceRecord.organizationId,
      conversationId: conversation.id,
      clientId: invoiceRecord.clientId,
      channel: CommunicationChannel.WHATSAPP,
      direction: MessageDirection.OUTBOUND,
      status: result.status,
      provider: result.provider,
      externalMessageId: result.id,
      body: messageBody,
      documentUrl,
      sentAt: new Date(),
      metadata: {
        source: 'invoice-send',
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        paymentLink: payment.paymentLink
      }
    }
  });

  const statusResult = await markInvoiceAsSent(prisma, invoice.id);

  return NextResponse.json({
    success: true,
    provider: result.provider,
    messageId: result.id,
    status: statusResult.status,
    documentUrl,
    paymentLink: payment.paymentLink,
    conversationId: conversation.id,
    message: mapMessageRecord(message)
  });
}
