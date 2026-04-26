import { Prisma } from '@prisma/client';
import {
  CommunicationChannel,
  ConversationStatus,
  MessageDirection,
  type PipelineJobStatus,
  type PipelineJobType
} from '@/lib/prisma-client';
import { mapClientRecord, mapInvoiceRecord, mapQuotationRecord } from '@/lib/agency';
import { mapConversationRecord, mapMessageRecord } from '@/lib/communications';
import type { ClientMutationPayload } from '@/features/clients/api/types';
import type { InvoiceMutationPayload } from '@/features/invoices/api/types';
import type { QuotationMutationPayload } from '@/features/quotations/api/types';
import {
  buildInvoiceDocument,
  buildQuotationDocument,
  isDocumentNumberConflict
} from '@/lib/agency-workflows';
import { normalizePhoneNumber } from '@/lib/phone';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export function buildIntegrationOrganizationWhere(organizationId: string | null) {
  return {
    organizationId
  };
}

function normalizeClientPayload(
  body: ClientMutationPayload,
  organizationId: string | null
): Prisma.ClientCreateInput {
  return {
    organizationId,
    name: body.name.trim(),
    email: body.email.trim().toLowerCase(),
    phone: normalizePhoneNumber(body.phone),
    company: body.company?.trim() || null,
    address: body.address?.trim() || null,
    status: body.status,
    notes: body.notes?.trim() || null
  };
}

export async function createIntegrationClient(
  body: ClientMutationPayload,
  organizationId: string | null
) {
  const created = await prisma.client.create({
    data: normalizeClientPayload(body, organizationId)
  });

  return mapClientRecord(created);
}

export async function createIntegrationQuotation(
  body: QuotationMutationPayload,
  organizationId: string | null
) {
  const created = await prisma.quotation.create({
    data: await buildQuotationDocument(prisma, body, undefined, organizationId),
    include: {
      client: true,
      _count: { select: { items: true } },
      items: { include: { product: true } }
    }
  });

  return mapQuotationRecord(created);
}

export async function createIntegrationInvoice(
  body: InvoiceMutationPayload,
  organizationId: string | null
) {
  let created: Prisma.InvoiceGetPayload<{
    include: { client: true; project: true; payments: { select: { amount: true } } };
  }> | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      created = await prisma.invoice.create({
        data: await buildInvoiceDocument(prisma, body, undefined, organizationId),
        include: { client: true, project: true, payments: { select: { amount: true } } }
      });
      break;
    } catch (error) {
      if (!isDocumentNumberConflict(error) || attempt === 4) {
        throw error;
      }
    }
  }

  if (!created) {
    throw new Error('Failed to create invoice');
  }

  return mapInvoiceRecord(created);
}

export interface IntegrationSendMessageInput {
  phone?: string | null;
  conversationId?: number | null;
  body: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  documentUrl?: string | null;
}

export async function sendIntegrationWhatsAppMessage(
  input: IntegrationSendMessageInput,
  organizationId: string | null
) {
  const messageBody = input.body.trim();
  if (!messageBody) {
    throw new Error('Message body is required');
  }

  const targetConversation =
    input.conversationId && input.conversationId > 0
      ? await prisma.conversation.findFirst({
          where: {
            id: input.conversationId,
            ...buildIntegrationOrganizationWhere(organizationId)
          },
          include: {
            client: true
          }
        })
      : null;

  const phone = normalizePhoneNumber(input.phone || targetConversation?.phone || null);
  if (!phone) {
    throw new Error('A valid phone or conversationId is required');
  }

  const matchedClient = await prisma.client.findFirst({
    where: {
      phone,
      ...buildIntegrationOrganizationWhere(organizationId)
    },
    select: {
      id: true
    }
  });

  const conversation =
    targetConversation ??
    (await prisma.conversation.upsert({
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
        clientId: matchedClient?.id ?? null,
        status: ConversationStatus.OPEN,
        lastMessagePreview: messageBody,
        lastMessageAt: new Date()
      },
      update: {
        organizationId,
        clientId: matchedClient?.id ?? undefined,
        status: ConversationStatus.OPEN,
        lastMessagePreview: messageBody,
        lastMessageAt: new Date()
      },
      include: {
        client: true
      }
    }));

  const result = await sendWhatsAppMessage({
    phone,
    body: messageBody,
    attachmentUrl: input.attachmentUrl ?? null,
    attachmentName: input.attachmentName ?? null,
    documentUrl: input.documentUrl ?? null,
    conversationId: conversation.id,
    externalThreadId: conversation.externalThreadId,
    metadata: {
      source: 'integration-api'
    }
  });

  const message = await prisma.messageLog.create({
    data: {
      organizationId,
      conversationId: conversation.id,
      clientId: conversation.clientId,
      channel: conversation.channel,
      direction: MessageDirection.OUTBOUND,
      status: result.status,
      provider: result.provider,
      externalMessageId: result.id,
      body: messageBody,
      attachmentUrl: input.attachmentUrl ?? null,
      attachmentName: input.attachmentName ?? null,
      documentUrl: input.documentUrl ?? null,
      metadata: {
        source: 'integration-api'
      },
      sentAt: new Date()
    }
  });

  const updatedConversation = await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessagePreview: messageBody,
      lastMessageAt: message.sentAt ?? message.createdAt
    },
    include: {
      client: true
    }
  });

  return {
    provider: result.provider,
    externalMessageId: result.id,
    conversation: mapConversationRecord(updatedConversation),
    message: mapMessageRecord(message)
  };
}

export async function attachIntegrationConversationClient(
  conversationId: number,
  clientId: number,
  organizationId: string | null
) {
  const [conversation, client] = await Promise.all([
    prisma.conversation.findFirst({
      where: {
        id: conversationId,
        ...buildIntegrationOrganizationWhere(organizationId)
      },
      select: { id: true }
    }),
    prisma.client.findFirst({
      where: {
        id: clientId,
        ...buildIntegrationOrganizationWhere(organizationId)
      },
      select: { id: true }
    })
  ]);

  if (!conversation) {
    throw new Error(`Conversation with ID ${conversationId} not found`);
  }

  if (!client) {
    throw new Error(`Client with ID ${clientId} not found`);
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

  return mapConversationRecord(updated);
}

export interface PipelineExecutionInput {
  type: PipelineJobType;
  input: Prisma.JsonValue | null;
  organizationId: string | null;
}

export async function executePipelineJob(input: PipelineExecutionInput) {
  switch (input.type) {
    case 'CREATE_CLIENT':
      return createIntegrationClient(
        input.input as unknown as ClientMutationPayload,
        input.organizationId
      );
    case 'CREATE_QUOTATION':
      return createIntegrationQuotation(
        input.input as unknown as QuotationMutationPayload,
        input.organizationId
      );
    case 'CREATE_INVOICE':
      return createIntegrationInvoice(
        input.input as unknown as InvoiceMutationPayload,
        input.organizationId
      );
    case 'SEND_WHATSAPP_MESSAGE':
      return sendIntegrationWhatsAppMessage(
        input.input as unknown as IntegrationSendMessageInput,
        input.organizationId
      );
    case 'ATTACH_CONVERSATION_CLIENT': {
      const payload = input.input as unknown as { conversationId: number; clientId: number };
      return attachIntegrationConversationClient(
        payload.conversationId,
        payload.clientId,
        input.organizationId
      );
    }
    default:
      throw new Error(`Unsupported pipeline job type: ${String(input.type)}`);
  }
}

export async function updatePipelineJobStatus(args: {
  jobId: number;
  status: PipelineJobStatus;
  output?: Prisma.JsonValue | null;
  errorMessage?: string | null;
}) {
  return prisma.pipelineJob.update({
    where: { id: args.jobId },
    data: {
      status: args.status,
      output: args.output ?? undefined,
      errorMessage: args.errorMessage ?? undefined,
      startedAt: args.status === 'RUNNING' ? new Date() : undefined,
      completedAt: args.status === 'SUCCEEDED' || args.status === 'FAILED' ? new Date() : undefined
    }
  });
}
