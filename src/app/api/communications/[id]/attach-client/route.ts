import { NextRequest, NextResponse } from 'next/server';
import { mapConversationRecord } from '@/lib/communications';
import { prisma } from '@/lib/prisma';
import { buildOrganizationReadScope, getActiveOrganizationId } from '@/lib/workspace';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const organizationId = await getActiveOrganizationId();
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { clientId?: number } | null;
  const clientId = Number(body?.clientId ?? 0);

  if (!Number.isInteger(clientId) || clientId <= 0) {
    return NextResponse.json({ message: 'Invalid client selection' }, { status: 400 });
  }

  const [conversation, client] = await Promise.all([
    prisma.conversation.findFirst({
      where: {
        id: Number(id),
        ...buildOrganizationReadScope(organizationId)
      },
      select: { id: true }
    }),
    prisma.client.findFirst({
      where: {
        id: clientId,
        ...buildOrganizationReadScope(organizationId)
      },
      select: { id: true }
    })
  ]);

  if (!conversation) {
    return NextResponse.json({ message: `Conversation with ID ${id} not found` }, { status: 404 });
  }

  if (!client) {
    return NextResponse.json({ message: `Client with ID ${clientId} not found` }, { status: 404 });
  }

  const updated = await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      clientId: client.id
    },
    include: {
      client: true
    }
  });

  await prisma.messageLog.updateMany({
    where: {
      conversationId: updated.id
    },
    data: {
      clientId: client.id
    }
  });

  return NextResponse.json({
    success: true,
    conversation: mapConversationRecord(updated)
  });
}
