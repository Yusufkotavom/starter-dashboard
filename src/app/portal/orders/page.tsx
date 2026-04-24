import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PortalOrderForm } from '@/app/portal/_components/portal-order-form';
import { getPortalClientOrThrow, getPortalOrderCatalog } from '@/lib/customer-portal';

export default async function PortalOrdersPage() {
  const [{ client }, products] = await Promise.all([
    getPortalClientOrThrow(),
    getPortalOrderCatalog()
  ]);

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-semibold tracking-tight'>Order Workspace</h1>
        <p className='text-muted-foreground max-w-3xl'>
          Place a new order directly from the portal. The system will create the internal billing
          flow automatically for {client.company ?? client.name}.
        </p>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No catalog items published yet</CardTitle>
            <CardDescription>
              The agency has not published any products or services for self-serve ordering.
            </CardDescription>
          </CardHeader>
          <CardContent className='text-muted-foreground text-sm'>
            Ask the internal team to activate at least one product or service in the catalog.
          </CardContent>
        </Card>
      ) : (
        <PortalOrderForm products={products} />
      )}
    </div>
  );
}
