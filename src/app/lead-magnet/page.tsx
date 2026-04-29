import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MarketingLayout from '@/features/marketing/components/marketing-layout';
import LeadMagnetForm from '@/features/marketing/components/lead-magnet-form';
import ViewTransitionWrapper from '@/features/marketing/components/view-transition-wrapper';

export const metadata: Metadata = {
  title: 'Lead Magnet | BuildFast Studio'
};

export default function LeadMagnetPage() {
  return (
    <MarketingLayout>
      <section className='mx-auto w-full max-w-7xl px-4 py-14 md:px-8 md:py-20'>
        <ViewTransitionWrapper className='vt-rise'>
          <h1 className='text-4xl font-semibold tracking-tight md:text-5xl'>Lead Magnet</h1>
        </ViewTransitionWrapper>
        <p className='mt-4 max-w-3xl text-slate-600'>
          Dapatkan <strong>Software Scope Checklist</strong> gratis untuk memastikan proyek Anda
          mulai dengan requirement yang rapi dan realistis.
        </p>

        <div className='mt-10 grid gap-6 md:grid-cols-[1.1fr_0.9fr]'>
          <Card>
            <CardHeader>
              <CardTitle>Apa yang Anda dapatkan</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2 text-sm text-slate-600'>
              <p>• Template validasi scope sebelum development</p>
              <p>• Checklist prioritas fitur must-have vs nice-to-have</p>
              <p>• Delivery checkpoint untuk hindari molor timeline</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Unduh Gratis</CardTitle>
              <CardDescription>Email saja, tanpa form panjang.</CardDescription>
            </CardHeader>
            <CardContent>
              <LeadMagnetForm />
            </CardContent>
          </Card>
        </div>
      </section>
    </MarketingLayout>
  );
}
