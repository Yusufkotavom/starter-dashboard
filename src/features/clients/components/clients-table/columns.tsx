'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Client } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import { CLIENT_STATUS_OPTIONS, CLIENT_STATUS_COLORS, CLIENT_STATUS_LABELS } from '../../constants';
import { cn } from '@/lib/utils';

export const columns: ColumnDef<Client>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<Client, unknown> }) => (
      <DataTableColumnHeader column={column} title='Client' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col min-w-[200px]'>
        <span className='font-medium'>{row.original.name}</span>
        {row.original.company ? (
          <span className='text-muted-foreground text-xs'>{row.original.company}</span>
        ) : null}
      </div>
    ),
    meta: {
      label: 'Client Name',
      placeholder: 'Search clients by name, email, company...',
      variant: 'text' as const,
      icon: Icons.search
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'email',
    header: 'Email / Phone',
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='text-sm'>{row.original.email}</span>
        {row.original.phone ? (
          <span className='text-muted-foreground text-xs'>{row.original.phone}</span>
        ) : null}
      </div>
    )
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }: { column: Column<Client, unknown> }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<Client['status']>();
      const colorClass = CLIENT_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
      const label = CLIENT_STATUS_LABELS[status] || status;
      return (
        <Badge variant='outline' className={cn('capitalize rounded-md px-2.5 py-0.5', colorClass)}>
          {label}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: 'Status',
      variant: 'multiSelect' as const,
      options: CLIENT_STATUS_OPTIONS
    }
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<Client, unknown> }) => (
      <DataTableColumnHeader column={column} title='Added On' />
    ),
    cell: ({ cell }) => {
      const date = new Date(cell.getValue<string>());
      return (
        <span className='text-muted-foreground whitespace-nowrap'>{date.toLocaleDateString()}</span>
      );
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
