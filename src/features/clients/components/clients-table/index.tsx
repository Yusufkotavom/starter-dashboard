'use client';

import { useState } from 'react';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { clientsQueryOptions } from '../../api/queries';
import type { Client } from '../../api/types';
import { ClientFormSheet } from '../client-form-sheet';
import { columns } from './columns';

export function ClientsTable() {
  const [activeClient, setActiveClient] = useState<Client | undefined>(undefined);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    status: parseAsString,
    sort: getSortingStateParser(['name', 'status', 'createdAt', 'email']).withDefault([])
  });

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.name && { search: params.name }),
    ...(params.status && { status: params.status }),
    ...(params.sort.length > 0 && { sort: JSON.stringify(params.sort) })
  };

  const { data } = useSuspenseQuery(clientsQueryOptions(filters));

  const pageCount = Math.ceil(data.total_items / params.perPage);

  const { table } = useDataTable({
    data: data.items,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    initialState: {
      columnPinning: { right: ['actions'] }
    }
  });

  return (
    <>
      <DataTable
        table={table}
        onRowClick={(row) => {
          setActiveClient(row);
          setIsSheetOpen(true);
        }}
      >
        <DataTableToolbar table={table} />
      </DataTable>
      <ClientFormSheet client={activeClient} open={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </>
  );
}

export function ClientsTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
