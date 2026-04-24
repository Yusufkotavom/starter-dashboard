'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { communicationByIdOptions } from '../api/queries';
import type { CommunicationMessage } from '../api/types';
import { AttachClientForm } from './attach-client-form';
import { SendMessageForm } from './send-message-form';

interface CommunicationViewPageProps {
  communicationId: number;
}

function formatMessageTime(value: string): string {
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

function getMessageStatusLabel(status: CommunicationMessage['status'] | null): string {
  if (!status) return 'Pending';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function getAvatarLabel(name: string | null, fallback: string): string {
  const source = name || fallback;

  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function CommunicationViewPage({ communicationId }: CommunicationViewPageProps) {
  const { data } = useSuspenseQuery(communicationByIdOptions(communicationId));

  if (!data) {
    notFound();
  }

  const conversation = data.conversation;

  return (
    <div className='grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]'>
      <Card className='min-h-[70vh]'>
        <CardHeader className='gap-4'>
          <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
            <div className='space-y-3'>
              <div className='flex flex-wrap items-center gap-2'>
                <CardTitle>
                  {conversation.displayName || conversation.clientName || 'WhatsApp conversation'}
                </CardTitle>
                <Badge variant={conversation.unreadCount > 0 ? 'default' : 'secondary'}>
                  {conversation.unreadCount > 0
                    ? `${conversation.unreadCount} unread`
                    : 'Up to date'}
                </Badge>
              </div>
              <CardDescription className='flex flex-wrap items-center gap-3'>
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
                    No client attached yet
                  </span>
                )}
              </CardDescription>
            </div>

            <Button asChild variant='outline'>
              <Link href='/dashboard/communications'>
                <Icons.chevronLeft className='size-4' />
                Back to inbox
              </Link>
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className='p-0'>
          <ScrollArea className='h-[calc(70vh-6rem)]'>
            <div className='space-y-4 p-6'>
              {data.messages.length === 0 ? (
                <div className='text-muted-foreground flex min-h-64 flex-col items-center justify-center gap-3 text-center'>
                  <Icons.chat className='size-8' />
                  <div>
                    <div className='font-medium text-foreground'>No messages yet</div>
                    <div className='text-sm'>
                      This conversation exists, but the message history has not been synced.
                    </div>
                  </div>
                </div>
              ) : (
                data.messages.map((message) => {
                  const isOutbound = message.direction === 'OUTBOUND';
                  const messageTimestamp = message.sentAt ?? message.createdAt;
                  const links = [
                    message.attachmentUrl
                      ? {
                          id: `${message.id}-attachment`,
                          name: message.attachmentName || 'Attachment',
                          url: message.attachmentUrl
                        }
                      : null,
                    message.documentUrl
                      ? {
                          id: `${message.id}-document`,
                          name: 'Open document',
                          url: message.documentUrl
                        }
                      : null
                  ].filter((item): item is { id: string; name: string; url: string } => !!item);

                  return (
                    <div key={message.id} className={cn('flex gap-3', isOutbound && 'justify-end')}>
                      {!isOutbound && (
                        <Avatar className='mt-1 size-9 border'>
                          <AvatarFallback>
                            {getAvatarLabel(conversation.displayName, conversation.phone)}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={cn(
                          'max-w-[85%] space-y-2 rounded-2xl border px-4 py-3 md:max-w-[75%]',
                          isOutbound
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background'
                        )}
                      >
                        <div className='text-sm leading-6 whitespace-pre-wrap'>{message.body}</div>

                        {links.length > 0 && (
                          <div className='flex flex-wrap gap-2'>
                            {links.map((attachment) => (
                              <Button
                                key={attachment.id}
                                asChild
                                variant={isOutbound ? 'secondary' : 'outline'}
                                size='sm'
                              >
                                <a href={attachment.url} target='_blank' rel='noreferrer'>
                                  <Icons.paperclip className='size-4' />
                                  {attachment.name}
                                </a>
                              </Button>
                            ))}
                          </div>
                        )}

                        <div
                          className={cn(
                            'flex flex-wrap items-center gap-2 text-xs',
                            isOutbound ? 'text-primary-foreground/80' : 'text-muted-foreground'
                          )}
                        >
                          <span>{formatMessageTime(messageTimestamp)}</span>
                          <span>&bull;</span>
                          <span>
                            {isOutbound ? getMessageStatusLabel(message.status) : 'Inbound'}
                          </span>
                        </div>
                      </div>

                      {isOutbound && (
                        <Avatar className='mt-1 size-9 border'>
                          <AvatarFallback>ME</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className='space-y-6'>
        <AttachClientForm
          communicationId={communicationId}
          currentClient={
            conversation.clientId
              ? {
                  id: conversation.clientId,
                  name: conversation.clientName || conversation.phone,
                  company: conversation.clientCompany
                }
              : null
          }
        />
        <SendMessageForm communicationId={communicationId} />
      </div>
    </div>
  );
}

export function CommunicationViewSkeleton() {
  return (
    <div className='grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]'>
      <Card className='min-h-[70vh]'>
        <CardHeader className='space-y-3'>
          <div className='bg-muted h-6 w-64 animate-pulse rounded-md' />
          <div className='bg-muted h-4 w-52 animate-pulse rounded-md' />
        </CardHeader>
        <CardContent className='space-y-4'>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className={cn('flex gap-3', index % 2 === 1 && 'justify-end')}>
              <div className='bg-muted h-24 w-full max-w-lg animate-pulse rounded-2xl' />
            </div>
          ))}
        </CardContent>
      </Card>
      <div className='space-y-6'>
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className='space-y-3'>
              <div className='bg-muted h-6 w-40 animate-pulse rounded-md' />
              <div className='bg-muted h-4 w-full animate-pulse rounded-md' />
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='bg-muted h-24 animate-pulse rounded-md' />
              <div className='bg-muted h-10 animate-pulse rounded-md' />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
