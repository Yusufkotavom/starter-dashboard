import type { ReactNode } from 'react';
import { PortalSidebar } from '@/app/portal/_components/portal-sidebar';

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className='min-h-screen bg-muted/20'>
      <main className='mx-auto max-w-7xl px-6 py-8'>
        <div className='grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start'>
          <PortalSidebar />
          <section className='min-w-0'>{children}</section>
        </div>
      </main>
    </div>
  );
}
