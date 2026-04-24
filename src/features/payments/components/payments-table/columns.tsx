'use client';

import { type Column, type ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { formatPrice } from '@/lib/utils';
import type { Payment } from '../../api/types';
import { PAYMENT_METHOD_LABELS } from '../../constants';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Payment>[] = [
  {
    id: 'invoiceNumber',
    accessorKey: 'invoiceNumber',
    header: ({ column }: { column: Column<Payment, unknown> }) => (
      <DataTableColumnHeader column={column} title='Payment' />
    ),
    cell: ({ row }) => (
      <div className='min-w-[220px]'>
        <div className='font-medium'>{row.original.invoiceNumber}</div>
        <div className='text-muted-foreground text-xs'>{row.original.clientName}</div>
        <div className='text-muted-foreground text-xs'>
          Due {formatPrice(row.original.invoiceBalanceDue)} of{' '}
          {formatPrice(row.original.invoiceTotal)}
        </div>
      </div>
    ),
    enableColumnFilter: true,
    meta: {
      label: 'Payment',
      placeholder: 'Search payments...',
      variant: 'text' as const,
      icon: Icons.search
    }
  },
  {
    accessorKey: 'method',
    header: ({ column }: { column: Column<Payment, unknown> }) => (
      <DataTableColumnHeader column={column} title='Method' />
    ),
    cell: ({ row }) => (
      <span>{PAYMENT_METHOD_LABELS[row.original.method] ?? row.original.method}</span>
    )
  },
  {
    accessorKey: 'amount',
    header: ({ column }: { column: Column<Payment, unknown> }) => (
      <DataTableColumnHeader column={column} title='Amount' />
    ),
    cell: ({ row }) => <span>{formatPrice(row.original.amount)}</span>
  },
  {
    accessorKey: 'paidAt',
    header: 'Paid At',
    cell: ({ row }) => (
      <span className='text-muted-foreground text-sm'>
        {new Date(row.original.paidAt).toLocaleDateString()}
      </span>
    )
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
