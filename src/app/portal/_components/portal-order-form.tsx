'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { PortalCatalogProduct } from '@/lib/customer-portal';
import { cn, formatPrice } from '@/lib/utils';

interface PortalOrderFormProps {
  products: PortalCatalogProduct[];
}

interface PortalOrderResponse {
  message?: string;
  redirectTo?: string;
}

export function PortalOrderForm({ products }: PortalOrderFormProps) {
  const router = useRouter();
  const [productId, setProductId] = useState<number>(products[0]?.id ?? 0);
  const [planId, setPlanId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isPending, startTransition] = useTransition();

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId) ?? null,
    [productId, products]
  );
  const selectedPlan = useMemo(
    () => selectedProduct?.plans.find((plan) => plan.id === planId) ?? null,
    [planId, selectedProduct]
  );
  const effectivePrice = selectedPlan?.price ?? selectedProduct?.price ?? 0;

  const submitOrder = () => {
    if (!selectedProduct) {
      toast.error('Select a product or service first');
      return;
    }

    startTransition(async () => {
      const response = await fetch('/api/portal/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          planId: selectedPlan?.id ?? null,
          notes
        })
      });

      const payload = (await response.json().catch(() => null)) as PortalOrderResponse | null;

      if (!response.ok) {
        toast.error(payload?.message ?? 'Failed to create order');
        return;
      }

      toast.success(payload?.message ?? 'Order created');
      if (payload?.redirectTo) {
        router.push(payload.redirectTo);
        router.refresh();
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className='grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
      <div className='space-y-4'>
        <div className='grid gap-3 md:grid-cols-2'>
          {products.map((product) => {
            const isActive = product.id === productId;
            return (
              <button
                key={product.id}
                type='button'
                onClick={() => {
                  setProductId(product.id);
                  setPlanId(null);
                }}
                className={cn(
                  'rounded-2xl border p-4 text-left transition-colors',
                  isActive ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                )}
              >
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <div className='font-medium'>{product.name}</div>
                    <div className='text-muted-foreground mt-1 text-sm'>
                      {product.categoryName} · {product.type === 'service' ? 'Service' : 'Product'}
                    </div>
                  </div>
                  <div className='text-right text-sm font-medium'>
                    {formatPrice(product.price)}
                    <div className='text-muted-foreground text-xs'>/{product.unit}</div>
                  </div>
                </div>
                <p className='text-muted-foreground mt-3 line-clamp-3 text-sm'>
                  {product.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className='space-y-4 rounded-3xl border bg-background p-5'>
        <div className='space-y-1'>
          <h2 className='text-xl font-semibold tracking-tight'>Order Summary</h2>
          <p className='text-muted-foreground text-sm'>
            Submit a self-serve order. The portal will create the billing document automatically and
            take you straight to payment.
          </p>
        </div>

        {selectedProduct ? (
          <>
            <div className='rounded-2xl border p-4'>
              <div className='font-medium'>{selectedProduct.name}</div>
              <div className='text-muted-foreground mt-1 text-sm'>
                {selectedProduct.isDigital ? 'Digital delivery enabled' : 'Managed delivery flow'}
              </div>
            </div>

            {selectedProduct.plans.length > 0 ? (
              <div className='space-y-2'>
                <div className='text-sm font-medium'>Plan</div>
                <div className='space-y-2'>
                  <button
                    type='button'
                    onClick={() => setPlanId(null)}
                    className={cn(
                      'w-full rounded-2xl border p-3 text-left text-sm transition-colors',
                      planId === null ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                    )}
                  >
                    <div className='flex items-center justify-between gap-3'>
                      <span>One-off order</span>
                      <span className='font-medium'>{formatPrice(selectedProduct.price)}</span>
                    </div>
                    <div className='text-muted-foreground mt-1 text-xs'>
                      Order without starting a recurring subscription.
                    </div>
                  </button>

                  {selectedProduct.plans.map((plan) => (
                    <button
                      key={plan.id}
                      type='button'
                      onClick={() => setPlanId(plan.id)}
                      className={cn(
                        'w-full rounded-2xl border p-3 text-left text-sm transition-colors',
                        plan.id === planId ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                      )}
                    >
                      <div className='flex items-center justify-between gap-3'>
                        <span>{plan.name}</span>
                        <span className='font-medium'>{formatPrice(plan.price)}</span>
                      </div>
                      <div className='text-muted-foreground mt-1 text-xs'>
                        {plan.interval.replace(/_/g, ' ')}
                        {plan.description ? ` · ${plan.description}` : ''}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className='space-y-2'>
              <div className='text-sm font-medium'>Order Notes</div>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder='Optional scope, PO number, kickoff date, or delivery note.'
                className='min-h-32 w-full rounded-2xl border bg-background px-3 py-2 text-sm outline-none'
              />
            </div>

            <div className='rounded-2xl border bg-muted/30 p-4 text-sm'>
              <div className='flex items-center justify-between gap-4'>
                <span className='text-muted-foreground'>Billing Amount</span>
                <span className='font-medium'>{formatPrice(effectivePrice)}</span>
              </div>
              <div className='mt-2 flex items-center justify-between gap-4'>
                <span className='text-muted-foreground'>Flow</span>
                <span className='text-right text-xs text-muted-foreground'>
                  quotation approved automatically, invoice generated, payment handled inside portal
                </span>
              </div>
            </div>

            <Button className='w-full' isLoading={isPending} onClick={submitOrder}>
              Create Order and Continue to Payment
            </Button>
          </>
        ) : (
          <div className='text-muted-foreground text-sm'>
            No products available for self-serve order.
          </div>
        )}
      </div>
    </div>
  );
}
