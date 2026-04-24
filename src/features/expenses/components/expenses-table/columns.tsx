'use client';

import { type Column, type ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { formatPrice } from '@/lib/utils';
import type { Expense } from '../../api/types';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Expense>[] = [
  {
    id: 'category',
    accessorKey: 'category',
    header: ({ column }: { column: Column<Expense, unknown> }) => (
      <DataTableColumnHeader column={column} title='Expense' />
    ),
    cell: ({ row }) => (
      <div className='min-w-[220px]'>
        <div className='font-medium'>{row.original.category}</div>
        <div className='text-muted-foreground text-xs'>
          {row.original.projectName ?? row.original.vendor ?? 'General'}
        </div>
      </div>
    ),
    enableColumnFilter: true,
    meta: {
      label: 'Expense',
      placeholder: 'Search expenses...',
      variant: 'text' as const,
      icon: Icons.search
    }
  },
  {
    accessorKey: 'vendor',
    header: 'Vendor',
    cell: ({ row }) => (
      <span className='text-muted-foreground text-sm'>{row.original.vendor ?? '-'}</span>
    )
  },
  {
    accessorKey: 'amount',
    header: ({ column }: { column: Column<Expense, unknown> }) => (
      <DataTableColumnHeader column={column} title='Amount' />
    ),
    cell: ({ row }) => <span>{formatPrice(row.original.amount)}</span>
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => (
      <span className='text-muted-foreground text-sm'>
        {new Date(row.original.date).toLocaleDateString()}
      </span>
    )
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
