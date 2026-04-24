'use client';

import { type Column, type ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { cn, formatPrice } from '@/lib/utils';
import type { Invoice } from '../../api/types';
import {
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_OPTIONS
} from '../../constants';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Invoice>[] = [
  {
    id: 'number',
    accessorKey: 'number',
    header: ({ column }: { column: Column<Invoice, unknown> }) => (
      <DataTableColumnHeader column={column} title='Invoice' />
    ),
    cell: ({ row }) => (
      <div className='min-w-[220px]'>
        <div className='font-medium'>{row.original.number}</div>
        <div className='text-muted-foreground text-xs'>{row.original.clientName}</div>
      </div>
    ),
    enableColumnFilter: true,
    meta: {
      label: 'Invoice',
      placeholder: 'Search invoices...',
      variant: 'text' as const,
      icon: Icons.search
    }
  },
  {
    accessorKey: 'status',
    header: ({ column }: { column: Column<Invoice, unknown> }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<Invoice['status']>();
      return (
        <Badge
          variant='outline'
          className={cn(
            'rounded-md px-2.5 py-0.5',
            INVOICE_STATUS_COLORS[status] ?? 'text-slate-700 bg-slate-50 border-slate-200'
          )}
        >
          {INVOICE_STATUS_LABELS[status] ?? status}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: 'Status',
      variant: 'multiSelect' as const,
      options: INVOICE_STATUS_OPTIONS
    }
  },
  {
    accessorKey: 'projectName',
    header: 'Project',
    cell: ({ row }) => (
      <span className='text-muted-foreground text-sm'>{row.original.projectName ?? '-'}</span>
    )
  },
  {
    accessorKey: 'total',
    header: ({ column }: { column: Column<Invoice, unknown> }) => (
      <DataTableColumnHeader column={column} title='Total' />
    ),
    cell: ({ row }) => <span>{formatPrice(row.original.total)}</span>
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    cell: ({ row }) => (
      <span className='text-muted-foreground text-sm'>
        {row.original.dueDate ? new Date(row.original.dueDate).toLocaleDateString() : '-'}
      </span>
    )
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
