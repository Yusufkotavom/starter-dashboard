'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { settingsQueryOptions } from '@/features/settings/api/queries';

interface CompanyBrandProps {
  compact?: boolean;
  subtitle?: string;
}

export function CompanyBrand({ compact = false, subtitle }: CompanyBrandProps) {
  const { data } = useQuery(settingsQueryOptions());
  const logoUrl = data?.companyLogoUrl ?? null;
  const companyName = data?.companyName ?? 'Company';

  return (
    <div className='flex items-center gap-3 px-2'>
      <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-9 shrink-0 items-center justify-center rounded-lg'>
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={companyName}
            width={24}
            height={24}
            className='h-6 w-6 object-contain'
          />
        ) : (
          <Icons.dashboard className='size-4' />
        )}
      </div>
      {!compact ? (
        <div className='min-w-0'>
          <div className='truncate text-sm font-semibold'>{companyName}</div>
          {subtitle ? (
            <div className='text-sidebar-foreground/70 truncate text-xs'>{subtitle}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
