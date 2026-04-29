import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MarketingLayout from '@/features/marketing/components/marketing-layout';
import ViewTransitionWrapper from '@/features/marketing/components/view-transition-wrapper';

export const metadata: Metadata = {
  title: 'Contact | BuildFast Studio'
};

export default function ContactPage() {
  return (
    <MarketingLayout>
      <section className='mx-auto w-full max-w-7xl px-4 py-14 md:px-8 md:py-20'>
        <ViewTransitionWrapper className='vt-rise'>
          <h1 className='text-4xl font-semibold tracking-tight md:text-5xl'>Contact</h1>
        </ViewTransitionWrapper>
        <p className='mt-4 max-w-3xl text-slate-600'>
          Siap diskusi kebutuhan software atau website Anda. Kirim konteks bisnis, target, dan
          timeline, nanti kami bantu mapping solusi paling efektif.
        </p>

        <div className='mt-10 grid gap-4 md:grid-cols-3'>
          <Card>
            <CardHeader>
              <CardTitle>Discovery Call</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 text-sm text-slate-600'>
              <p>Bahas requirement, scope, dan estimasi delivery.</p>
              <Button asChild className='w-full'>
                <Link href='/auth/sign-in'>Book Call</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Explore Services</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 text-sm text-slate-600'>
              <p>Lihat contoh service dan jalur implementasi.</p>
              <Button asChild variant='outline' className='w-full'>
                <Link href='/services'>Open Services</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Lead Magnet</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 text-sm text-slate-600'>
              <p>Unduh checklist scope untuk persiapan proyek.</p>
              <Button asChild variant='outline' className='w-full'>
                <Link href='/lead-magnet'>Get Checklist</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </MarketingLayout>
  );
}
