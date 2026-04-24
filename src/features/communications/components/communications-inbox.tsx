'use client';

import Link from 'next/link';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { communicationsQueryOptions } from '../api/queries';
import type { CommunicationConversation, CommunicationFilters } from '../api/types';

interface CommunicationsInboxProps {
  filters: CommunicationFilters;
}

function formatMessageTimestamp(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

function getConversationInitials(conversation: CommunicationConversation): string {
  const source = conversation.displayName || conversation.clientName || conversation.phone;

  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function ConversationRow({ conversation }: { conversation: CommunicationConversation }) {
  const hasUnread = conversation.unreadCount > 0;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-colors hover:bg-accent/30',
        hasUnread && 'border-primary/40 bg-primary/5'
      )}
    >
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div className='flex min-w-0 flex-1 items-start gap-3'>
          <Avatar className='size-11 border'>
            <AvatarFallback>{getConversationInitials(conversation)}</AvatarFallback>
          </Avatar>
          <div className='min-w-0 flex-1 space-y-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <div className='truncate font-medium'>
                {conversation.displayName || conversation.clientName || 'WhatsApp contact'}
              </div>
              <Badge variant={hasUnread ? 'default' : 'secondary'}>
                {hasUnread ? `${conversation.unreadCount} unread` : 'Read'}
              </Badge>
            </div>

            <div className='text-muted-foreground flex flex-wrap items-center gap-3 text-sm'>
              <span className='inline-flex items-center gap-1'>
                <Icons.phone className='size-4' />
                {conversation.phone}
              </span>
              {conversation.clientId ? (
                <span className='inline-flex items-center gap-1'>
                  <Icons.user className='size-4' />
                  {conversation.clientCompany || conversation.clientName}
                </span>
              ) : (
                <span className='inline-flex items-center gap-1'>
                  <Icons.user className='size-4' />
                  Not attached to a client
                </span>
              )}
            </div>

            <p className='text-muted-foreground line-clamp-2 text-sm'>
              {conversation.lastMessagePreview}
            </p>
          </div>
        </div>

        <div className='flex items-center justify-between gap-3 lg:flex-col lg:items-end'>
          <div className='text-muted-foreground text-sm'>
            {conversation.lastMessageAt ? formatMessageTimestamp(conversation.lastMessageAt) : '-'}
          </div>
          <Button asChild size='sm'>
            <Link href={`/dashboard/communications/${conversation.id}`}>
              Open thread
              <Icons.arrowRight className='size-4' />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CommunicationsInbox({ filters }: CommunicationsInboxProps) {
  const { data } = useSuspenseQuery(communicationsQueryOptions(filters));
  const unreadThreads = data.items.filter((conversation) => conversation.unreadCount > 0).length;

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader className='gap-3 md:flex-row md:items-end md:justify-between'>
          <div>
            <CardTitle>Inbox queue</CardTitle>
            <CardDescription>
              Review WhatsApp conversations, see unread threads first, and continue the thread from
              the detail view.
            </CardDescription>
          </div>
          <div className='grid grid-cols-2 gap-3 text-sm md:w-auto'>
            <div className='rounded-lg border px-4 py-3'>
              <div className='text-muted-foreground'>Total threads</div>
              <div className='text-xl font-semibold'>{data.total_items}</div>
            </div>
            <div className='rounded-lg border px-4 py-3'>
              <div className='text-muted-foreground'>Unread</div>
              <div className='text-xl font-semibold'>{unreadThreads}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className='grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]'>
            <label className='flex items-center gap-2 rounded-lg border px-3'>
              <Icons.search className='text-muted-foreground size-4' />
              <input
                type='search'
                name='search'
                defaultValue={filters.search ?? ''}
                placeholder='Search phone, client, or message'
                className='placeholder:text-muted-foreground h-10 w-full bg-transparent text-sm outline-none'
              />
            </label>
            <label className='flex items-center gap-2 rounded-lg border px-3 text-sm'>
              <input
                type='checkbox'
                name='unreadOnly'
                value='true'
                defaultChecked={filters.unreadOnly}
                className='accent-primary'
              />
              Unread only
            </label>
            <Button type='submit'>
              <Icons.search className='size-4' />
              Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className='space-y-4 pt-6'>
          {data.items.length === 0 ? (
            <div className='text-muted-foreground flex min-h-52 flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-center'>
              <Icons.chat className='size-8' />
              <div>
                <div className='font-medium text-foreground'>No conversations found</div>
                <div className='text-sm'>
                  Adjust the filter or wait until new WhatsApp messages arrive.
                </div>
              </div>
            </div>
          ) : (
            data.items.map((conversation, index) => (
              <div key={conversation.id}>
                {index > 0 && <Separator className='mb-4' />}
                <ConversationRow conversation={conversation} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function CommunicationsInboxSkeleton() {
  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <div className='bg-muted h-6 w-48 animate-pulse rounded-md' />
          <div className='bg-muted h-4 w-80 animate-pulse rounded-md' />
        </CardHeader>
        <CardContent>
          <div className='bg-muted h-10 w-full animate-pulse rounded-lg' />
        </CardContent>
      </Card>
      <Card>
        <CardContent className='space-y-4 pt-6'>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className='rounded-xl border p-4'>
              <div className='flex items-start gap-3'>
                <div className='bg-muted size-11 animate-pulse rounded-full' />
                <div className='min-w-0 flex-1 space-y-2'>
                  <div className='bg-muted h-4 w-52 animate-pulse rounded-md' />
                  <div className='bg-muted h-4 w-64 animate-pulse rounded-md' />
                  <div className='bg-muted h-4 w-full animate-pulse rounded-md' />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
