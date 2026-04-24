import { NextRequest, NextResponse } from 'next/server';
import { mapConversationRecord } from '@/lib/communications';
import { ConversationStatus, Prisma } from '@/lib/prisma-client';
import { prisma } from '@/lib/prisma';
import { buildOrganizationReadScope, getActiveOrganizationId } from '@/lib/workspace';

export async function GET(request: NextRequest) {
  const organizationId = await getActiveOrganizationId();
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 20);
  const search = searchParams.get('search') ?? undefined;
  const status = searchParams.get('status') ?? undefined;
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  const skip = (page - 1) * limit;

  const where: Prisma.ConversationWhereInput = {
    AND: [
      buildOrganizationReadScope(organizationId),
      ...(status ? [{ status: status as ConversationStatus }] : []),
      ...(unreadOnly ? [{ unreadCount: { gt: 0 } }] : []),
      ...(search
        ? [
            {
              OR: [
                { phone: { contains: search, mode: Prisma.QueryMode.insensitive } },
                { displayName: { contains: search, mode: Prisma.QueryMode.insensitive } },
                { client: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } },
                { client: { company: { contains: search, mode: Prisma.QueryMode.insensitive } } }
              ]
            }
          ]
        : [])
    ]
  };

  const [items, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      include: {
        client: true
      },
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
      skip,
      take: limit
    }),
    prisma.conversation.count({ where })
  ]);

  return NextResponse.json({
    items: items.map(mapConversationRecord),
    total_items: total,
    page,
    per_page: limit,
    total_pages: Math.max(Math.ceil(total / limit), 1)
  });
}
