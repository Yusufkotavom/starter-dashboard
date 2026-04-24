'use client';

import { type Column, type ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { cn, formatPrice } from '@/lib/utils';
import type { Project } from '../../api/types';
import {
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_OPTIONS
} from '../../constants';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Project>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<Project, unknown> }) => (
      <DataTableColumnHeader column={column} title='Project' />
    ),
    cell: ({ row }) => (
      <div className='min-w-[220px]'>
        <div className='font-medium'>{row.original.name}</div>
        <div className='text-muted-foreground text-xs'>
          {row.original.clientCompany ?? row.original.clientName}
        </div>
      </div>
    ),
    meta: {
      label: 'Project Name',
      placeholder: 'Search projects...',
      variant: 'text' as const,
      icon: Icons.search
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'status',
    header: ({ column }: { column: Column<Project, unknown> }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<Project['status']>();

      return (
        <Badge
          variant='outline'
          className={cn(
            'rounded-md px-2.5 py-0.5 capitalize',
            PROJECT_STATUS_COLORS[status] ?? 'text-slate-700 bg-slate-50 border-slate-200'
          )}
        >
          {PROJECT_STATUS_LABELS[status] ?? status}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: 'Status',
      variant: 'multiSelect' as const,
      options: PROJECT_STATUS_OPTIONS
    }
  },
  {
    accessorKey: 'budget',
    header: ({ column }: { column: Column<Project, unknown> }) => (
      <DataTableColumnHeader column={column} title='Budget' />
    ),
    cell: ({ row }) => (
      <span className='whitespace-nowrap'>
        {row.original.budget ? formatPrice(Number(row.original.budget)) : '-'}
      </span>
    )
  },
  {
    accessorKey: 'startDate',
    header: 'Timeline',
    cell: ({ row }) => {
      const start = row.original.startDate
        ? new Date(row.original.startDate).toLocaleDateString()
        : 'TBD';
      const end = row.original.endDate ? new Date(row.original.endDate).toLocaleDateString() : '-';

      return (
        <div className='text-muted-foreground flex flex-col text-xs'>
          <span>Start: {start}</span>
          <span>End: {end}</span>
        </div>
      );
    }
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<Project, unknown> }) => (
      <DataTableColumnHeader column={column} title='Created' />
    ),
    cell: ({ row }) => (
      <span className='text-muted-foreground whitespace-nowrap text-sm'>
        {new Date(row.original.createdAt).toLocaleDateString()}
      </span>
    )
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
