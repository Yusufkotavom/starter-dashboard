'use client';

import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { getSortingStateParser } from '@/lib/parsers';
import { expensesQueryOptions } from '../../api/queries';
import type { Expense } from '../../api/types';
import { ExpenseFormSheet } from '../expense-form-sheet';
import { columns } from './columns';

export function ExpensesTable() {
  const [activeExpense, setActiveExpense] = useState<Expense | undefined>(undefined);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    sort: getSortingStateParser(['category', 'amount', 'date']).withDefault([])
  });

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.name && { search: params.name }),
    ...(params.sort.length > 0 && { sort: JSON.stringify(params.sort) })
  };

  const { data } = useSuspenseQuery(expensesQueryOptions(filters));
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
          setActiveExpense(row);
          setIsSheetOpen(true);
        }}
      >
        <DataTableToolbar table={table} />
      </DataTable>
      <ExpenseFormSheet expense={activeExpense} open={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </>
  );
}

export function ExpensesTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
