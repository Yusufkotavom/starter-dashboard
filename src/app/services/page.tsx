import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MarketingLayout from '@/features/marketing/components/marketing-layout';
import ViewTransitionWrapper from '@/features/marketing/components/view-transition-wrapper';

export const metadata: Metadata = {
  title: 'Services | BuildFast Studio'
};

const services = [
  {
    title: 'Custom Software Development',
    description: 'Bangun internal tools, automation, dan dashboard sesuai alur bisnis Anda.',
    outcome: 'Operasional lebih cepat, proses manual berkurang drastis.',
    href: '/dashboard/product'
  },
  {
    title: 'Website Design & Development',
    description: 'Website perusahaan dan landing page dengan fokus conversion.',
    outcome: 'Lead masuk lebih terukur dengan UX mobile-first.',
    href: '/dashboard/categories'
  },
  {
    title: 'API & System Integration',
    description: 'Hubungkan CRM, payment, portal, dan reporting ke satu pipeline.',
    outcome: 'Data sinkron, tim lebih mudah ambil keputusan.',
    href: '/dashboard/docs'
  }
];

export default function ServicesPage() {
  return (
    <MarketingLayout>
      <section className='mx-auto w-full max-w-7xl px-4 py-14 md:px-8 md:py-20'>
        <ViewTransitionWrapper className='vt-rise'>
          <h1 className='text-4xl font-semibold tracking-tight md:text-5xl'>Service</h1>
        </ViewTransitionWrapper>
        <p className='mt-4 max-w-3xl text-slate-600'>
          Paket layanan kami dirancang untuk mempercepat delivery software dan website tanpa
          mengorbankan kualitas.
        </p>

        <div className='mt-10 grid gap-4 md:grid-cols-3'>
          {services.map((service) => (
            <Card key={service.title} className='h-full'>
              <CardHeader>
                <CardTitle>{service.title}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <p className='text-sm text-slate-600'>{service.outcome}</p>
                <Button asChild variant='outline' className='w-full'>
                  <Link href={service.href}>Link ke Product Service Lokal</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
