import { formatPrice } from '@/lib/utils';

type MailProvider = 'emulator' | 'resend';

export interface MailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface MailSendResult {
  id: string;
  provider: MailProvider;
}

function getProvider(): MailProvider {
  const provider = (process.env.MAIL_PROVIDER || 'emulator').toLowerCase();
  return provider === 'resend' ? 'resend' : 'emulator';
}

function getFromEmail(): string {
  return process.env.MAIL_FROM_EMAIL || 'Agency Dashboard <onboarding@resend.dev>';
}

function getReplyTo(): string | undefined {
  return process.env.MAIL_REPLY_TO || undefined;
}

function normalizeRecipients(to: string | string[]): string[] {
  return Array.isArray(to) ? to : [to];
}

async function sendWithResend(message: MailMessage): Promise<MailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is required when MAIL_PROVIDER=resend');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: getFromEmail(),
      to: normalizeRecipients(message.to),
      reply_to: message.replyTo || getReplyTo(),
      subject: message.subject,
      html: message.html,
      text: message.text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API error: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as { id: string };
  return {
    id: payload.id,
    provider: 'resend'
  };
}

async function sendWithEmulator(message: MailMessage): Promise<MailSendResult> {
  const mailId = `emulator-${Date.now()}`;
  const payload = {
    id: mailId,
    provider: 'emulator',
    from: getFromEmail(),
    to: normalizeRecipients(message.to),
    replyTo: message.replyTo || getReplyTo(),
    subject: message.subject,
    html: message.html,
    text: message.text
  };

  process.stdout.write(`[mail:emulator] ${JSON.stringify(payload, null, 2)}\n`);

  return {
    id: mailId,
    provider: 'emulator'
  };
}

export async function sendMail(message: MailMessage): Promise<MailSendResult> {
  const provider = getProvider();
  if (provider === 'resend') {
    return sendWithResend(message);
  }

  return sendWithEmulator(message);
}

interface QuotationMailInput {
  number: string;
  clientName: string;
  company: string | null;
  total: number;
  validUntil: string | null;
  notes: string | null;
  services: string[];
}

interface InvoiceMailInput {
  number: string;
  clientName: string;
  company: string | null;
  total: number;
  paidAmount: number;
  balanceDue: number;
  dueDate: string | null;
  notes: string | null;
  projectName: string | null;
}

export function renderQuotationEmail(input: QuotationMailInput): MailMessage {
  const serviceList =
    input.services.length > 0
      ? `<ul>${input.services.map((service) => `<li>${service}</li>`).join('')}</ul>`
      : '<p>Custom service scope attached in this quotation.</p>';
  const validUntil = input.validUntil
    ? new Date(input.validUntil).toLocaleDateString('id-ID')
    : '-';
  const greetingName = input.company || input.clientName;

  return {
    to: input.clientName,
    subject: `Quotation ${input.number}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Quotation ${input.number}</h2>
        <p>Hello ${greetingName},</p>
        <p>Please find your quotation summary below.</p>
        <p><strong>Total:</strong> ${formatPrice(input.total)}</p>
        <p><strong>Valid Until:</strong> ${validUntil}</p>
        <p><strong>Services:</strong></p>
        ${serviceList}
        ${input.notes ? `<p><strong>Notes:</strong><br/>${input.notes}</p>` : ''}
      </div>
    `,
    text: `Quotation ${input.number}\nTotal: ${formatPrice(input.total)}\nValid Until: ${validUntil}`
  };
}

export function renderInvoiceEmail(input: InvoiceMailInput): MailMessage {
  const greetingName = input.company || input.clientName;
  const dueDate = input.dueDate ? new Date(input.dueDate).toLocaleDateString('id-ID') : '-';

  return {
    to: input.clientName,
    subject: `Invoice ${input.number}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Invoice ${input.number}</h2>
        <p>Hello ${greetingName},</p>
        <p>Your invoice summary is below.</p>
        ${input.projectName ? `<p><strong>Project:</strong> ${input.projectName}</p>` : ''}
        <p><strong>Total:</strong> ${formatPrice(input.total)}</p>
        <p><strong>Paid:</strong> ${formatPrice(input.paidAmount)}</p>
        <p><strong>Balance Due:</strong> ${formatPrice(input.balanceDue)}</p>
        <p><strong>Due Date:</strong> ${dueDate}</p>
        ${input.notes ? `<p><strong>Notes:</strong><br/>${input.notes}</p>` : ''}
      </div>
    `,
    text: `Invoice ${input.number}\nTotal: ${formatPrice(input.total)}\nBalance Due: ${formatPrice(input.balanceDue)}\nDue Date: ${dueDate}`
  };
}
