import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Service' },
  { href: '/lead-magnet', label: 'Lead Magnet' },
  { href: '/contact', label: 'Contact' }
];

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <main className='min-h-screen bg-[radial-gradient(circle_at_top,#def6ff_0%,#f8fbff_35%,#ffffff_70%)] text-slate-900'>
      <header className='sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur'>
        <div className='mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-8'>
          <Link href='/' className='inline-flex items-center gap-2'>
            <span className='inline-flex size-8 items-center justify-center rounded-md bg-slate-900 text-white'>
              <Icons.sparkles className='size-4' />
            </span>
            <span className='text-sm font-semibold tracking-tight md:text-base'>
              BuildFast Studio
            </span>
          </Link>
          <nav className='hidden items-center gap-6 text-sm text-slate-600 md:flex'>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <Button asChild size='sm'>
            <Link href='/auth/sign-in'>Start Consultation</Link>
          </Button>
        </div>
      </header>

      {children}
    </main>
  );
}
