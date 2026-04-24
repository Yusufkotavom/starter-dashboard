import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { getAgencyMetrics } from '@/lib/agency';
import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/utils';
import React from 'react';

function buildKpis(metrics: Awaited<ReturnType<typeof getAgencyMetrics>>) {
  return [
    {
      title: 'Approved Pipeline',
      value: formatPrice(metrics.approvedPipeline),
      badge: '+Sales',
      icon: Icons.trendingUp,
      body: 'Commercial value already approved and ready to execute.',
      footer: `${metrics.openLeads} open leads still waiting to convert`
    },
    {
      title: 'Active Projects',
      value: String(metrics.activeProjects),
      badge: 'Delivery',
      icon: Icons.kanban,
      body: 'Current agency workload that the team is actively delivering.',
      footer: `${metrics.totalProjects} total tracked projects`
    },
    {
      title: 'Outstanding Invoices',
      value: formatPrice(metrics.outstandingInvoices),
      badge: 'Finance',
      icon: Icons.billing,
      body: 'Receivables still pending collection from client billing.',
      footer: `${metrics.overdueInvoices} overdue invoices need follow-up`
    },
    {
      title: 'Gross Spread',
      value: formatPrice(metrics.grossSpread),
      badge: 'Cashflow',
      icon: Icons.trendingDown,
      body: 'Recorded cash-in minus operational and delivery-related cost out.',
      footer: `${formatPrice(metrics.cashIn)} in payments vs ${formatPrice(metrics.costOut)} in expenses`
    }
  ];
}

export default async function OverViewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  const metrics = await getAgencyMetrics(prisma);
  const kpis = buildKpis(metrics);

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Agency Overview</h2>
            <p className='text-muted-foreground'>
              Lead pipeline, project delivery, and finance snapshot in one place.
            </p>
          </div>
        </div>

        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          {kpis.map((kpi) => {
            const Icon = kpi.icon;

            return (
              <Card key={kpi.title} className='@container/card'>
                <CardHeader>
                  <CardDescription>{kpi.title}</CardDescription>
                  <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                    {kpi.value}
                  </CardTitle>
                  <CardAction>
                    <Badge variant='outline'>
                      <Icon />
                      {kpi.badge}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                  <div className='line-clamp-2 flex gap-2 font-medium'>{kpi.body}</div>
                  <div className='text-muted-foreground'>{kpi.footer}</div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>{bar_stats}</div>
          <div className='col-span-4 md:col-span-3'>{sales}</div>
          <div className='col-span-4'>{area_stats}</div>
          <div className='col-span-4 min-h-0 md:col-span-3'>{pie_stats}</div>
        </div>
      </div>
    </PageContainer>
  );
}
