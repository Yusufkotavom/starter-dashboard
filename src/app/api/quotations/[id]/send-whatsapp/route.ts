import { NextRequest, NextResponse } from 'next/server';
import { mapMessageRecord } from '@/lib/communications';
import { buildDocumentUrl, createDocumentToken, getDocumentOrigin } from '@/lib/documents/shared';
import { getQuotationDocumentData } from '@/lib/documents/quotations';
import { isPrismaTableMissingError } from '@/lib/prisma-errors';
import {
  CommunicationChannel,
  ConversationStatus,
  MessageDirection,
  QuotationStatus
} from '@/lib/prisma-client';
import { prisma } from '@/lib/prisma';
import { renderQuotationWhatsAppMessage, sendWhatsAppMessage } from '@/lib/whatsapp';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const quotationId = Number(id);
  const quotation = await getQuotationDocumentData(prisma, quotationId);

  if (!quotation) {
    return NextResponse.json({ message: `Quotation with ID ${id} not found` }, { status: 404 });
  }

  if (!quotation.clientPhone) {
    return NextResponse.json(
      { message: 'Client phone is required before sending via WhatsApp' },
      { status: 400 }
    );
  }

  try {
    const quotationRecord = await prisma.quotation.findUnique({
      where: { id: quotation.id },
      select: {
        clientId: true,
        organizationId: true,
        status: true
      }
    });

    if (!quotationRecord) {
      return NextResponse.json({ message: `Quotation with ID ${id} not found` }, { status: 404 });
    }

    const origin = getDocumentOrigin(request);
    const documentToken = createDocumentToken('quotation', quotation.id);
    const documentUrl = buildDocumentUrl(origin, 'quotation', quotation.id, documentToken);
    const messageBody = renderQuotationWhatsAppMessage({
      number: quotation.number,
      clientName: quotation.clientName,
      company: quotation.clientCompany,
      total: quotation.total,
      validUntil: quotation.validUntil,
      documentUrl
    });

    const conversation = await prisma.conversation.upsert({
      where: {
        channel_phone: {
          channel: CommunicationChannel.WHATSAPP,
          phone: quotation.clientPhone
        }
      },
      create: {
        organizationId: quotationRecord.organizationId,
        channel: CommunicationChannel.WHATSAPP,
        phone: quotation.clientPhone,
        displayName: quotation.clientCompany || quotation.clientName,
        clientId: quotationRecord.clientId,
        status: ConversationStatus.OPEN,
        lastMessagePreview: messageBody,
        lastMessageAt: new Date()
      },
      update: {
        clientId: quotationRecord.clientId,
        displayName: quotation.clientCompany || quotation.clientName,
        status: ConversationStatus.OPEN,
        lastMessagePreview: messageBody,
        lastMessageAt: new Date()
      }
    });

    const result = await sendWhatsAppMessage({
      phone: quotation.clientPhone,
      body: messageBody,
      documentUrl,
      conversationId: conversation.id,
      externalThreadId: conversation.externalThreadId,
      metadata: {
        source: 'quotation-send',
        quotationId: quotation.id,
        quotationNumber: quotation.number
      }
    });

    const message = await prisma.messageLog.create({
      data: {
        organizationId: quotationRecord.organizationId,
        conversationId: conversation.id,
        clientId: quotationRecord.clientId,
        channel: CommunicationChannel.WHATSAPP,
        direction: MessageDirection.OUTBOUND,
        status: result.status,
        provider: result.provider,
        externalMessageId: result.id,
        body: messageBody,
        documentUrl,
        sentAt: new Date(),
        metadata: {
          source: 'quotation-send',
          quotationId: quotation.id,
          quotationNumber: quotation.number
        }
      }
    });

    const nextStatus =
      quotationRecord.status === QuotationStatus.DRAFT
        ? QuotationStatus.SENT
        : quotationRecord.status;
    if (nextStatus !== quotationRecord.status) {
      await prisma.quotation.update({
        where: { id: quotation.id },
        data: { status: nextStatus }
      });
    }

    return NextResponse.json({
      success: true,
      provider: result.provider,
      messageId: result.id,
      status: nextStatus,
      documentUrl,
      conversationId: conversation.id,
      message: mapMessageRecord(message)
    });
  } catch (error) {
    if (isPrismaTableMissingError(error, 'Conversation')) {
      return NextResponse.json(
        { message: 'Communications schema has not been migrated yet.' },
        { status: 503 }
      );
    }

    if (isPrismaTableMissingError(error, 'MessageLog')) {
      return NextResponse.json(
        { message: 'Communications schema has not been migrated yet.' },
        { status: 503 }
      );
    }

    throw error;
  }
}
