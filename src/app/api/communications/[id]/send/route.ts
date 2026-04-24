import { NextRequest, NextResponse } from 'next/server';
import { mapMessageRecord } from '@/lib/communications';
import { MessageDirection } from '@/lib/prisma-client';
import { prisma } from '@/lib/prisma';
import { isPrismaTableMissingError } from '@/lib/prisma-errors';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { buildOrganizationReadScope, getActiveOrganizationId } from '@/lib/workspace';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    body?: string;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
    documentUrl?: string | null;
  } | null;

  const messageBody = body?.body?.trim();
  if (!messageBody) {
    return NextResponse.json({ message: 'Message body is required' }, { status: 400 });
  }

  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: Number(id),
        ...buildOrganizationReadScope(organizationId)
      },
      include: {
        client: true
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { message: `Conversation with ID ${id} not found` },
        { status: 404 }
      );
    }

    const result = await sendWhatsAppMessage({
      phone: conversation.phone,
      body: messageBody,
      attachmentUrl: body?.attachmentUrl ?? null,
      attachmentName: body?.attachmentName ?? null,
      documentUrl: body?.documentUrl ?? null,
      conversationId: conversation.id,
      externalThreadId: conversation.externalThreadId,
      metadata: {
        source: 'dashboard-thread'
      }
    });

    const message = await prisma.messageLog.create({
      data: {
        organizationId: conversation.organizationId,
        conversationId: conversation.id,
        clientId: conversation.clientId,
        channel: conversation.channel,
        direction: MessageDirection.OUTBOUND,
        status: result.status,
        provider: result.provider,
        externalMessageId: result.id,
        body: messageBody,
        attachmentUrl: body?.attachmentUrl ?? null,
        attachmentName: body?.attachmentName ?? null,
        documentUrl: body?.documentUrl ?? null,
        metadata: {
          source: 'dashboard-thread'
        },
        sentAt: new Date()
      }
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessagePreview: messageBody,
        lastMessageAt: message.sentAt ?? message.createdAt
      }
    });

    return NextResponse.json({
      success: true,
      provider: result.provider,
      messageId: result.id,
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
