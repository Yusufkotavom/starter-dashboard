import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import {
  appendPortalNote,
  formatPortalDateTime,
  getPortalClientOrThrow
} from '@/lib/customer-portal';
import { prisma } from '@/lib/prisma';

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

interface PortalPaymentProofRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: Request, { params }: PortalPaymentProofRouteProps) {
  const { id } = await params;
  const invoiceId = Number(id);

  if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
    return NextResponse.json({ message: 'Invalid invoice id' }, { status: 400 });
  }

  const { client, email } = await getPortalClientOrThrow();
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      clientId: client.id
    }
  });

  if (!invoice) {
    return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
  }

  const form = await request.formData();
  const file = form.get('file');
  const amount = String(form.get('amount') ?? '').trim();
  const reference = String(form.get('reference') ?? '').trim();
  const notes = String(form.get('notes') ?? '').trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ message: 'Payment proof file is required' }, { status: 400 });
  }

  const pathname = `portal/payment-proofs/${invoice.number.toLowerCase()}-${randomUUID()}-${sanitizeFilename(
    file.name || 'payment-proof.bin'
  )}`;
  const blob = await put(pathname, file, {
    access: 'public',
    addRandomSuffix: false
  });

  const auditNote = [
    `[Portal payment proof uploaded ${formatPortalDateTime(new Date())}]`,
    `Customer email: ${email}`,
    amount ? `Reported amount: ${amount}` : null,
    reference ? `Reference: ${reference}` : null,
    notes ? `Customer note: ${notes}` : null,
    `Proof URL: ${blob.url}`
  ]
    .filter(Boolean)
    .join('\n');

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      notes: appendPortalNote(invoice.notes, auditNote)
    }
  });

  return NextResponse.json({
    message: 'Payment proof uploaded. The finance team can now review it.',
    url: blob.url
  });
}
