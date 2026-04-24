'use client';

import Link from 'next/link';
import { type Column, type ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { buildProjectBoardHref } from '@/lib/project-progress';
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
        <Link
          href={`/dashboard/projects/${row.original.id}`}
          className='font-medium hover:underline'
        >
          {row.original.name}
        </Link>
        <div className='text-muted-foreground text-xs'>
          {row.original.clientCompany ?? row.original.clientName}
        </div>
        <Link
          href={buildProjectBoardHref({
            id: row.original.id,
            name: row.original.name,
            clientName: row.original.clientCompany ?? row.original.clientName,
            status: row.original.status,
            startDate: row.original.startDate,
            endDate: row.original.endDate,
            quotationId: row.original.quotationId,
            budget: row.original.budget
          })}
          className='text-primary mt-1 inline-flex items-center gap-1 text-xs font-medium hover:underline'
        >
          Open board
          <Icons.arrowRight className='h-3.5 w-3.5' />
        </Link>
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
