'use client';

import { notFound } from 'next/navigation';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { Project } from '../api/types';
import { projectByIdOptions } from '../api/queries';
import ProjectForm from './project-form';

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

  return <ProjectForm initialData={data as Project} pageTitle='Edit Project' />;
}
