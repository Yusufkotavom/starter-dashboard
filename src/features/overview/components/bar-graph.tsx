import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fakeProjects } from '@/constants/mock-api-projects';

export function BarGraph() {
  const projectStatusCounts = [
    {
      label: 'Active',
      count: fakeProjects.records.filter((item) => item.status === 'ACTIVE').length
    },
    {
      label: 'Completed',
      count: fakeProjects.records.filter((item) => item.status === 'COMPLETED').length
    },
    {
      label: 'Paused',
      count: fakeProjects.records.filter((item) => item.status === 'PAUSED').length
    },
    {
      label: 'Cancelled',
      count: fakeProjects.records.filter((item) => item.status === 'CANCELLED').length
    }
  ];
  const maxCount = Math.max(...projectStatusCounts.map((item) => item.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Status Mix</CardTitle>
        <CardDescription>Current delivery load split by project status.</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {projectStatusCounts.map((item) => (
          <div key={item.label} className='space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span className='font-medium'>{item.label}</span>
              <span className='text-muted-foreground'>{item.count} projects</span>
            </div>
            <div className='bg-muted h-2 rounded-full'>
              <div
                className='bg-primary h-2 rounded-full'
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
