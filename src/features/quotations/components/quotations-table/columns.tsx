'use client';

import { type Column, type ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { cn, formatPrice } from '@/lib/utils';
import type { Quotation } from '../../api/types';
import {
  QUOTATION_STATUS_COLORS,
  QUOTATION_STATUS_LABELS,
  QUOTATION_STATUS_OPTIONS
} from '../../constants';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Quotation>[] = [
  {
    id: 'number',
    accessorKey: 'number',
    header: ({ column }: { column: Column<Quotation, unknown> }) => (
      <DataTableColumnHeader column={column} title='Quotation' />
    ),
    cell: ({ row }) => (
      <div className='min-w-[220px]'>
        <div className='font-medium'>{row.original.number}</div>
        <div className='text-muted-foreground text-xs'>
          {row.original.clientCompany ?? row.original.clientName}
        </div>
      </div>
    ),
    enableColumnFilter: true,
    meta: {
      label: 'Quotation',
      placeholder: 'Search quotations...',
      variant: 'text' as const,
      icon: Icons.search
    }
  },
  {
    accessorKey: 'status',
    header: ({ column }: { column: Column<Quotation, unknown> }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<Quotation['status']>();
      return (
        <Badge
          variant='outline'
          className={cn(
            'rounded-md px-2.5 py-0.5',
            QUOTATION_STATUS_COLORS[status] ?? 'text-slate-700 bg-slate-50 border-slate-200'
          )}
        >
          {QUOTATION_STATUS_LABELS[status] ?? status}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: 'Status',
      variant: 'multiSelect' as const,
      options: QUOTATION_STATUS_OPTIONS
    }
  },
  {
    accessorKey: 'itemsCount',
    header: 'Items',
    cell: ({ row }) => <span>{row.original.itemsCount}</span>
  },
  {
    accessorKey: 'total',
    header: ({ column }: { column: Column<Quotation, unknown> }) => (
      <DataTableColumnHeader column={column} title='Total' />
    ),
    cell: ({ row }) => <span>{formatPrice(row.original.total)}</span>
  },
  {
    accessorKey: 'validUntil',
    header: 'Valid Until',
    cell: ({ row }) => (
      <span className='text-muted-foreground text-sm'>
        {row.original.validUntil ? new Date(row.original.validUntil).toLocaleDateString() : '-'}
      </span>
    )
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
