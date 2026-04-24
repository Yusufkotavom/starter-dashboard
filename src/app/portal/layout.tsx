import type { ReactNode } from 'react';
import Link from 'next/link';
import { Icons } from '@/components/icons';

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className='min-h-screen bg-muted/20'>
      <header className='border-b bg-background'>
        <div className='mx-auto flex max-w-7xl items-center justify-between px-6 py-4'>
          <Link href='/portal' className='flex items-center gap-3 font-semibold'>
            <span className='flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary'>
              <Icons.dashboard className='h-5 w-5' />
            </span>
            <span>Client Portal</span>
          </Link>
          <div className='flex items-center gap-2 text-sm'>
            <Link href='/portal' className='text-muted-foreground hover:text-foreground'>
              Overview
            </Link>
            <span className='text-muted-foreground'>/</span>
            <Link
              href='/portal/subscriptions'
              className='text-muted-foreground hover:text-foreground'
            >
              Subscriptions
            </Link>
            <span className='text-muted-foreground'>/</span>
            <Link
              href='/portal/digital-access'
              className='text-muted-foreground hover:text-foreground'
            >
              Digital Access
            </Link>
          </div>
        </div>
      </header>
      <main className='mx-auto max-w-7xl px-6 py-8'>{children}</main>
    </div>
  );
}
