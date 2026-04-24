import { Prisma } from '@/lib/prisma-client';

type ConversationRecord = Prisma.ConversationGetPayload<{
  include: {
    client: true;
  };
}>;

type MessageRecord = Prisma.MessageLogGetPayload<Record<string, never>>;

export interface ConversationSummary {
  id: number;
  phone: string;
  displayName: string | null;
  clientId: number | null;
  clientName: string | null;
  clientCompany: string | null;
  status: string;
  unreadCount: number;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: number;
  conversationId: number;
  clientId: number | null;
  channel: string;
  direction: string;
  status: string;
  provider: string | null;
  externalMessageId: string | null;
  body: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  documentUrl: string | null;
  metadata: Prisma.JsonValue | null;
  sentAt: string | null;
  createdAt: string;
}

export function mapConversationRecord(record: ConversationRecord): ConversationSummary {
  return {
    id: record.id,
    phone: record.phone,
    displayName: record.displayName,
    clientId: record.clientId,
    clientName: record.client?.name ?? null,
    clientCompany: record.client?.company ?? null,
    status: record.status,
    unreadCount: record.unreadCount,
    lastMessagePreview: record.lastMessagePreview,
    lastMessageAt: record.lastMessageAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export function mapMessageRecord(record: MessageRecord): ConversationMessage {
  return {
    id: record.id,
    conversationId: record.conversationId,
    clientId: record.clientId,
    channel: record.channel,
    direction: record.direction,
    status: record.status,
    provider: record.provider,
    externalMessageId: record.externalMessageId,
    body: record.body,
    attachmentUrl: record.attachmentUrl,
    attachmentName: record.attachmentName,
    documentUrl: record.documentUrl,
    metadata: record.metadata,
    sentAt: record.sentAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString()
  };
}
