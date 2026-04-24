import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';
import { formatPrice } from '@/lib/utils';

export type DocumentKind = 'invoice' | 'quotation';

export interface DocumentRenderOptions {
  accessToken?: string | null;
  autoPrint?: boolean;
  origin: string;
}

const DEFAULT_DOCUMENT_SECRET = 'starter-dashboard-documents';

function getDocumentSecret(): string {
  return (
    process.env.DOCUMENT_LINK_SECRET ||
    process.env.CLERK_SECRET_KEY ||
    process.env.RESEND_API_KEY ||
    DEFAULT_DOCUMENT_SECRET
  );
}

function buildSignaturePayload(kind: DocumentKind, id: number): string {
  return `${kind}:${id}`;
}

export function createDocumentToken(kind: DocumentKind, id: number): string {
  return crypto
    .createHmac('sha256', getDocumentSecret())
    .update(buildSignaturePayload(kind, id))
    .digest('base64url');
}

export function verifyDocumentToken(
  token: string | null | undefined,
  kind: DocumentKind,
  id: number
): boolean {
  if (!token) return false;

  const expected = createDocumentToken(kind, id);
  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expected);
  if (tokenBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(tokenBuffer, expectedBuffer);
}

export function getDocumentOrigin(request: NextRequest): string {
  const appUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (appUrl) {
    return appUrl;
  }

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto =
    request.headers.get('x-forwarded-proto') || request.nextUrl.protocol.replace(':', '');
  if (host) {
    return `${proto}://${host}`;
  }

  return request.nextUrl.origin;
}

export function buildDocumentUrl(
  origin: string,
  kind: DocumentKind,
  id: number,
  token?: string | null
): string {
  const segment = kind === 'invoice' ? 'invoices' : 'quotations';
  const url = new URL(`/documents/${segment}/${id}`, origin);
  if (token) {
    url.searchParams.set('token', token);
  }
  return url.toString();
}

export function buildDocumentDownloadUrl(
  origin: string,
  kind: DocumentKind,
  id: number,
  token?: string | null
): string {
  const segment = kind === 'invoice' ? 'invoices' : 'quotations';
  const url = new URL(`/api/${segment}/${id}/pdf`, origin);
  if (token) {
    url.searchParams.set('token', token);
  }
  return url.toString();
}

export function buildDocumentPrintUrl(
  origin: string,
  kind: DocumentKind,
  id: number,
  token?: string | null
): string {
  const url = new URL(buildDocumentUrl(origin, kind, id, token));
  url.searchParams.set('print', '1');
  return url.toString();
}

export function escapeHtml(value: string | null | undefined): string {
  if (!value) return '';

  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function escapeMultilineHtml(value: string | null | undefined): string {
  return escapeHtml(value).replaceAll('\n', '<br />');
}

export function formatDocumentDate(value: string | Date | null | undefined): string {
  if (!value) return '-';

  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function formatDocumentAmount(value: number): string {
  return formatPrice(value);
}

export function createAttachmentContent(content: string | Uint8Array): string {
  return Buffer.from(content).toString('base64');
}

export function buildDocumentLayout(args: {
  kind: DocumentKind;
  title: string;
  number: string;
  status: string;
  metaRows: Array<{ label: string; value: string }>;
  partyTitle: string;
  partyLines: string[];
  summaryRows: Array<{ label: string; value: string }>;
  lineItemsTitle?: string;
  lineItemsTable?: string;
  notes?: string | null;
  options: DocumentRenderOptions;
  id: number;
}): string {
  const { accessToken, autoPrint, origin } = args.options;
  const documentUrl = buildDocumentUrl(origin, args.kind, args.id, accessToken);
  const downloadUrl = buildDocumentDownloadUrl(origin, args.kind, args.id, accessToken);
  const printUrl = buildDocumentPrintUrl(origin, args.kind, args.id, accessToken);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(args.title)} ${escapeHtml(args.number)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f6f7f9;
        --card: #ffffff;
        --text: #111827;
        --muted: #6b7280;
        --line: #e5e7eb;
        --accent: #111827;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family: Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .shell {
        max-width: 960px;
        margin: 0 auto;
        padding: 32px 20px 72px;
      }
      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 20px;
      }
      .toolbar a, .toolbar button {
        appearance: none;
        border: 1px solid var(--line);
        background: var(--card);
        color: var(--text);
        border-radius: 999px;
        padding: 10px 16px;
        font: inherit;
        text-decoration: none;
        cursor: pointer;
      }
      .sheet {
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 18px 60px rgba(15, 23, 42, 0.08);
      }
      .hero {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        padding: 32px;
        border-bottom: 1px solid var(--line);
      }
      .hero h1 {
        margin: 0;
        font-size: 34px;
        line-height: 1;
      }
      .hero .eyebrow {
        display: inline-flex;
        margin-bottom: 10px;
        color: var(--muted);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-size: 12px;
      }
      .hero .number {
        font-size: 16px;
        color: var(--muted);
        margin-top: 10px;
      }
      .badge {
        align-self: flex-start;
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 8px 12px;
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .content {
        padding: 32px;
        display: grid;
        gap: 24px;
      }
      .grid {
        display: grid;
        gap: 24px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .card {
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 20px;
      }
      .card h2 {
        margin: 0 0 14px;
        font-size: 15px;
      }
      .meta-row, .summary-row {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding: 10px 0;
        border-bottom: 1px solid var(--line);
      }
      .meta-row:last-child, .summary-row:last-child {
        border-bottom: 0;
        padding-bottom: 0;
      }
      .meta-row:first-child, .summary-row:first-child {
        padding-top: 0;
      }
      .label {
        color: var(--muted);
      }
      .party-lines {
        display: grid;
        gap: 6px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        text-align: left;
        padding: 12px 10px;
        border-bottom: 1px solid var(--line);
        vertical-align: top;
      }
      th {
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      td.amount, th.amount {
        text-align: right;
      }
      .notes {
        white-space: normal;
        line-height: 1.7;
      }
      .footer {
        padding: 0 32px 32px;
        color: var(--muted);
        font-size: 13px;
      }
      @media print {
        body { background: #fff; }
        .shell { max-width: none; padding: 0; }
        .toolbar { display: none; }
        .sheet { box-shadow: none; border-radius: 0; border: 0; }
      }
      @media (max-width: 720px) {
        .hero, .grid { grid-template-columns: 1fr; display: grid; }
        .content, .hero, .footer { padding: 20px; }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <div class="toolbar">
        <button type="button" onclick="window.print()">Print</button>
        <a href="${escapeHtml(downloadUrl)}">Download HTML</a>
        <a href="${escapeHtml(documentUrl)}" target="_blank" rel="noreferrer">Open Clean View</a>
        <a href="${escapeHtml(printUrl)}" target="_blank" rel="noreferrer">Open Print View</a>
      </div>
      <article class="sheet">
        <header class="hero">
          <div>
            <span class="eyebrow">${escapeHtml(args.title)}</span>
            <h1>${escapeHtml(args.number)}</h1>
            <div class="number">${escapeHtml(args.title)} document</div>
          </div>
          <div class="badge">${escapeHtml(args.status)}</div>
        </header>
        <section class="content">
          <div class="grid">
            <section class="card">
              <h2>Document Details</h2>
              ${args.metaRows
                .map(
                  (row) => `
                <div class="meta-row">
                  <span class="label">${escapeHtml(row.label)}</span>
                  <strong>${escapeHtml(row.value)}</strong>
                </div>
              `
                )
                .join('')}
            </section>
            <section class="card">
              <h2>${escapeHtml(args.partyTitle)}</h2>
              <div class="party-lines">
                ${args.partyLines.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}
              </div>
            </section>
          </div>
          ${
            args.lineItemsTable
              ? `
            <section class="card">
              <h2>${escapeHtml(args.lineItemsTitle || 'Items')}</h2>
              ${args.lineItemsTable}
            </section>
          `
              : ''
          }
          <div class="grid">
            <section class="card">
              <h2>Summary</h2>
              ${args.summaryRows
                .map(
                  (row) => `
                <div class="summary-row">
                  <span class="label">${escapeHtml(row.label)}</span>
                  <strong>${escapeHtml(row.value)}</strong>
                </div>
              `
                )
                .join('')}
            </section>
            ${
              args.notes
                ? `
              <section class="card">
                <h2>Notes</h2>
                <div class="notes">${escapeMultilineHtml(args.notes)}</div>
              </section>
            `
                : '<section class="card"><h2>Notes</h2><div class="notes">No additional notes.</div></section>'
            }
          </div>
        </section>
        <footer class="footer">
          Generated from ${escapeHtml(documentUrl)}
        </footer>
      </article>
    </div>
    ${autoPrint ? `<script>window.addEventListener('load', () => window.print());</script>` : ''}
  </body>
</html>`;
}
