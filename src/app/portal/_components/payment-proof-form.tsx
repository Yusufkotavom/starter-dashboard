'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface PaymentProofFormProps {
  invoiceId: number;
  invoiceNumber: string;
  suggestedAmount: number;
}

export function PaymentProofForm({
  invoiceId,
  invoiceNumber,
  suggestedAmount
}: PaymentProofFormProps) {
  const [amount, setAmount] = useState(
    suggestedAmount > 0 ? String(Math.round(suggestedAmount)) : ''
  );
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submitProof = () => {
    if (!file) {
      toast.error('Payment proof file is required');
      return;
    }

    startTransition(async () => {
      const form = new FormData();
      form.append('file', file);
      form.append('amount', amount);
      form.append('reference', reference);
      form.append('notes', notes);

      const response = await fetch(`/api/portal/invoices/${invoiceId}/payment-proof`, {
        method: 'POST',
        body: form
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        toast.error(payload?.message ?? 'Failed to upload payment proof');
        return;
      }

      toast.success(payload?.message ?? 'Payment proof uploaded');
      setOpen(false);
      setAmount(suggestedAmount > 0 ? String(Math.round(suggestedAmount)) : '');
      setReference('');
      setNotes('');
      setFile(null);
    });
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size='sm' variant='outline'>
        Upload payment proof
      </Button>
    );
  }

  return (
    <div className='space-y-3 rounded-xl border bg-muted/30 p-4'>
      <div className='space-y-1'>
        <div className='text-sm font-medium'>Payment proof for {invoiceNumber}</div>
        <p className='text-muted-foreground text-sm'>
          Upload transfer proof or receipt. The agency team can validate it manually.
        </p>
      </div>
      <div className='grid gap-3 md:grid-cols-2'>
        <input
          className='rounded-lg border bg-background px-3 py-2 text-sm outline-none'
          inputMode='decimal'
          onChange={(event) => setAmount(event.target.value)}
          placeholder='Amount paid'
          value={amount}
        />
        <input
          className='rounded-lg border bg-background px-3 py-2 text-sm outline-none'
          onChange={(event) => setReference(event.target.value)}
          placeholder='Bank ref / transaction ref'
          value={reference}
        />
      </div>
      <textarea
        className='min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none'
        onChange={(event) => setNotes(event.target.value)}
        placeholder='Optional notes for the finance team.'
        value={notes}
      />
      <input
        accept='.pdf,image/*'
        className='block w-full text-sm'
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        type='file'
      />
      <div className='flex gap-2'>
        <Button isLoading={isPending} onClick={submitProof} size='sm'>
          Send proof
        </Button>
        <Button disabled={isPending} onClick={() => setOpen(false)} size='sm' variant='outline'>
          Cancel
        </Button>
      </div>
    </div>
  );
}
