'use client';

import { notFound } from 'next/navigation';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Project } from '../api/types';
import { projectByIdOptions } from '../api/queries';
import ProjectForm from './project-form';
import { ProjectDocsPanel } from './project-docs-panel';

type ProjectTab = 'project' | 'docs';

interface ProjectViewPageProps {
  projectId: string;
  defaultTab?: ProjectTab;
}

export default function ProjectViewPage({
  projectId,
  defaultTab = 'project'
}: ProjectViewPageProps) {
  if (projectId === 'new') {
    return <ProjectForm initialData={null} pageTitle='Create Project' />;
  }

  return <EditProjectView projectId={Number(projectId)} defaultTab={defaultTab} />;
}

function EditProjectView({ projectId, defaultTab }: { projectId: number; defaultTab: ProjectTab }) {
  const { data } = useSuspenseQuery(projectByIdOptions(projectId));

  if (!data) {
    notFound();
  }

  const project = data as Project;

  return (
    <Tabs defaultValue={defaultTab} className='space-y-4'>
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
