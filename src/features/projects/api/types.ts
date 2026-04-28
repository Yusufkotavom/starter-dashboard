export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
export type ProjectMode = 'CLIENT_DELIVERY' | 'AGENT_PLAYGROUND';

export interface Project {
  id: number;
  name: string;
  clientId: number;
  clientName: string;
  clientCompany: string | null;
  quotationId: number | null;
  quotationNumber: string | null;
  quotationTotal: number | null;
  status: ProjectStatus;
  mode: ProjectMode;
  agentStack: string | null;
  playbookRefs: string | null;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  clientId?: number;
  sort?: string;
}

export interface ProjectsResponse {
  items: Project[];
  total_items: number;
}

export interface ProjectMutationPayload {
  name: string;
  clientId: number;
  quotationId?: number | null;
  status: ProjectStatus;
  mode?: ProjectMode;
  agentStack?: string | null;
  playbookRefs?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number | null;
  notes?: string | null;
}
