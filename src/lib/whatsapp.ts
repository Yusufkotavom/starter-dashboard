import { getAppSettings } from '@/lib/app-settings';
import { normalizePhoneNumber } from '@/lib/phone';
import { CommunicationChannel, MessageStatus, Prisma, WhatsAppProvider } from '@/lib/prisma-client';

export interface WhatsAppSendInput {
  phone: string;
  body: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  documentUrl?: string | null;
  conversationId?: number | null;
  externalThreadId?: string | null;
  metadata?: Prisma.JsonValue;
}

export interface WhatsAppSendResult {
  id: string;
  provider: WhatsAppProvider;
  status: MessageStatus;
}

function normalizeOptional(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export async function getWhatsAppRuntimeConfig() {
  const settings = await getAppSettings();
  return {
    provider: settings.whatsappProvider,
    bridgeUrl: settings.whatsappBridgeUrl,
    sessionName: settings.whatsappSessionName,
    countryCode: settings.whatsappCountryCode
  };
}

async function sendViaBridge(input: WhatsAppSendInput): Promise<WhatsAppSendResult> {
  const config = await getWhatsAppRuntimeConfig();
  if (!config.bridgeUrl) {
    throw new Error('WHATSAPP_BRIDGE_URL_MISSING');
  }

  const phone = normalizePhoneNumber(input.phone, config.countryCode);
  if (!phone) {
    throw new Error('WHATSAPP_PHONE_INVALID');
  }

  const response = await fetch(new URL('/messages/send', config.bridgeUrl).toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'starter-dashboard/1.0'
    },
    body: JSON.stringify({
      sessionName: config.sessionName || 'agency-main',
      channel: CommunicationChannel.WHATSAPP,
      phone,
      text: input.body,
      attachmentUrl: normalizeOptional(input.attachmentUrl),
      attachmentName: normalizeOptional(input.attachmentName),
      documentUrl: normalizeOptional(input.documentUrl),
      conversationId: input.conversationId ?? null,
      externalThreadId: normalizeOptional(input.externalThreadId),
      metadata: input.metadata ?? null
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WHATSAPP_BRIDGE_ERROR ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as { id?: string; status?: string };
  return {
    id: payload.id || `bridge-${Date.now()}`,
    provider: WhatsAppProvider.BRIDGE,
    status:
      payload.status === MessageStatus.DELIVERED ? MessageStatus.DELIVERED : MessageStatus.SENT
  };
}

async function sendViaEmulator(input: WhatsAppSendInput): Promise<WhatsAppSendResult> {
  const config = await getWhatsAppRuntimeConfig();
  const phone = normalizePhoneNumber(input.phone, config.countryCode);
  if (!phone) {
    throw new Error('WHATSAPP_PHONE_INVALID');
  }

  const payload = {
    id: `whatsapp-emulator-${Date.now()}`,
    provider: WhatsAppProvider.EMULATOR,
    phone,
    body: input.body,
    attachmentUrl: normalizeOptional(input.attachmentUrl),
    attachmentName: normalizeOptional(input.attachmentName),
    documentUrl: normalizeOptional(input.documentUrl),
    conversationId: input.conversationId ?? null,
    externalThreadId: normalizeOptional(input.externalThreadId),
    metadata: input.metadata ?? null
  };

  process.stdout.write(`[whatsapp:emulator] ${JSON.stringify(payload, null, 2)}\n`);

  return {
    id: payload.id,
    provider: WhatsAppProvider.EMULATOR,
    status: MessageStatus.SENT
  };
}

export async function sendWhatsAppMessage(input: WhatsAppSendInput): Promise<WhatsAppSendResult> {
  const config = await getWhatsAppRuntimeConfig();
  if (config.provider === 'BRIDGE') {
    return sendViaBridge(input);
  }

  return sendViaEmulator(input);
}

export function renderQuotationWhatsAppMessage(input: {
  number: string;
  clientName: string;
  company: string | null;
  total: number;
  validUntil: string | null;
  documentUrl: string;
}) {
  const greetingName = input.company || input.clientName;
  const validUntil = input.validUntil
    ? new Date(input.validUntil).toLocaleDateString('id-ID')
    : '-';

  return [
    `Halo ${greetingName},`,
    '',
    `Quotation ${input.number} sudah siap.`,
    `Total: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(input.total)}`,
    `Valid sampai: ${validUntil}`,
    '',
    `Buka dokumen: ${input.documentUrl}`
  ].join('\n');
}

export function renderInvoiceWhatsAppMessage(input: {
  number: string;
  clientName: string;
  company: string | null;
  total: number;
  balanceDue: number;
  dueDate: string | null;
  documentUrl: string;
  paymentLink: string | null;
}) {
  const greetingName = input.company || input.clientName;
  const dueDate = input.dueDate ? new Date(input.dueDate).toLocaleDateString('id-ID') : '-';

  return [
    `Halo ${greetingName},`,
    '',
    `Invoice ${input.number} sudah siap.`,
    `Total: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(input.total)}`,
    `Sisa tagihan: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(input.balanceDue)}`,
    `Jatuh tempo: ${dueDate}`,
    '',
    `Dokumen: ${input.documentUrl}`,
    input.paymentLink ? `Pembayaran: ${input.paymentLink}` : null
  ]
    .filter(Boolean)
    .join('\n');
}
