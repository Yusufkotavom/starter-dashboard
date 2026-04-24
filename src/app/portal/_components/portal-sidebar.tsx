'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

const portalNavItems = [
  {
    title: 'Overview',
    href: '/portal',
    icon: 'dashboard'
  },
  {
    title: 'Order',
    href: '/portal/orders',
    icon: 'add'
  },
  {
    title: 'Invoices',
    href: '/portal/invoices',
    icon: 'billing'
  },
  {
    title: 'Quotations',
    href: '/portal/quotations',
    icon: 'post'
  },
  {
    title: 'Projects',
    href: '/portal/projects',
    icon: 'workspace'
  },
  {
    title: 'Subscriptions',
    href: '/portal/subscriptions',
    icon: 'sparkles'
  },
  {
    title: 'Digital Access',
    href: '/portal/digital-access',
    icon: 'externalLink'
  }
] as const;

export function PortalSidebar() {
  const pathname = usePathname();

  return (
    <aside className='w-full rounded-3xl border bg-background p-4 lg:sticky lg:top-6 lg:w-72'>
      <div className='mb-4 flex items-center gap-3 px-2'>
        <span className='flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
          <Icons.dashboard className='h-5 w-5' />
        </span>
        <div>
          <div className='font-semibold'>Client Portal</div>
          <div className='text-muted-foreground text-xs'>Orders, billing, and delivery</div>
        </div>
      </div>

      <nav className='space-y-1'>
        {portalNavItems.map((item) => {
          const Icon = Icons[item.icon];
          const isActive =
            item.href === '/portal'
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className='h-4 w-4' />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
