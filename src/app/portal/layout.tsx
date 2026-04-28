import type { ReactNode } from 'react';
import KBar from '@/components/kbar';
import Header from '@/components/layout/header';
import { InfoSidebar } from '@/components/layout/info-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { InfobarProvider } from '@/components/ui/infobar';
import { PortalSidebar } from '@/app/portal/_components/portal-sidebar';
import { cookies } from 'next/headers';

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <KBar>
      <SidebarProvider defaultOpen={defaultOpen}>
        <InfobarProvider defaultOpen={false}>
          <PortalSidebar />
          <SidebarInset>
            <Header />
            <div className='flex flex-1 flex-col p-4 md:px-6'>{children}</div>
          </SidebarInset>
          <InfoSidebar side='right' />
        </InfobarProvider>
      </SidebarProvider>
    </KBar>
  );
}
