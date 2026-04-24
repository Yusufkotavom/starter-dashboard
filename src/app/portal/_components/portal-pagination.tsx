import Link from 'next/link';
import type { PortalPaginationMeta } from '@/lib/customer-portal';

interface PortalPaginationProps {
  basePath: string;
  pagination: PortalPaginationMeta;
}

function buildHref(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

export function PortalPagination({ basePath, pagination }: PortalPaginationProps) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div className='flex flex-col gap-3 border-t pt-4 text-sm md:flex-row md:items-center md:justify-between'>
      <div className='text-muted-foreground'>
        Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} items
      </div>
      <div className='flex gap-2'>
        <Link
          aria-disabled={!pagination.hasPreviousPage}
          className='inline-flex rounded-lg border px-3 py-2 font-medium aria-disabled:pointer-events-none aria-disabled:opacity-50'
          href={buildHref(basePath, pagination.page - 1)}
        >
          Previous
        </Link>
        <Link
          aria-disabled={!pagination.hasNextPage}
          className='inline-flex rounded-lg border px-3 py-2 font-medium aria-disabled:pointer-events-none aria-disabled:opacity-50'
          href={buildHref(basePath, pagination.page + 1)}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
