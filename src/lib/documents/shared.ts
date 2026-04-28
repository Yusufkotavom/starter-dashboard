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

function getStatusTone(status: string) {
  const normalized = status.trim().toUpperCase();

  if (['PAID', 'APPROVED', 'ACTIVE'].includes(normalized)) {
    return {
      badgeClass: 'badge-success',
      cardClass: 'status-success'
    };
  }

  if (['OVERDUE', 'REJECTED', 'CANCELLED', 'VOID'].includes(normalized)) {
    return {
      badgeClass: 'badge-danger',
      cardClass: 'status-danger'
    };
  }

  if (['PARTIAL', 'SENT', 'PENDING'].includes(normalized)) {
    return {
      badgeClass: 'badge-warning',
      cardClass: 'status-warning'
    };
  }

  return {
    badgeClass: '',
    cardClass: ''
  };
}

export function buildDocumentLayout(args: {
  kind: DocumentKind;
  title: string;
  number: string;
  status: string;
  issuerTitle: string;
  issuerLines: string[];
  metaRows: Array<{ label: string; value: string }>;
  partyTitle: string;
  partyLines: string[];
  summaryRows: Array<{ label: string; value: string }>;
  lineItemsTitle?: string;
  lineItemsTable?: string;
  notes?: string | null;
  paymentNote?: string | null;
  footerTitle?: string;
  footerLines?: string[];
  signatureBlocks?: Array<{
    title: string;
    lines?: string[];
  }>;
  options: DocumentRenderOptions;
  id: number;
  logoUrl?: string | null;
}): string {
  const { accessToken, autoPrint, origin } = args.options;
  const documentUrl = buildDocumentUrl(origin, args.kind, args.id, accessToken);
  const downloadUrl = buildDocumentDownloadUrl(origin, args.kind, args.id, accessToken);
  const printUrl = buildDocumentPrintUrl(origin, args.kind, args.id, accessToken);
  const statusTone = getStatusTone(args.status);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(args.title)} ${escapeHtml(args.number)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #ebe7df;
        --card: #ffffff;
        --paper: #fffdf8;
        --text: #171717;
        --muted: #68635b;
        --line: #ddd6c7;
        --soft-line: #efe8da;
        --accent: #a14f2a;
        --accent-soft: #f4e3d7;
        --ink-soft: #3f3a34;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family: "Geist", "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .shell {
        max-width: 1120px;
        margin: 0 auto;
        padding: 32px 20px 60px;
      }
      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 18px;
      }
      .toolbar a, .toolbar button {
        appearance: none;
        border: 1px solid var(--line);
        background: rgba(255,255,255,0.9);
        color: var(--text);
        border-radius: 999px;
        padding: 10px 16px;
        font: inherit;
        text-decoration: none;
        cursor: pointer;
      }
      .sheet {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        background: var(--paper);
        border: 1px solid rgba(161, 79, 42, 0.14);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 26px 80px rgba(38, 28, 18, 0.12);
      }
      .page {
        min-height: 297mm;
        padding: 18mm 16mm 16mm;
        display: flex;
        flex-direction: column;
      }
      .hero {
        display: grid;
        grid-template-columns: 1.25fr 0.95fr;
        gap: 18px;
        align-items: stretch;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--line);
      }
      .brand-card {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 24px;
        padding: 4px 0;
      }
      .brand-top {
        display: grid;
        gap: 8px;
      }
      .brand-logo {
        width: 58px;
        height: 58px;
        border-radius: 12px;
        border: 1px solid var(--line);
        background: #fff;
        object-fit: contain;
        padding: 6px;
      }
      .document-kicker {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--accent);
        letter-spacing: 0.18em;
        text-transform: uppercase;
        font-size: 11px;
        font-weight: 700;
      }
      .document-kicker::before {
        content: "";
        display: inline-block;
        width: 28px;
        height: 1px;
        background: currentColor;
      }
      .hero h1 {
        margin: 0;
        font-size: 42px;
        line-height: 0.95;
        letter-spacing: -0.04em;
      }
      .number {
        font-size: 14px;
        color: var(--muted);
        margin-top: 10px;
        letter-spacing: 0.04em;
      }
      .issuer {
        display: grid;
        gap: 6px;
        color: var(--ink-soft);
        max-width: 72%;
      }
      .issuer-title {
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 11px;
        font-weight: 700;
      }
      .status-card {
        display: grid;
        gap: 18px;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: linear-gradient(180deg, #fff7ee 0%, #fffdf9 100%);
        padding: 20px 22px;
      }
      .status-success {
        background: linear-gradient(180deg, #eefaf1 0%, #fffdf9 100%);
      }
      .status-warning {
        background: linear-gradient(180deg, #fff7e8 0%, #fffdf9 100%);
      }
      .status-danger {
        background: linear-gradient(180deg, #fff0ec 0%, #fffdf9 100%);
      }
      .status-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 14px;
      }
      .status-label {
        color: var(--muted);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      .badge {
        border: 1px solid var(--line);
        border-radius: 999px;
        background: var(--card);
        padding: 8px 12px;
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-weight: 700;
      }
      .badge-success {
        background: #edf9f0;
        color: #166534;
        border-color: #b8dfc2;
      }
      .badge-warning {
        background: #fff3dc;
        color: #9a6700;
        border-color: #f0cf84;
      }
      .badge-danger {
        background: #ffede8;
        color: #b42318;
        border-color: #f0b7aa;
      }
      .status-grid {
        display: grid;
        gap: 10px;
      }
      .status-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        border-bottom: 1px solid var(--soft-line);
        padding-bottom: 10px;
      }
      .status-row:last-child {
        border-bottom: 0;
        padding-bottom: 0;
      }
      .content {
        display: grid;
        gap: 18px;
        padding-top: 18px;
        flex: 1;
      }
      .grid {
        display: grid;
        gap: 18px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .card {
        border: 1px solid var(--line);
        border-radius: 18px;
        background: var(--card);
        padding: 18px 20px;
      }
      .card h2 {
        margin: 0 0 14px;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--muted);
      }
      .meta-row, .summary-row {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding: 11px 0;
        border-bottom: 1px solid var(--soft-line);
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
        gap: 7px;
        line-height: 1.55;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        text-align: left;
        padding: 13px 10px;
        border-bottom: 1px solid var(--soft-line);
        vertical-align: top;
      }
      th {
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
        background: #fcf7f0;
      }
      td.amount, th.amount {
        text-align: right;
      }
      .table-card {
        overflow: hidden;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .table-card table {
        margin: 0 -10px;
        width: calc(100% + 20px);
      }
      thead {
        display: table-header-group;
      }
      tr, td, th {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .notes {
        white-space: normal;
        line-height: 1.7;
      }
      .summary-card .summary-row:last-child strong {
        color: var(--accent);
        font-size: 15px;
      }
      .payment-note {
        margin-top: 14px;
        border-radius: 14px;
        background: var(--accent-soft);
        color: #6d371f;
        padding: 14px 16px;
        line-height: 1.7;
      }
      .footer {
        margin-top: 18px;
        padding-top: 16px;
        border-top: 1px solid var(--line);
        display: flex;
        justify-content: space-between;
        gap: 16px;
        color: var(--muted);
        font-size: 12px;
      }
      .footer-block {
        display: grid;
        gap: 4px;
        max-width: 48%;
      }
      .footer-title {
        color: var(--text);
        font-weight: 700;
      }
      .signatures {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
      }
      .signature-card {
        border: 1px dashed var(--line);
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.72);
        padding: 18px 20px;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .signature-title {
        margin: 0 0 36px;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 11px;
        font-weight: 700;
      }
      .signature-line {
        border-top: 1px solid var(--line);
        padding-top: 10px;
        color: var(--ink-soft);
      }
      .signature-meta {
        margin-top: 6px;
        color: var(--muted);
        font-size: 12px;
      }
      @media print {
        @page {
          size: A4;
          margin: 0;
        }
        html, body {
          width: 210mm;
          height: 297mm;
          background: #fff;
        }
        .shell { max-width: none; padding: 0; }
        .toolbar { display: none; }
        .sheet {
          width: 210mm;
          min-height: 297mm;
          box-shadow: none;
          border-radius: 0;
          border: 0;
        }
        .card, .signature-card {
          box-shadow: none;
        }
      }
      @media (max-width: 720px) {
        .shell {
          padding: 16px 10px 40px;
        }
        .sheet {
          width: 100%;
          min-height: auto;
        }
        .page {
          min-height: auto;
          padding: 20px 18px;
        }
        .hero, .grid {
          grid-template-columns: 1fr;
        }
        .issuer {
          max-width: 100%;
        }
        .footer {
          flex-direction: column;
        }
        .signatures {
          grid-template-columns: 1fr;
        }
        .footer-block {
          max-width: none;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <div class="toolbar">
        <a href="${escapeHtml(downloadUrl)}">Download PDF</a>
        <button type="button" onclick="window.print()">Print</button>
      </div>
      <article class="sheet">
        <div class="page">
          <header class="hero">
            <section class="brand-card">
              <div class="brand-top">
                ${
                  args.logoUrl
                    ? `<img class="brand-logo" src="${escapeHtml(args.logoUrl)}" alt="Company logo" />`
                    : ''
                }
                <span class="document-kicker">${escapeHtml(args.title)}</span>
                <h1>${escapeHtml(args.number)}</h1>
                <div class="number">${escapeHtml(args.title)} document</div>
              </div>
              <div class="issuer">
                <div class="issuer-title">${escapeHtml(args.issuerTitle)}</div>
                ${args.issuerLines.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}
              </div>
            </section>

            <aside class="status-card ${statusTone.cardClass}">
              <div class="status-top">
                <div>
                  <div class="status-label">Status</div>
                </div>
                <div class="badge ${statusTone.badgeClass}">${escapeHtml(args.status)}</div>
              </div>
              <div class="status-grid">
                ${args.metaRows
                  .map(
                    (row) => `
                  <div class="status-row">
                    <span class="label">${escapeHtml(row.label)}</span>
                    <strong>${escapeHtml(row.value)}</strong>
                  </div>
                `
                  )
                  .join('')}
              </div>
            </aside>
          </header>

          <section class="content">
            <div class="grid">
              <section class="card">
                <h2>${escapeHtml(args.partyTitle)}</h2>
                <div class="party-lines">
                  ${args.partyLines.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}
                </div>
              </section>

              <section class="card summary-card">
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
                ${
                  args.paymentNote
                    ? `<div class="payment-note">${escapeMultilineHtml(args.paymentNote)}</div>`
                    : ''
                }
              </section>
            </div>

            ${
              args.lineItemsTable
                ? `
              <section class="card table-card">
                <h2>${escapeHtml(args.lineItemsTitle || 'Items')}</h2>
                ${args.lineItemsTable}
              </section>
            `
                : ''
            }

            <section class="card">
              <h2>Notes</h2>
              <div class="notes">${
                args.notes ? escapeMultilineHtml(args.notes) : 'No additional notes.'
              }</div>
            </section>

            ${
              args.signatureBlocks && args.signatureBlocks.length > 0
                ? `
              <section class="signatures">
                ${args.signatureBlocks
                  .map(
                    (block) => `
                  <section class="signature-card">
                    <h2 class="signature-title">${escapeHtml(block.title)}</h2>
                    <div class="signature-line"></div>
                    ${
                      block.lines && block.lines.length > 0
                        ? `
                      <div class="signature-meta">
                        ${block.lines.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}
                      </div>
                    `
                        : ''
                    }
                  </section>
                `
                  )
                  .join('')}
              </section>
            `
                : ''
            }
          </section>

          <footer class="footer">
            <div class="footer-block">
              <div class="footer-title">${escapeHtml(args.footerTitle || 'Document Reference')}</div>
              ${(
                args.footerLines || [
                  `Generated from ${documentUrl}`,
                  `PDF copy: ${downloadUrl}`,
                  `Print view: ${printUrl}`
                ]
              )
                .map((line) => `<div>${escapeHtml(line)}</div>`)
                .join('')}
            </div>
            <div class="footer-block">
              <div class="footer-title">Generated via Dashboard</div>
              <div>This document is optimized for full A4 export and print.</div>
              <div>Please review the latest live version before external sharing.</div>
            </div>
          </footer>
        </div>
      </article>
    </div>
    ${autoPrint ? `<script>window.addEventListener('load', () => window.print());</script>` : ''}
  </body>
</html>`;
}
