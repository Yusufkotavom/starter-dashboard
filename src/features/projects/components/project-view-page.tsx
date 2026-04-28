'use client';

import { notFound } from 'next/navigation';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Project } from '../api/types';
import { projectByIdOptions } from '../api/queries';
import ProjectForm from './project-form';
import { ProjectDocsPanel } from './project-docs-panel';

export default function ProjectViewPage({ projectId }: { projectId: string }) {
  if (projectId === 'new') {
    return <ProjectForm initialData={null} pageTitle='Create Project' />;
  }

  return <EditProjectView projectId={Number(projectId)} />;
}

function EditProjectView({ projectId }: { projectId: number }) {
  const { data } = useSuspenseQuery(projectByIdOptions(projectId));

  if (!data) {
    notFound();
  }

  const project = data as Project;

  return (
    <Tabs defaultValue='project' className='space-y-4'>
      <TabsList>
        <TabsTrigger value='project'>Project</TabsTrigger>
        <TabsTrigger value='docs'>Docs</TabsTrigger>
      </TabsList>
      <TabsContent value='project'>
        <ProjectForm initialData={project} pageTitle='Edit Project' />
      </TabsContent>
      <TabsContent value='docs'>
        <ProjectDocsPanel projectId={project.id} />
      </TabsContent>
    </Tabs>
  );
}
