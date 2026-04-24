'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { deleteInvoiceMutation, sendInvoiceMutation } from '../../api/mutations';
import type { Invoice } from '../../api/types';

interface CellActionProps {
  data: Invoice;
}

export function CellAction({ data }: CellActionProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const documentUrl = `/documents/invoices/${data.id}`;
  const pdfUrl = `/api/invoices/${data.id}/pdf`;

  const deleteMutation = useMutation({
    ...deleteInvoiceMutation,
    onSuccess: () => {
      toast.success('Invoice deleted successfully');
      setDeleteOpen(false);
    },
    onError: () => toast.error('Failed to delete invoice')
  });

  const sendMutation = useMutation({
    ...sendInvoiceMutation,
    onSuccess: (result) => {
      toast.success(`Invoice sent via ${result.provider}`);
    },
    onError: () => toast.error('Failed to send invoice')
  });

  return (
    <>
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(data.id)}
        loading={deleteMutation.isPending}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 border-0 p-0'>
            <span className='sr-only'>Open menu</span>
            <Icons.ellipsis className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => sendMutation.mutate(data.id)}
            disabled={sendMutation.isPending}
          >
            <Icons.send className='mr-2 h-4 w-4' />
            Send Email
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => window.open(documentUrl, '_blank', 'noopener,noreferrer')}
          >
            <Icons.externalLink className='mr-2 h-4 w-4' />
            Open Document
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => window.open(`${documentUrl}?print=1`, '_blank', 'noopener,noreferrer')}
          >
            <Icons.page className='mr-2 h-4 w-4' />
            Print
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.open(pdfUrl, '_blank', 'noopener,noreferrer')}>
            <Icons.fileTypePdf className='mr-2 h-4 w-4' />
            Download PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/dashboard/invoices/${data.id}`)}>
            <Icons.edit className='mr-2 h-4 w-4' />
            Update
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
            <Icons.trash className='mr-2 h-4 w-4' />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
