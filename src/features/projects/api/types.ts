export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';

export interface Project {
  id: number;
  name: string;
  clientId: number;
  clientName: string;
  clientCompany: string | null;
  quotationId: number | null;
  status: ProjectStatus;
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
  startDate?: string | null;
  endDate?: string | null;
  budget?: number | null;
  notes?: string | null;
}
