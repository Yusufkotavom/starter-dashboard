import { getAppSettings } from '@/lib/app-settings';
import { normalizePhoneNumber } from '@/lib/phone';
import { MessageStatus, Prisma, WhatsAppProvider } from '@/lib/prisma-client';

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

export interface WhatsAppSetupStatus {
  provider: 'EMULATOR' | 'BRIDGE';
  configured: boolean;
  bridgeUrl: string | null;
  sessionName: string | null;
  apiKeyConfigured: boolean;
  reachable: boolean;
  sessionExists: boolean;
  sessionStatus: string | null;
  engine: string | null;
  screenshotUrl: string | null;
  message: string;
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
    apiKey: settings.whatsappApiKey,
    sessionName: settings.whatsappSessionName,
    countryCode: settings.whatsappCountryCode
  };
}

function getBridgeSessionName(sessionName?: string | null) {
  return normalizeOptional(sessionName) || 'default';
}

function buildBridgeHeaders(apiKey?: string | null) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'starter-dashboard/1.0'
  };

  const normalizedApiKey = normalizeOptional(apiKey);
  if (normalizedApiKey) {
    headers['X-Api-Key'] = normalizedApiKey;
  }

  return headers;
}

function buildWhatsAppTextPayload(input: WhatsAppSendInput) {
  return [input.body, normalizeOptional(input.documentUrl), normalizeOptional(input.attachmentUrl)]
    .filter(Boolean)
    .join('\n\n');
}

async function sendViaWahaBridge(input: WhatsAppSendInput): Promise<WhatsAppSendResult> {
  const config = await getWhatsAppRuntimeConfig();
  if (!config.bridgeUrl) {
    throw new Error('WHATSAPP_BRIDGE_URL_MISSING');
  }

  const phone = normalizePhoneNumber(input.phone, config.countryCode);
  if (!phone) {
    throw new Error('WHATSAPP_PHONE_INVALID');
  }

  const response = await fetch(new URL('/api/sendText', config.bridgeUrl).toString(), {
    method: 'POST',
    headers: buildBridgeHeaders(config.apiKey),
    body: JSON.stringify({
      session: getBridgeSessionName(config.sessionName),
      chatId: `${phone}@c.us`,
      text: buildWhatsAppTextPayload(input)
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WHATSAPP_BRIDGE_ERROR ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as {
    id?: string;
    status?: string;
    _data?: {
      id?: {
        _serialized?: string;
      };
    };
  };
  return {
    id: payload.id || payload._data?.id?._serialized || `bridge-${Date.now()}`,
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
    return sendViaWahaBridge(input);
  }

  return sendViaEmulator(input);
}

export async function getWhatsAppSetupStatus(): Promise<WhatsAppSetupStatus> {
  const config = await getWhatsAppRuntimeConfig();
  const sessionName = getBridgeSessionName(config.sessionName);

  if (config.provider !== 'BRIDGE') {
    return {
      provider: config.provider,
      configured: false,
      bridgeUrl: config.bridgeUrl,
      sessionName,
      apiKeyConfigured: Boolean(normalizeOptional(config.apiKey)),
      reachable: false,
      sessionExists: false,
      sessionStatus: null,
      engine: null,
      screenshotUrl: null,
      message: 'WhatsApp provider is still in emulator mode.'
    };
  }

  if (!config.bridgeUrl) {
    return {
      provider: config.provider,
      configured: false,
      bridgeUrl: null,
      sessionName,
      apiKeyConfigured: Boolean(normalizeOptional(config.apiKey)),
      reachable: false,
      sessionExists: false,
      sessionStatus: null,
      engine: null,
      screenshotUrl: null,
      message: 'Set WAHA base URL first.'
    };
  }

  try {
    const response = await fetch(
      new URL(`/api/sessions/${encodeURIComponent(sessionName)}`, config.bridgeUrl).toString(),
      {
        headers: buildBridgeHeaders(config.apiKey),
        cache: 'no-store'
      }
    );

    if (response.status === 404) {
      return {
        provider: config.provider,
        configured: true,
        bridgeUrl: config.bridgeUrl,
        sessionName,
        apiKeyConfigured: Boolean(normalizeOptional(config.apiKey)),
        reachable: true,
        sessionExists: false,
        sessionStatus: null,
        engine: null,
        screenshotUrl: '/api/settings/whatsapp/qr',
        message: `Session '${sessionName}' not found yet. Prepare it first.`
      };
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WAHA_STATUS_ERROR ${response.status} ${errorText}`);
    }

    const payload = (await response.json()) as {
      status?: string;
      engine?: { engine?: string };
    };

    return {
      provider: config.provider,
      configured: true,
      bridgeUrl: config.bridgeUrl,
      sessionName,
      apiKeyConfigured: Boolean(normalizeOptional(config.apiKey)),
      reachable: true,
      sessionExists: true,
      sessionStatus: payload.status ?? null,
      engine: payload.engine?.engine ?? null,
      screenshotUrl: '/api/settings/whatsapp/qr',
      message:
        payload.status === 'WORKING'
          ? 'WhatsApp is connected and ready.'
          : `WhatsApp session is ${payload.status ?? 'unknown'}.`
    };
  } catch (error) {
    return {
      provider: config.provider,
      configured: true,
      bridgeUrl: config.bridgeUrl,
      sessionName,
      apiKeyConfigured: Boolean(normalizeOptional(config.apiKey)),
      reachable: false,
      sessionExists: false,
      sessionStatus: null,
      engine: null,
      screenshotUrl: null,
      message: error instanceof Error ? error.message : 'Failed to reach WAHA bridge.'
    };
  }
}

export async function ensureWhatsAppSession(): Promise<WhatsAppSetupStatus> {
  const config = await getWhatsAppRuntimeConfig();
  if (config.provider !== 'BRIDGE') {
    throw new Error('WHATSAPP_PROVIDER_NOT_BRIDGE');
  }

  if (!config.bridgeUrl) {
    throw new Error('WHATSAPP_BRIDGE_URL_MISSING');
  }

  const sessionName = getBridgeSessionName(config.sessionName);
  const headers = buildBridgeHeaders(config.apiKey);

  const sessionResponse = await fetch(
    new URL(`/api/sessions/${encodeURIComponent(sessionName)}`, config.bridgeUrl).toString(),
    {
      headers,
      cache: 'no-store'
    }
  );

  if (sessionResponse.status === 404) {
    const createResponse = await fetch(new URL('/api/sessions', config.bridgeUrl).toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: sessionName,
        start: false
      })
    });

    if (!createResponse.ok && createResponse.status !== 422) {
      const errorText = await createResponse.text();
      throw new Error(`WAHA_SESSION_CREATE_ERROR ${createResponse.status} ${errorText}`);
    }
  } else if (!sessionResponse.ok) {
    const errorText = await sessionResponse.text();
    throw new Error(`WAHA_SESSION_READ_ERROR ${sessionResponse.status} ${errorText}`);
  }

  const startResponse = await fetch(
    new URL(`/api/sessions/${encodeURIComponent(sessionName)}/start`, config.bridgeUrl).toString(),
    {
      method: 'POST',
      headers
    }
  );

  if (!startResponse.ok && startResponse.status !== 409) {
    const errorText = await startResponse.text();
    throw new Error(`WAHA_SESSION_START_ERROR ${startResponse.status} ${errorText}`);
  }

  return getWhatsAppSetupStatus();
}

export async function getWhatsAppQrScreenshot() {
  const config = await getWhatsAppRuntimeConfig();
  if (config.provider !== 'BRIDGE') {
    throw new Error('WHATSAPP_PROVIDER_NOT_BRIDGE');
  }

  if (!config.bridgeUrl) {
    throw new Error('WHATSAPP_BRIDGE_URL_MISSING');
  }

  const sessionName = getBridgeSessionName(config.sessionName);
  const response = await fetch(
    new URL(
      `/api/screenshot?session=${encodeURIComponent(sessionName)}`,
      config.bridgeUrl
    ).toString(),
    {
      headers: buildBridgeHeaders(config.apiKey),
      cache: 'no-store'
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WAHA_QR_ERROR ${response.status} ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    contentType: response.headers.get('content-type') || 'image/jpeg',
    body: Buffer.from(arrayBuffer)
  };
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
