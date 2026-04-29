import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MarketingLayout from '@/features/marketing/components/marketing-layout';
import ViewTransitionWrapper from '@/features/marketing/components/view-transition-wrapper';

export default function HomePage() {
  return (
    <MarketingLayout>
      <section className='mx-auto w-full max-w-7xl px-4 pb-14 pt-14 md:px-8 md:pb-20 md:pt-20'>
        <div className='grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center'>
          <ViewTransitionWrapper className='vt-rise'>
            <div className='space-y-6'>
              <Badge className='rounded-full bg-sky-100 px-3 py-1 text-sky-800 hover:bg-sky-100'>
                Jasa Pembuatan Software & Website
              </Badge>
              <h1 className='max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl'>
                Bangun sistem digital yang langsung berdampak ke bisnis.
              </h1>
              <p className='max-w-xl text-base leading-relaxed text-slate-600 md:text-lg'>
                Kami membantu Anda merancang, membangun, dan mengintegrasikan software serta website
                production-grade dengan pendekatan cepat, terukur, dan fokus hasil.
              </p>
              <div className='flex flex-wrap items-center gap-3'>
                <Button asChild size='lg' className='h-12 px-6'>
                  <Link href='/services'>Lihat Layanan</Link>
                </Button>
                <Button asChild variant='outline' size='lg' className='h-12 px-6'>
                  <Link href='/contact'>Diskusi Proyek</Link>
                </Button>
              </div>
            </div>
          </ViewTransitionWrapper>

          <ViewTransitionWrapper className='vt-fade'>
            <Card className='rounded-3xl border-slate-200 bg-white shadow-[0_20px_60px_-28px_rgba(15,23,42,0.35)]'>
              <CardHeader>
                <CardTitle>Kenapa Tim Memilih Kami</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3 text-sm text-slate-700'>
                <p>1. Scope jelas sejak awal untuk hindari overbudget.</p>
                <p>2. Delivery sprint terukur dengan update progres berkala.</p>
                <p>3. Arsitektur scalable dari MVP sampai growth stage.</p>
                <p>4. Dukungan pasca go-live untuk stabilitas sistem.</p>
              </CardContent>
            </Card>
          </ViewTransitionWrapper>
        </div>
      </section>
    </MarketingLayout>
  );
}
