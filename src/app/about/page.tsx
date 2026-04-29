import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MarketingLayout from '@/features/marketing/components/marketing-layout';
import ViewTransitionWrapper from '@/features/marketing/components/view-transition-wrapper';

export const metadata: Metadata = {
  title: 'About | BuildFast Studio'
};

export default function AboutPage() {
  return (
    <MarketingLayout>
      <section className='mx-auto w-full max-w-7xl px-4 py-14 md:px-8 md:py-20'>
        <ViewTransitionWrapper className='vt-rise'>
          <h1 className='text-4xl font-semibold tracking-tight md:text-5xl'>
            About BuildFast Studio
          </h1>
        </ViewTransitionWrapper>
        <p className='mt-4 max-w-3xl text-slate-600'>
          Kami adalah tim product engineer yang fokus membangun software operasional dan website
          bisnis yang siap dipakai tim Anda setiap hari.
        </p>

        <div className='mt-10 grid gap-4 md:grid-cols-3'>
          <Card>
            <CardHeader>
              <CardTitle>Pragmatic by Design</CardTitle>
            </CardHeader>
            <CardContent className='text-sm text-slate-600'>
              Kami memilih solusi yang paling cepat memberi hasil, bukan yang paling rumit.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Business First</CardTitle>
            </CardHeader>
            <CardContent className='text-sm text-slate-600'>
              Setiap fitur diukur terhadap outcome bisnis: lead, efisiensi, atau revenue impact.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Production Ready</CardTitle>
            </CardHeader>
            <CardContent className='text-sm text-slate-600'>
              Dari arsitektur hingga deployment, kami siapkan fondasi yang tahan dipakai jangka
              panjang.
            </CardContent>
          </Card>
        </div>
      </section>
    </MarketingLayout>
  );
}
