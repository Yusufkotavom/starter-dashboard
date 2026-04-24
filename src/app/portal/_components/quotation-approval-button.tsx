'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface QuotationApprovalButtonProps {
  quotationId: number;
  disabled?: boolean;
}

export function QuotationApprovalButton({
  quotationId,
  disabled = false
}: QuotationApprovalButtonProps) {
  const [intentNotes, setIntentNotes] = useState('');
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submitApproval = () => {
    startTransition(async () => {
      const response = await fetch(`/api/portal/quotations/${quotationId}/approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: intentNotes
        })
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        toast.error(payload?.message ?? 'Failed to submit approval');
        return;
      }

      toast.success(payload?.message ?? 'Quotation approval submitted');
      setOpen(false);
      setIntentNotes('');
    });
  };

  if (!open) {
    return (
      <Button disabled={disabled} onClick={() => setOpen(true)} size='sm'>
        Approve quotation
      </Button>
    );
  }

  return (
    <div className='space-y-3 rounded-xl border bg-muted/30 p-4'>
      <div className='space-y-1'>
        <div className='text-sm font-medium'>Approval intent</div>
        <p className='text-muted-foreground text-sm'>
          Confirm this quotation is acceptable. You can add a note for the agency team.
        </p>
      </div>
      <textarea
        className='min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none'
        onChange={(event) => setIntentNotes(event.target.value)}
        placeholder='Optional note for kickoff, PO number, or commercial confirmation.'
        value={intentNotes}
      />
      <div className='flex gap-2'>
        <Button isLoading={isPending} onClick={submitApproval} size='sm'>
          Submit approval
        </Button>
        <Button disabled={isPending} onClick={() => setOpen(false)} size='sm' variant='outline'>
          Cancel
        </Button>
      </div>
    </div>
  );
}
