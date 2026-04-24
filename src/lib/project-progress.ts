import type { ProjectStatus } from '@/features/projects/api/types';

interface ProjectProgressInput {
  id?: number | string;
  name?: string | null;
  clientName?: string | null;
  status: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
  quotationId?: number | null;
  budget?: number | null;
}

export interface ProjectProgressSummary {
  progress: number;
  phase: string;
  timelineProgress: number | null;
  nextStep: string;
  tone: 'default' | 'success' | 'warning' | 'danger';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getTimelineProgress(
  startDate?: string | null,
  endDate?: string | null,
  referenceDate: Date = new Date()
): number | null {
  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null;
  }

  const elapsed = referenceDate.getTime() - start.getTime();
  const total = end.getTime() - start.getTime();

  return clamp(Math.round((elapsed / total) * 100), 0, 100);
}

export function getProjectProgressSummary(
  project: ProjectProgressInput,
  referenceDate: Date = new Date()
): ProjectProgressSummary {
  const timelineProgress = getTimelineProgress(project.startDate, project.endDate, referenceDate);

  if (project.status === 'COMPLETED') {
    return {
      progress: 100,
      phase: 'Delivered',
      timelineProgress,
      nextStep: 'Handover and post-launch support',
      tone: 'success'
    };
  }

  if (project.status === 'CANCELLED') {
    return {
      progress: 0,
      phase: 'Cancelled',
      timelineProgress,
      nextStep: 'Scope closed',
      tone: 'danger'
    };
  }

  if (project.status === 'PAUSED') {
    return {
      progress: timelineProgress === null ? 45 : clamp(timelineProgress, 20, 85),
      phase: 'On Hold',
      timelineProgress,
      nextStep: 'Waiting for unblock or approval',
      tone: 'warning'
    };
  }

  if (timelineProgress !== null) {
    if (timelineProgress < 20) {
      return {
        progress: clamp(timelineProgress, 12, 25),
        phase: 'Kickoff',
        timelineProgress,
        nextStep: 'Confirm scope and working plan',
        tone: 'default'
      };
    }

    if (timelineProgress < 65) {
      return {
        progress: clamp(timelineProgress, 30, 72),
        phase: 'Execution',
        timelineProgress,
        nextStep: 'Move tracked tasks through the board',
        tone: 'default'
      };
    }

    if (timelineProgress < 90) {
      return {
        progress: clamp(timelineProgress, 73, 92),
        phase: 'Review',
        timelineProgress,
        nextStep: 'QA, revisions, and stakeholder feedback',
        tone: 'default'
      };
    }
  }

  if (project.quotationId) {
    return {
      progress: project.budget ? 35 : 28,
      phase: 'Ready to Start',
      timelineProgress,
      nextStep: 'Open the task board and begin execution',
      tone: 'default'
    };
  }

  return {
    progress: project.budget ? 22 : 12,
    phase: 'Scoping',
    timelineProgress,
    nextStep: 'Finalize commercial scope and kickoff timeline',
    tone: 'default'
  };
}

export function buildProjectBoardHref(project: ProjectProgressInput): string {
  const summary = getProjectProgressSummary(project);
  const searchParams = new URLSearchParams();

  if (project.id !== undefined && project.id !== null) {
    searchParams.set('projectId', String(project.id));
  }

  if (project.name) {
    searchParams.set('project', project.name);
  }

  if (project.clientName) {
    searchParams.set('client', project.clientName);
  }

  searchParams.set('phase', summary.phase);
  searchParams.set('progress', String(summary.progress));

  return `/dashboard/kanban?${searchParams.toString()}`;
}
