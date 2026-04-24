import { Icons } from '@/components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ModulePlaceholderProps {
  title: string;
  description: string;
  bullets: string[];
}

export default function ModulePlaceholder({ title, description, bullets }: ModulePlaceholderProps) {
  return (
    <Card className='border-dashed'>
      <CardHeader className='space-y-3'>
        <div className='bg-muted flex h-10 w-10 items-center justify-center rounded-full'>
          <Icons.clock className='text-muted-foreground h-5 w-5' />
        </div>
        <div className='space-y-1'>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ul className='text-muted-foreground space-y-2 text-sm'>
          {bullets.map((bullet) => (
            <li key={bullet} className='flex items-start gap-2'>
              <Icons.check className='mt-0.5 h-4 w-4 shrink-0 text-emerald-600' />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
