import { NextRequest, NextResponse } from 'next/server';
import { mapConversationRecord, mapMessageRecord } from '@/lib/communications';
import { prisma } from '@/lib/prisma';
import { isPrismaTableMissingError } from '@/lib/prisma-errors';
import { buildOrganizationReadScope, getActiveOrganizationId } from '@/lib/workspace';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;

  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: Number(id),
        ...buildOrganizationReadScope(organizationId)
      },
      include: {
        client: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 200
        }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { message: `Conversation with ID ${id} not found` },
        { status: 404 }
      );
    }

    if (conversation.unreadCount > 0) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { unreadCount: 0 }
      });
      conversation.unreadCount = 0;
    }

    return NextResponse.json({
      conversation: mapConversationRecord(conversation),
      messages: conversation.messages.map(mapMessageRecord)
    });
  } catch (error) {
    if (isPrismaTableMissingError(error, 'Conversation')) {
      return NextResponse.json(
        { message: 'Communications schema has not been migrated yet.' },
        { status: 503 }
      );
    }

    throw error;
  }
}
