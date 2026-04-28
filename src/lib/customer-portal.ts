import { currentUser } from '@clerk/nextjs/server';
import { revalidateTag, unstable_cache } from 'next/cache';
import {
  ClientStatus,
  InvoiceStatus,
  Prisma,
  ProjectStatus,
  SubscriptionStatus
} from '@prisma/client';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

const PORTAL_ORDER_CATALOG_CACHE_TAG = 'portal-order-catalog';

export interface PortalCatalogPlan {
  id: number;
  name: string;
  description: string | null;
  interval: string;
  price: number;
}

export interface PortalCatalogProduct {
  id: number;
  name: string;
  description: string;
  type: 'product' | 'service';
  price: number;
  unit: string;
  isDigital: boolean;
  deliveryUrl: string | null;
  categoryName: string;
  plans: PortalCatalogPlan[];
}

export interface PortalPaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

const PORTAL_PAGE_SIZE = 10;

const portalClientSummarySelect = {
  id: true,
  name: true,
  email: true,
  company: true,
  status: true
} satisfies Prisma.ClientSelect;

type PortalClientSummary = Prisma.ClientGetPayload<{
  select: typeof portalClientSummarySelect;
}>;

const portalOverviewOutstandingInvoiceSelect = {
  id: true,
  total: true,
  payments: {
    select: {
      amount: true
    }
  }
} satisfies Prisma.InvoiceSelect;

const portalQuotationListSelect = {
  id: true,
  number: true,
  status: true,
  total: true,
  createdAt: true,
  validUntil: true,
  project: {
    select: {
      id: true,
      name: true
    }
  }
} satisfies Prisma.QuotationSelect;

const portalInvoiceListSelect = {
  id: true,
  number: true,
  status: true,
  total: true,
  dueDate: true,
  createdAt: true,
  project: {
    select: {
      id: true,
      name: true
    }
  },
  subscription: {
    select: {
      id: true,
      plan: {
        select: {
          name: true
        }
      }
    }
  },
  payments: {
    select: {
      amount: true
    }
  }
} satisfies Prisma.InvoiceSelect;

const portalProjectListSelect = {
  id: true,
  name: true,
  status: true,
  startDate: true,
  endDate: true,
  quotationId: true,
  budget: true,
  updatedAt: true
} satisfies Prisma.ProjectSelect;

const portalSubscriptionListSelect = {
  id: true,
  status: true,
  nextBillingDate: true,
  priceOverride: true,
  plan: {
    select: {
      id: true,
      name: true,
      interval: true,
      price: true
    }
  },
  project: {
    select: {
      id: true,
      name: true
    }
  },
  invoices: {
    select: {
      id: true,
      number: true,
      total: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 6
  }
} satisfies Prisma.ClientSubscriptionSelect;

const portalDigitalAccessInvoiceSelect = {
  id: true,
  number: true,
  project: {
    select: {
      quotation: {
        select: {
          items: {
            select: {
              id: true,
              description: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  isDigital: true,
                  deliveryUrl: true
                }
              }
            }
          }
        }
      }
    }
  },
  subscription: {
    select: {
      id: true,
      plan: {
        select: {
          name: true,
          service: {
            select: {
              id: true,
              name: true,
              isDigital: true,
              deliveryUrl: true
            }
          }
        }
      }
    }
  }
} satisfies Prisma.InvoiceSelect;

type PortalQuotationListItem = Prisma.QuotationGetPayload<{
  select: typeof portalQuotationListSelect;
}>;

type PortalInvoiceListItem = Prisma.InvoiceGetPayload<{
  select: typeof portalInvoiceListSelect;
}>;

type PortalProjectListItem = Prisma.ProjectGetPayload<{
  select: typeof portalProjectListSelect;
}>;

type PortalSubscriptionListItem = Prisma.ClientSubscriptionGetPayload<{
  select: typeof portalSubscriptionListSelect;
}>;

export interface PortalOverviewData {
  client: PortalClientSummary | null;
  quotationsCount: number;
  activeProjectsCount: number;
  outstandingInvoicesCount: number;
  outstandingBalance: number;
  activeSubscriptionsCount: number;
  recentPaymentsCount: number;
  digitalAccessCount: number;
}

export interface PortalPagedResult<T> {
  client: PortalClientSummary;
  items: T[];
  pagination: PortalPaginationMeta;
}

export interface PortalDigitalAccessItem {
  key: string;
  productId: number | null;
  sourceType: 'invoice' | 'quotation' | 'subscription';
  sourceId: number;
  sourceNumber: string;
  sourcePath: string;
  title: string;
  subtitle: string;
  deliveryUrl: string | null;
  isDigital: boolean;
}

export interface PortalMyProductDetailSource {
  sourceType: 'invoice' | 'quotation' | 'subscription';
  sourceId: number;
  sourceNumber: string;
  sourcePath: string;
  label: string;
}

export interface PortalMyProductDetailData {
  client: PortalClientSummary;
  product: {
    id: number;
    name: string;
    description: string;
    type: 'PRODUCT' | 'SERVICE';
    isDigital: boolean;
    deliveryUrl: string | null;
    price: number;
    unit: string;
  };
  sources: PortalMyProductDetailSource[];
}

function normalizePortalPage(page: number | string | undefined): number {
  const value =
    typeof page === 'string' ? Number.parseInt(page, 10) : typeof page === 'number' ? page : 1;

  return Number.isFinite(value) && value > 0 ? value : 1;
}

function buildPortalPaginationMeta(
  totalItems: number,
  page: number,
  pageSize = PORTAL_PAGE_SIZE
): PortalPaginationMeta {
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages
  };
}

const portalQuotationInclude = {
  client: true,
  project: true,
  items: {
    include: {
      product: true
    }
  }
} satisfies Prisma.QuotationInclude;

const portalInvoiceInclude = {
  client: true,
  project: {
    include: {
      quotation: {
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      }
    }
  },
  subscription: {
    include: {
      plan: {
        include: {
          service: true
        }
      }
    }
  },
  payments: {
    orderBy: { paidAt: 'desc' }
  }
} satisfies Prisma.InvoiceInclude;

const portalProjectInclude = {
  client: true,
  quotation: true,
  invoices: {
    include: {
      payments: true
    },
    orderBy: { createdAt: 'desc' }
  },
  subscriptions: {
    include: {
      plan: {
        include: {
          service: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  }
} satisfies Prisma.ProjectInclude;

export type PortalQuotationDocument = Prisma.QuotationGetPayload<{
  include: typeof portalQuotationInclude;
}>;

export type PortalInvoiceDocument = Prisma.InvoiceGetPayload<{
  include: typeof portalInvoiceInclude;
}>;

export type PortalProjectDocument = Prisma.ProjectGetPayload<{
  include: typeof portalProjectInclude;
}>;

export async function getPortalOverviewData(): Promise<PortalOverviewData | null> {
  const { client } = await getPortalClientOrThrow();

  const outstandingStatuses: InvoiceStatus[] = [
    InvoiceStatus.SENT,
    InvoiceStatus.PARTIAL,
    InvoiceStatus.OVERDUE
  ];

  const [
    quotationsCount,
    activeProjectsCount,
    outstandingInvoicesCount,
    outstandingInvoices,
    activeSubscriptionsCount,
    recentPaymentsCount,
    digitalAccessInvoices
  ] = await Promise.all([
    prisma.quotation.count({
      where: { clientId: client.id }
    }),
    prisma.project.count({
      where: {
        clientId: client.id,
        status: ProjectStatus.ACTIVE
      }
    }),
    prisma.invoice.count({
      where: {
        clientId: client.id,
        status: { in: outstandingStatuses }
      }
    }),
    prisma.invoice.findMany({
      where: {
        clientId: client.id,
        status: { in: outstandingStatuses }
      },
      select: portalOverviewOutstandingInvoiceSelect
    }),
    prisma.clientSubscription.count({
      where: {
        clientId: client.id,
        status: SubscriptionStatus.ACTIVE
      }
    }),
    prisma.payment.count({
      where: {
        invoice: {
          clientId: client.id
        }
      }
    }),
    prisma.invoice.findMany({
      where: {
        clientId: client.id,
        OR: [
          {
            project: {
              quotation: {
                items: {
                  some: {
                    product: {
                      isDigital: true,
                      NOT: {
                        deliveryUrl: null
                      }
                    }
                  }
                }
              }
            }
          },
          {
            subscription: {
              plan: {
                service: {
                  isDigital: true,
                  NOT: {
                    deliveryUrl: null
                  }
                }
              }
            }
          }
        ]
      },
      select: { id: true }
    })
  ]);

  const outstandingBalance = outstandingInvoices.reduce((sum, invoice) => {
    const paidAmount = invoice.payments.reduce(
      (paymentSum, payment) => paymentSum + Number(payment.amount),
      0
    );

    return sum + Math.max(Number(invoice.total) - paidAmount, 0);
  }, 0);

  return {
    client,
    quotationsCount,
    activeProjectsCount,
    outstandingInvoicesCount,
    outstandingBalance,
    activeSubscriptionsCount,
    recentPaymentsCount,
    digitalAccessCount: digitalAccessInvoices.length
  };
}

export async function getPortalInvoicesPageData(
  pageInput?: number | string
): Promise<PortalPagedResult<PortalInvoiceListItem> | null> {
  const { client } = await getPortalClientOrThrow();
  const page = normalizePortalPage(pageInput);
  const skip = (page - 1) * PORTAL_PAGE_SIZE;

  const [totalItems, items, clientSummary] = await Promise.all([
    prisma.invoice.count({
      where: { clientId: client.id }
    }),
    prisma.invoice.findMany({
      where: { clientId: client.id },
      select: portalInvoiceListSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: PORTAL_PAGE_SIZE
    }),
    prisma.client.findUnique({
      where: { id: client.id },
      select: portalClientSummarySelect
    })
  ]);

  if (!clientSummary) {
    return null;
  }

  return {
    client: clientSummary,
    items,
    pagination: buildPortalPaginationMeta(totalItems, page)
  };
}

export async function getPortalQuotationsPageData(
  pageInput?: number | string
): Promise<PortalPagedResult<PortalQuotationListItem> | null> {
  const { client } = await getPortalClientOrThrow();
  const page = normalizePortalPage(pageInput);
  const skip = (page - 1) * PORTAL_PAGE_SIZE;

  const [totalItems, items, clientSummary] = await Promise.all([
    prisma.quotation.count({
      where: { clientId: client.id }
    }),
    prisma.quotation.findMany({
      where: { clientId: client.id },
      select: portalQuotationListSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: PORTAL_PAGE_SIZE
    }),
    prisma.client.findUnique({
      where: { id: client.id },
      select: portalClientSummarySelect
    })
  ]);

  if (!clientSummary) {
    return null;
  }

  return {
    client: clientSummary,
    items,
    pagination: buildPortalPaginationMeta(totalItems, page)
  };
}

export async function getPortalProjectsPageData(
  pageInput?: number | string
): Promise<PortalPagedResult<PortalProjectListItem> | null> {
  const { client } = await getPortalClientOrThrow();
  const page = normalizePortalPage(pageInput);
  const skip = (page - 1) * PORTAL_PAGE_SIZE;

  const [totalItems, items, clientSummary] = await Promise.all([
    prisma.project.count({
      where: { clientId: client.id }
    }),
    prisma.project.findMany({
      where: { clientId: client.id },
      select: portalProjectListSelect,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: PORTAL_PAGE_SIZE
    }),
    prisma.client.findUnique({
      where: { id: client.id },
      select: portalClientSummarySelect
    })
  ]);

  if (!clientSummary) {
    return null;
  }

  return {
    client: clientSummary,
    items,
    pagination: buildPortalPaginationMeta(totalItems, page)
  };
}

export async function getPortalSubscriptionsPageData(
  pageInput?: number | string
): Promise<PortalPagedResult<PortalSubscriptionListItem> | null> {
  const { client } = await getPortalClientOrThrow();
  const page = normalizePortalPage(pageInput);
  const skip = (page - 1) * PORTAL_PAGE_SIZE;

  const [totalItems, items, clientSummary] = await Promise.all([
    prisma.clientSubscription.count({
      where: { clientId: client.id }
    }),
    prisma.clientSubscription.findMany({
      where: { clientId: client.id },
      select: portalSubscriptionListSelect,
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take: PORTAL_PAGE_SIZE
    }),
    prisma.client.findUnique({
      where: { id: client.id },
      select: portalClientSummarySelect
    })
  ]);

  if (!clientSummary) {
    return null;
  }

  return {
    client: clientSummary,
    items,
    pagination: buildPortalPaginationMeta(totalItems, page)
  };
}

export async function getPortalDigitalAccessPageData(
  pageInput?: number | string
): Promise<PortalPagedResult<PortalDigitalAccessItem> | null> {
  const { client } = await getPortalClientOrThrow();
  const page = normalizePortalPage(pageInput);
  const skip = (page - 1) * PORTAL_PAGE_SIZE;

  const [invoices, quotations, clientSummary] = await Promise.all([
    prisma.invoice.findMany({
      where: { clientId: client.id },
      select: portalDigitalAccessInvoiceSelect,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.quotation.findMany({
      where: { clientId: client.id },
      select: {
        id: true,
        number: true,
        items: {
          select: {
            id: true,
            description: true,
            product: {
              select: {
                id: true,
                name: true,
                isDigital: true,
                deliveryUrl: true,
                type: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.client.findUnique({
      where: { id: client.id },
      select: portalClientSummarySelect
    })
  ]);

  if (!clientSummary) {
    return null;
  }

  const invoiceItems = invoices.flatMap((invoice) => {
    const projectItems =
      (invoice.project?.quotation?.items ?? [])
        .filter((item) => item.product)
        .map((item) => ({
          key: `invoice-${invoice.id}-item-${item.id}`,
          productId: item.product?.id ?? null,
          sourceType: 'invoice' as const,
          sourceId: invoice.id,
          sourceNumber: invoice.number,
          sourcePath: `/portal/invoices/${invoice.id}`,
          title: item.description,
          subtitle: item.product?.name ?? 'Product / Service',
          deliveryUrl: item.product?.deliveryUrl ?? null,
          isDigital: !!item.product?.isDigital
        })) ?? [];

    const subscriptionItem = invoice.subscription?.plan.service
      ? [
          {
            key: `invoice-${invoice.id}-subscription`,
            productId: invoice.subscription.plan.service?.id ?? null,
            sourceType: 'subscription' as const,
            sourceId: invoice.subscription.id,
            sourceNumber: invoice.number,
            sourcePath: `/portal/invoices/${invoice.id}`,
            title: invoice.subscription.plan.name,
            subtitle: invoice.subscription.plan.service.name,
            deliveryUrl: invoice.subscription.plan.service.deliveryUrl ?? null,
            isDigital: !!invoice.subscription.plan.service.isDigital
          }
        ]
      : [];

    return [...projectItems, ...subscriptionItem];
  });

  const quotationItems = quotations.flatMap((quotation) =>
    (quotation.items ?? [])
      .filter((item) => item.product)
      .map((item) => ({
        key: `quotation-${quotation.id}-item-${item.id}`,
        productId: item.product?.id ?? null,
        sourceType: 'quotation' as const,
        sourceId: quotation.id,
        sourceNumber: quotation.number,
        sourcePath: `/portal/quotations/${quotation.id}`,
        title: item.description,
        subtitle: item.product?.name ?? 'Product / Service',
        deliveryUrl: item.product?.deliveryUrl ?? null,
        isDigital: !!item.product?.isDigital
      }))
  );

  const allItems = [...invoiceItems, ...quotationItems];

  const totalItems = allItems.length;
  const items = allItems.slice(skip, skip + PORTAL_PAGE_SIZE);

  return {
    client: clientSummary,
    items,
    pagination: buildPortalPaginationMeta(totalItems, page)
  };
}

export async function getPortalMyProductDetail(
  productIdInput: number | string
): Promise<PortalMyProductDetailData | null> {
  const { client } = await getPortalClientOrThrow();
  const productId =
    typeof productIdInput === 'string' ? Number.parseInt(productIdInput, 10) : productIdInput;

  if (!Number.isFinite(productId) || productId <= 0) {
    return null;
  }

  const [clientSummary, product, quotations, subscriptions] = await Promise.all([
    prisma.client.findUnique({
      where: { id: client.id },
      select: portalClientSummarySelect
    }),
    prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        isDigital: true,
        deliveryUrl: true,
        price: true,
        unit: true
      }
    }),
    prisma.quotation.findMany({
      where: {
        clientId: client.id,
        items: {
          some: {
            productId
          }
        }
      },
      select: {
        id: true,
        number: true,
        project: {
          select: {
            id: true,
            invoices: {
              select: {
                id: true,
                number: true
              },
              orderBy: {
                createdAt: 'desc'
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.clientSubscription.findMany({
      where: {
        clientId: client.id,
        plan: {
          serviceId: productId
        }
      },
      select: {
        id: true,
        invoices: {
          select: {
            id: true,
            number: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  ]);

  if (!clientSummary || !product) {
    return null;
  }

  const sourceMap = new Map<string, PortalMyProductDetailSource>();

  for (const quotation of quotations) {
    sourceMap.set(`quotation-${quotation.id}`, {
      sourceType: 'quotation',
      sourceId: quotation.id,
      sourceNumber: quotation.number,
      sourcePath: `/portal/quotations/${quotation.id}`,
      label: `Quotation ${quotation.number}`
    });

    for (const invoice of quotation.project?.invoices ?? []) {
      sourceMap.set(`invoice-${invoice.id}`, {
        sourceType: 'invoice',
        sourceId: invoice.id,
        sourceNumber: invoice.number,
        sourcePath: `/portal/invoices/${invoice.id}`,
        label: `Invoice ${invoice.number}`
      });
    }
  }

  for (const subscription of subscriptions) {
    for (const invoice of subscription.invoices) {
      sourceMap.set(`invoice-${invoice.id}`, {
        sourceType: 'invoice',
        sourceId: invoice.id,
        sourceNumber: invoice.number,
        sourcePath: `/portal/invoices/${invoice.id}`,
        label: `Invoice ${invoice.number}`
      });
    }
  }

  const sources = Array.from(sourceMap.values()).toSorted((a, b) => a.label.localeCompare(b.label));

  return {
    client: clientSummary,
    product: {
      id: product.id,
      name: product.name,
      description: product.description,
      type: product.type,
      isDigital: product.isDigital,
      deliveryUrl: product.deliveryUrl,
      price: Number(product.price),
      unit: product.unit
    },
    sources
  };
}

const getCachedPortalOrderCatalog = unstable_cache(
  async (): Promise<PortalCatalogProduct[]> => {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        subscriptionPlans: {
          where: {
            isActive: true
          },
          orderBy: [{ price: 'asc' }, { createdAt: 'asc' }]
        }
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }]
    });

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      type: product.type === 'SERVICE' ? 'service' : 'product',
      price: Number(product.price),
      unit: product.unit,
      isDigital: product.isDigital,
      deliveryUrl: product.deliveryUrl,
      categoryName: product.category.name,
      plans: product.subscriptionPlans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        interval: plan.interval,
        price: Number(plan.price)
      }))
    }));
  },
  ['portal-order-catalog'],
  {
    tags: [PORTAL_ORDER_CATALOG_CACHE_TAG]
  }
);

export async function getPortalOrderCatalog(): Promise<PortalCatalogProduct[]> {
  return getCachedPortalOrderCatalog();
}

export async function invalidatePortalOrderCatalog(): Promise<void> {
  revalidateTag(PORTAL_ORDER_CATALOG_CACHE_TAG, 'max');
}

async function getPortalIdentity(): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof currentUser>>>;
  email: string;
}> {
  const user = await currentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  const email =
    user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)?.emailAddress ?? '';

  if (!email) {
    redirect('/portal');
  }

  return { user, email };
}

function buildPortalLeadName(
  user: NonNullable<Awaited<ReturnType<typeof currentUser>>>,
  email: string
): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

  if (fullName) {
    return fullName;
  }

  const username = user.username?.trim();
  if (username) {
    return username;
  }

  const emailPrefix = email
    .split('@')[0]
    ?.replace(/[._-]+/g, ' ')
    .trim();
  if (emailPrefix) {
    return emailPrefix
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  return 'Portal Client';
}

async function getOrCreatePortalClient() {
  const identity = await getPortalIdentity();
  const leadName = buildPortalLeadName(identity.user, identity.email);

  const client = await prisma.client.upsert({
    where: { email: identity.email },
    update: {
      name: leadName
    },
    create: {
      name: leadName,
      email: identity.email,
      status: ClientStatus.LEAD,
      notes: 'Created automatically from Clerk portal sign-up.'
    }
  });

  return {
    ...identity,
    client
  };
}

export async function getPortalClientOrThrow() {
  return getOrCreatePortalClient();
}

export async function getPortalQuotationDocument(
  quotationId: number
): Promise<PortalQuotationDocument | null> {
  const { client } = await getPortalClientOrThrow();

  return prisma.quotation.findFirst({
    where: {
      id: quotationId,
      clientId: client.id
    },
    include: portalQuotationInclude
  });
}

export async function getPortalInvoiceDocument(
  invoiceId: number
): Promise<PortalInvoiceDocument | null> {
  const { client } = await getPortalClientOrThrow();

  return prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      clientId: client.id
    },
    include: portalInvoiceInclude
  });
}

export async function getPortalProjectDocument(
  projectId: number
): Promise<PortalProjectDocument | null> {
  const { client } = await getPortalClientOrThrow();

  return prisma.project.findFirst({
    where: {
      id: projectId,
      clientId: client.id
    },
    include: portalProjectInclude
  });
}

export function formatPortalDate(value?: Date | null): string {
  if (!value) return '-';

  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(value);
}

export function formatPortalDateTime(value?: Date | null): string {
  if (!value) return '-';

  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(value);
}

export function appendPortalNote(existing: string | null | undefined, entry: string): string {
  const trimmed = existing?.trim();
  return trimmed ? `${trimmed}\n\n${entry}` : entry;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderQuotationDocumentHtml(quotation: PortalQuotationDocument): string {
  const itemRows = quotation.items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.description)}</td>
          <td>${escapeHtml(item.product?.name ?? 'Custom line')}</td>
          <td>${Number(item.qty).toFixed(2)}</td>
          <td>${escapeHtml(item.unitPrice.toString())}</td>
          <td>${escapeHtml(item.amount.toString())}</td>
        </tr>
      `
    )
    .join('');

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(quotation.number)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #111827; }
        h1, h2, h3, p { margin: 0; }
        .muted { color: #6b7280; }
        .header, .section { margin-bottom: 24px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
        th { background: #f9fafb; }
        .totals { margin-top: 16px; text-align: right; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Quotation ${escapeHtml(quotation.number)}</h1>
        <p class="muted">Status: ${escapeHtml(quotation.status)}</p>
      </div>
      <div class="grid section">
        <div>
          <h3>Client</h3>
          <p>${escapeHtml(quotation.client.company ?? quotation.client.name)}</p>
          <p class="muted">${escapeHtml(quotation.client.email)}</p>
        </div>
        <div>
          <h3>Document</h3>
          <p>Created: ${escapeHtml(formatPortalDate(quotation.createdAt))}</p>
          <p>Valid until: ${escapeHtml(formatPortalDate(quotation.validUntil))}</p>
        </div>
      </div>
      <div class="section">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Service</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
      </div>
      <div class="totals">
        <p>Subtotal: ${escapeHtml(quotation.subtotal.toString())}</p>
        <p>Tax: ${escapeHtml(quotation.tax.toString())}</p>
        <p>Discount: ${escapeHtml(quotation.discount.toString())}</p>
        <p><strong>Total: ${escapeHtml(quotation.total.toString())}</strong></p>
      </div>
      ${
        quotation.notes
          ? `<div class="section"><h3>Notes</h3><p>${escapeHtml(quotation.notes)}</p></div>`
          : ''
      }
    </body>
  </html>`;
}

export function renderInvoiceDocumentHtml(invoice: PortalInvoiceDocument): string {
  const sourceItems = invoice.project?.quotation?.items
    ? invoice.project.quotation.items
    : invoice.subscription?.plan.service
      ? [
          {
            id: 0,
            description: invoice.subscription.plan.name,
            product: invoice.subscription.plan.service,
            qty: 1,
            unitPrice: Number(invoice.total),
            amount: Number(invoice.total),
            createdAt: invoice.createdAt,
            quotationId: invoice.project?.quotation?.id ?? 0,
            productId: invoice.subscription.plan.serviceId ?? null
          }
        ]
      : [];

  const itemRows = sourceItems
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.description)}</td>
          <td>${escapeHtml(item.product?.name ?? 'General billing')}</td>
          <td>${Number(item.qty).toFixed(2)}</td>
          <td>${escapeHtml(item.unitPrice.toString())}</td>
          <td>${escapeHtml(item.amount.toString())}</td>
        </tr>
      `
    )
    .join('');

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(invoice.number)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #111827; }
        h1, h2, h3, p { margin: 0; }
        .muted { color: #6b7280; }
        .header, .section { margin-bottom: 24px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
        th { background: #f9fafb; }
        .totals { margin-top: 16px; text-align: right; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Invoice ${escapeHtml(invoice.number)}</h1>
        <p class="muted">Status: ${escapeHtml(invoice.status)}</p>
      </div>
      <div class="grid section">
        <div>
          <h3>Client</h3>
          <p>${escapeHtml(invoice.client.company ?? invoice.client.name)}</p>
          <p class="muted">${escapeHtml(invoice.client.email)}</p>
        </div>
        <div>
          <h3>Document</h3>
          <p>Created: ${escapeHtml(formatPortalDate(invoice.createdAt))}</p>
          <p>Due date: ${escapeHtml(formatPortalDate(invoice.dueDate))}</p>
        </div>
      </div>
      <div class="section">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Service</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
      </div>
      <div class="totals">
        <p>Subtotal: ${escapeHtml(invoice.subtotal.toString())}</p>
        <p>Tax: ${escapeHtml(invoice.tax.toString())}</p>
        <p><strong>Total: ${escapeHtml(invoice.total.toString())}</strong></p>
      </div>
      ${
        invoice.notes
          ? `<div class="section"><h3>Notes</h3><p>${escapeHtml(invoice.notes)}</p></div>`
          : ''
      }
    </body>
  </html>`;
}
