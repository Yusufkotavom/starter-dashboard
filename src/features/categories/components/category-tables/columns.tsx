'use client';

import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Category } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Category>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<Category, unknown> }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<Category['name']>()}</div>,
    meta: {
      label: 'Name',
      placeholder: 'Search categories...',
      variant: 'text',
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'slug',
    accessorKey: 'slug',
    header: ({ column }: { column: Column<Category, unknown> }) => (
      <DataTableColumnHeader column={column} title='Slug' />
    ),
    cell: ({ cell }) => (
      <div className='font-mono text-sm'>{cell.getValue<Category['slug']>()}</div>
    ),
    meta: {
      label: 'Slug',
      placeholder: 'Search slug...',
      variant: 'text',
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'productCount',
    header: 'PRODUCTS'
  },
  {
    accessorKey: 'description',
    header: 'DESCRIPTION'
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
