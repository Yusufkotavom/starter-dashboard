import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'API Index'
};

const endpointGroups: Array<{ title: string; items: string[] }> = [
  {
    title: 'Core CRUD',
    items: [
      '/api/v1/clients',
      '/api/v1/projects',
      '/api/v1/products',
      '/api/v1/categories',
      '/api/v1/docs',
      '/api/v1/tasks',
      '/api/v1/quotations',
      '/api/v1/invoices',
      '/api/v1/payments'
    ]
  },
  {
    title: 'Subscriptions & Communication',
    items: [
      '/api/v1/subscriptions/plans',
      '/api/v1/subscriptions/client-subscriptions',
      '/api/v1/communications/send',
      '/api/v1/communications/attach-client'
    ]
  },
  {
    title: 'Pipeline & Settings',
    items: ['/api/v1/pipeline/jobs', '/api/v1/settings', '/api/settings/integration-keys']
  }
];

export default function ApiIndexPage() {
  return (
    <main className='container mx-auto max-w-5xl space-y-6 px-4 py-8'>
      <div className='space-y-2'>
        <h1 className='text-2xl font-semibold'>API</h1>
        <p className='text-muted-foreground text-sm'>
          General API entrypoint. Use API key on header:{' '}
          <code>Authorization: Bearer &lt;key&gt;</code> or <code>x-api-key: &lt;key&gt;</code>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Test</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className='overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs'>
            {`curl -sS "http://127.0.0.1:3100/api/v1/clients?page=1&limit=5" \\
  -H "Authorization: Bearer <YOUR_API_KEY>"`}
          </pre>
        </CardContent>
      </Card>

      {endpointGroups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className='space-y-2 text-sm'>
              {group.items.map((path) => (
                <li key={path}>
                  <Link className='text-blue-600 hover:underline' href={path}>
                    {path}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </main>
  );
}
