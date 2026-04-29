'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LeadMagnetForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className='space-y-3'>
        <p className='rounded-md bg-emerald-50 p-3 text-sm text-emerald-700'>
          Terima kasih. Checklist siap diunduh.
        </p>
        <Button asChild className='h-11 w-full'>
          <Link href='/lead-magnet/software-scope-checklist.md' download>
            Download Checklist
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form className='space-y-3' onSubmit={handleSubmit}>
      <Input
        type='email'
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder='nama@email.com'
        required
      />
      <Button type='submit' className='h-11 w-full'>
        Get My Checklist
      </Button>
      <p className='text-xs text-slate-500'>No spam. Unsubscribe kapan saja.</p>
    </form>
  );
}
