import { PDFDocument, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import type { InvoiceDocumentData } from './invoices';
import type { QuotationDocumentData } from './quotations';

function drawWrappedText(
  page: PDFPage,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  text: string,
  x: number,
  y: number,
  size: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(/\s+/).filter(Boolean);
  let line = '';
  let cursorY = y;

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(nextLine, size) > maxWidth && line) {
      page.drawText(line, { x, y: cursorY, size, font, color: rgb(0.07, 0.09, 0.11) });
      cursorY -= lineHeight;
      line = word;
    } else {
      line = nextLine;
    }
  }

  if (line) {
    page.drawText(line, { x, y: cursorY, size, font, color: rgb(0.07, 0.09, 0.11) });
  }

  return cursorY - lineHeight;
}

async function createBasePdf(title: string, number: string, status: string) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  page.drawText(title, { x: 48, y: 790, size: 26, font: bold, color: rgb(0.07, 0.09, 0.11) });
  page.drawText(number, { x: 48, y: 765, size: 12, font, color: rgb(0.4, 0.45, 0.5) });
  page.drawText(status.replaceAll('_', ' '), {
    x: 450,
    y: 790,
    size: 11,
    font: bold,
    color: rgb(0.2, 0.25, 0.32)
  });

  page.drawLine({
    start: { x: 48, y: 748 },
    end: { x: 547, y: 748 },
    thickness: 1,
    color: rgb(0.88, 0.9, 0.92)
  });

  return { pdf, page, font, bold };
}

export async function generateInvoicePdf(invoice: InvoiceDocumentData): Promise<Uint8Array> {
  const { pdf, page, font, bold } = await createBasePdf('Invoice', invoice.number, invoice.status);

  let y = 718;
  const leftX = 48;
  const rightX = 320;

  page.drawText('Billed To', { x: leftX, y, size: 12, font: bold });
  y -= 20;
  for (const line of [
    invoice.clientCompany || invoice.clientName,
    invoice.clientEmail,
    invoice.clientPhone || '-',
    invoice.clientAddress || '-'
  ]) {
    y = drawWrappedText(page, font, line, leftX, y, 11, 220, 16);
  }

  let metaY = 718;
  for (const [label, value] of [
    ['Issued', new Date(invoice.createdAt).toLocaleDateString('id-ID')],
    ['Due', invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('id-ID') : '-'],
    ['Project', invoice.projectName || '-'],
    ['Subscription', invoice.subscriptionName || '-']
  ]) {
    page.drawText(`${label}:`, { x: rightX, y: metaY, size: 11, font: bold });
    page.drawText(String(value), { x: rightX + 84, y: metaY, size: 11, font });
    metaY -= 18;
  }

  y = Math.min(y, metaY) - 12;
  page.drawLine({
    start: { x: 48, y },
    end: { x: 547, y },
    thickness: 1,
    color: rgb(0.88, 0.9, 0.92)
  });
  y -= 26;

  page.drawText('Summary', { x: leftX, y, size: 12, font: bold });
  y -= 20;
  for (const [label, value] of [
    ['Subtotal', invoice.subtotal],
    ['Tax', invoice.tax],
    ['Total', invoice.total],
    ['Paid', invoice.paidAmount],
    ['Balance Due', invoice.balanceDue]
  ]) {
    page.drawText(String(label), { x: leftX, y, size: 11, font });
    page.drawText(value.toLocaleString('id-ID'), { x: 430, y, size: 11, font: bold });
    y -= 18;
  }

  y -= 10;
  page.drawText('Payments', { x: leftX, y, size: 12, font: bold });
  y -= 18;
  if (invoice.payments.length === 0) {
    page.drawText('No payment recorded yet.', { x: leftX, y, size: 11, font });
    y -= 18;
  } else {
    for (const payment of invoice.payments) {
      const line = `${new Date(payment.paidAt).toLocaleDateString('id-ID')} · ${payment.method || '-'} · ${payment.reference || '-'} · ${payment.amount.toLocaleString('id-ID')}`;
      y = drawWrappedText(page, font, line, leftX, y, 10, 499, 15);
    }
  }

  if (invoice.notes) {
    y -= 10;
    page.drawText('Notes', { x: leftX, y, size: 12, font: bold });
    y -= 18;
    drawWrappedText(page, font, invoice.notes, leftX, y, 10, 499, 15);
  }

  return pdf.save();
}

export async function generateQuotationPdf(quotation: QuotationDocumentData): Promise<Uint8Array> {
  const { pdf, page, font, bold } = await createBasePdf(
    'Quotation',
    quotation.number,
    quotation.status
  );

  let y = 718;
  const leftX = 48;
  const rightX = 320;

  page.drawText('Prepared For', { x: leftX, y, size: 12, font: bold });
  y -= 20;
  for (const line of [
    quotation.clientCompany || quotation.clientName,
    quotation.clientEmail,
    quotation.clientPhone || '-',
    quotation.clientAddress || '-'
  ]) {
    y = drawWrappedText(page, font, line, leftX, y, 11, 220, 16);
  }

  let metaY = 718;
  for (const [label, value] of [
    ['Issued', new Date(quotation.createdAt).toLocaleDateString('id-ID')],
    [
      'Valid Until',
      quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString('id-ID') : '-'
    ],
    ['Items', quotation.items.length.toLocaleString('id-ID')],
    ['Client', quotation.clientCompany || quotation.clientName]
  ]) {
    page.drawText(`${label}:`, { x: rightX, y: metaY, size: 11, font: bold });
    page.drawText(String(value), { x: rightX + 84, y: metaY, size: 11, font });
    metaY -= 18;
  }

  y = Math.min(y, metaY) - 12;
  page.drawLine({
    start: { x: 48, y },
    end: { x: 547, y },
    thickness: 1,
    color: rgb(0.88, 0.9, 0.92)
  });
  y -= 26;

  page.drawText('Quoted Scope', { x: leftX, y, size: 12, font: bold });
  y -= 18;
  for (const item of quotation.items) {
    const line = `${item.description} · ${item.qty.toLocaleString('id-ID')} x ${item.unitPrice.toLocaleString('id-ID')} = ${item.amount.toLocaleString('id-ID')}`;
    y = drawWrappedText(page, font, line, leftX, y, 10, 499, 15);
  }

  y -= 10;
  page.drawText('Summary', { x: leftX, y, size: 12, font: bold });
  y -= 18;
  for (const [label, value] of [
    ['Subtotal', quotation.subtotal],
    ['Tax', quotation.tax],
    ['Discount', quotation.discount],
    ['Grand Total', quotation.total]
  ]) {
    page.drawText(String(label), { x: leftX, y, size: 11, font });
    page.drawText(value.toLocaleString('id-ID'), { x: 430, y, size: 11, font: bold });
    y -= 18;
  }

  if (quotation.notes) {
    y -= 10;
    page.drawText('Notes', { x: leftX, y, size: 12, font: bold });
    y -= 18;
    drawWrappedText(page, font, quotation.notes, leftX, y, 10, 499, 15);
  }

  return pdf.save();
}
