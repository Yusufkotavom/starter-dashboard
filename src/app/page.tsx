import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isDashboardAdminUser } from '@/lib/access-control';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function Page() {
  const user = await currentUser();

  if (!user) {
    return (
      <main className='mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-10'>
        <div className='grid w-full gap-4 md:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Client Portal</CardTitle>
              <CardDescription>
                Access invoices, quotations, projects, and product delivery.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className='w-full'>
                <Link href='/auth/portal/sign-in'>Open Portal</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Admin Dashboard</CardTitle>
              <CardDescription>
                Internal workspace for CRM, project management, and operations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant='outline' className='w-full'>
                <Link href='/auth/sign-in'>Open Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (isDashboardAdminUser(user)) {
    redirect('/dashboard/overview');
  }

  redirect('/portal');
}
