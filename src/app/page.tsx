import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isDashboardAdminUser } from '@/lib/access-control';

export default async function Page() {
  const user = await currentUser();

  if (!user) {
    return redirect('/auth/portal/sign-in');
  }

  if (isDashboardAdminUser(user)) {
    redirect('/dashboard/overview');
  }

  redirect('/portal');
}
