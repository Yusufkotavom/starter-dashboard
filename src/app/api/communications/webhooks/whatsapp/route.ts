import { NextRequest, NextResponse } from 'next/server';
import { normalizePhoneNumber } from '@/lib/phone';
import { isPrismaTableMissingError } from '@/lib/prisma-errors';
import {
  CommunicationChannel,
  ConversationStatus,
  MessageDirection,
  MessageStatus
} from '@/lib/prisma-client';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    organizationId?: string | null;
    phone?: string;
    displayName?: string | null;
    body?: string | null;
    externalThreadId?: string | null;
    externalMessageId?: string | null;
    direction?: 'INBOUND' | 'OUTBOUND';
    status?: 'PENDING' | 'RECEIVED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
    sentAt?: string | null;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
    documentUrl?: string | null;
  } | null;

  const phone = normalizePhoneNumber(body?.phone);
  const messageBody = body?.body?.trim() || '';

  if (!phone || !messageBody) {
    return NextResponse.json({ message: 'phone and body are required' }, { status: 400 });
  }

  try {
    const organizationId = body?.organizationId?.trim() || null;
    const matchedClient = await prisma.client.findFirst({
      where: {
        phone
      },
      select: {
        id: true
      }
    });

    const conversation = await prisma.conversation.upsert({
      where: {
        channel_phone: {
          channel: CommunicationChannel.WHATSAPP,
          phone
        }
      },
      create: {
        organizationId,
        channel: CommunicationChannel.WHATSAPP,
        phone,
        displayName: body?.displayName?.trim() || null,
        clientId: matchedClient?.id ?? null,
        externalThreadId: body?.externalThreadId?.trim() || null,
        status: ConversationStatus.OPEN,
        lastMessagePreview: messageBody,
        lastMessageAt: body?.sentAt ? new Date(body.sentAt) : new Date(),
        unreadCount: body?.direction === 'OUTBOUND' ? 0 : 1
      },
      update: {
        organizationId,
        displayName: body?.displayName?.trim() || undefined,
        clientId: matchedClient?.id ?? undefined,
        externalThreadId: body?.externalThreadId?.trim() || undefined,
        status: ConversationStatus.OPEN,
        lastMessagePreview: messageBody,
        lastMessageAt: body?.sentAt ? new Date(body.sentAt) : new Date(),
        unreadCount: body?.direction === 'OUTBOUND' ? undefined : { increment: 1 }
      }
    });

    const message = await prisma.messageLog.create({
      data: {
        organizationId,
        conversationId: conversation.id,
        clientId: conversation.clientId,
        channel: CommunicationChannel.WHATSAPP,
        direction:
          body?.direction === 'OUTBOUND' ? MessageDirection.OUTBOUND : MessageDirection.INBOUND,
        status: (body?.status as MessageStatus | undefined) ?? MessageStatus.RECEIVED,
        externalMessageId: body?.externalMessageId?.trim() || null,
        body: messageBody,
        attachmentUrl: body?.attachmentUrl?.trim() || null,
        attachmentName: body?.attachmentName?.trim() || null,
        documentUrl: body?.documentUrl?.trim() || null,
        sentAt: body?.sentAt ? new Date(body.sentAt) : new Date()
      }
    });

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      messageId: message.id
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
