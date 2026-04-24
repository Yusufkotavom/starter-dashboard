import type {
  Prisma,
  Category as PrismaCategory,
  Product as PrismaProduct,
  SubscriptionPlan
} from '@prisma/client';
import type { Category } from '@/features/categories/api/types';
import type { Product } from '@/features/products/api/types';

type ProductWithCategory = PrismaProduct & {
  category: PrismaCategory;
  subscriptionPlans?: (SubscriptionPlan & {
    _count?: {
      subscriptions: number;
    };
  })[];
};

type CategoryWithCount = PrismaCategory & {
  _count: {
    products: number;
  };
};

export function mapCategoryRecord(record: CategoryWithCount): Category {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    description: record.description,
    productCount: record._count.products,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export function mapProductRecord(record: ProductWithCategory): Product {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    type: record.type.toLowerCase() as Product['type'],
    price: Number(record.price),
    photo_url: record.photoUrl || '/vercel.svg',
    category: record.category.slug,
    categoryName: record.category.name,
    isDigital: record.isDigital,
    deliveryUrl: record.deliveryUrl,
    activePlanCount: (record.subscriptionPlans ?? []).filter((plan) => plan.isActive).length,
    subscriptionPlans: (record.subscriptionPlans ?? []).map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      interval: plan.interval,
      price: Number(plan.price),
      isActive: plan.isActive,
      activeSubscriptions: plan._count?.subscriptions ?? 0
    })),
    created_at: record.createdAt.toISOString(),
    updated_at: record.updatedAt.toISOString()
  };
}

export function buildCategoryOrderBy(sort?: string): Prisma.CategoryOrderByWithRelationInput[] {
  if (!sort) return [{ createdAt: 'desc' }];

  try {
    const sortItems = JSON.parse(sort) as { id: string; desc: boolean }[];
    return sortItems.map((item) => {
      const direction = item.desc ? 'desc' : 'asc';
      if (item.id === 'productCount') {
        return { products: { _count: direction } };
      }

      if (item.id === 'slug' || item.id === 'name' || item.id === 'createdAt') {
        return { [item.id]: direction } as Prisma.CategoryOrderByWithRelationInput;
      }

      return { createdAt: 'desc' };
    });
  } catch {
    return [{ createdAt: 'desc' }];
  }
}

export function buildProductOrderBy(sort?: string): Prisma.ProductOrderByWithRelationInput[] {
  if (!sort) return [{ createdAt: 'desc' }];

  try {
    const sortItems = JSON.parse(sort) as { id: string; desc: boolean }[];
    return sortItems.map((item) => {
      const direction = item.desc ? 'desc' : 'asc';
      if (item.id === 'category') {
        return { category: { name: direction } };
      }

      if (
        item.id === 'name' ||
        item.id === 'type' ||
        item.id === 'price' ||
        item.id === 'createdAt'
      ) {
        return { [item.id]: direction } as Prisma.ProductOrderByWithRelationInput;
      }

      return { createdAt: 'desc' };
    });
  } catch {
    return [{ createdAt: 'desc' }];
  }
}
