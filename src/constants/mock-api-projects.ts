////////////////////////////////////////////////////////////////////////////////
// 🛑 Nothing in here has anything to do with Nextjs, it's just a fake database
////////////////////////////////////////////////////////////////////////////////

import { faker } from '@faker-js/faker';
import { matchSorter } from 'match-sorter';
import { delay } from './mock-api';
import { fakeClients } from './mock-api-clients';

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

type ProjectWriteInput = Omit<
  Project,
  'id' | 'createdAt' | 'updatedAt' | 'clientName' | 'clientCompany'
>;

function getProjectSortValue(project: Project, key: string): unknown {
  return project[key as keyof Project];
}

export const fakeProjects = {
  records: [] as Project[],

  serializeProject(project: Project): Project {
    const client = fakeClients.records.find((item) => item.id === project.clientId);

    return {
      ...project,
      clientName: client?.name ?? 'Unknown Client',
      clientCompany: client?.company ?? null
    };
  },

  initialize() {
    const statuses: ProjectStatus[] = ['ACTIVE', 'ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED'];
    const sampleProjects: Project[] = [];
    const clientsLength = fakeClients.records.length || 10;

    for (let i = 1; i <= 30; i++) {
      sampleProjects.push({
        id: i,
        name: faker.company.catchPhrase(),
        clientId: faker.number.int({ min: 1, max: clientsLength }),
        clientName: '',
        clientCompany: null,
        quotationId:
          faker.helpers.maybe(() => faker.number.int({ min: 1, max: 20 }), { probability: 0.5 }) ??
          null,
        status: faker.helpers.arrayElement(statuses),
        startDate: faker.date.recent({ days: 60 }).toISOString(),
        endDate:
          faker.helpers.maybe(() => faker.date.future({ years: 1 }).toISOString(), {
            probability: 0.6
          }) ?? null,
        budget:
          faker.helpers.maybe(() => faker.number.int({ min: 1000, max: 50000 }), {
            probability: 0.8
          }) ?? null,
        notes: faker.helpers.maybe(() => faker.lorem.paragraph(), { probability: 0.3 }) ?? null,
        createdAt: faker.date.between({ from: '2023-01-01', to: '2025-12-31' }).toISOString(),
        updatedAt: faker.date.recent({ days: 90 }).toISOString()
      });
    }

    this.records = sampleProjects.map((project) => this.serializeProject(project));
  },

  async getAll({
    search,
    status,
    clientId
  }: {
    search?: string;
    status?: string;
    clientId?: number;
  }): Promise<Project[]> {
    let projects = [...this.records];

    if (clientId) {
      projects = projects.filter((p) => p.clientId === clientId);
    }

    if (status) {
      const statusList = status.split(',').map((s) => s.trim().toUpperCase());
      projects = projects.filter((p) => statusList.includes(p.status));
    }

    if (search) {
      projects = matchSorter(projects, search, {
        keys: ['name']
      });
    }

    return projects.map((project) => this.serializeProject(project));
  },

  async getProjects({
    page = 1,
    limit = 10,
    search,
    status,
    clientId,
    sort
  }: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    clientId?: number;
    sort?: string;
  }): Promise<{ items: Project[]; total_items: number }> {
    await delay(800);

    const allProjects = await this.getAll({ search, status, clientId });

    // Sorting
    if (sort) {
      try {
        const sortItems = JSON.parse(sort) as { id: string; desc: boolean }[];
        if (sortItems.length > 0) {
          const { id, desc } = sortItems[0];
          allProjects.sort((a, b) => {
            const aVal = getProjectSortValue(a, id) ?? '';
            const bVal = getProjectSortValue(b, id) ?? '';
            if (typeof aVal === 'number' && typeof bVal === 'number') {
              return desc ? bVal - aVal : aVal - bVal;
            }
            return desc
              ? String(bVal).localeCompare(String(aVal))
              : String(aVal).localeCompare(String(bVal));
          });
        }
      } catch {
        // null
      }
    }

    const total_items = allProjects.length;
    const offset = (page - 1) * limit;
    const items = allProjects.slice(offset, offset + limit);

    return { items, total_items };
  },

  async getProjectById(id: number): Promise<Project | null> {
    await delay(500);
    const project = this.records.find((item) => item.id === id);
    return project ? this.serializeProject(project) : null;
  },

  async createProject(data: ProjectWriteInput): Promise<Project> {
    await delay(800);
    const newProject: Project = {
      ...data,
      id: Math.max(0, ...this.records.map((p) => p.id)) + 1,
      clientName: '',
      clientCompany: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const serializedProject = this.serializeProject(newProject);
    this.records.unshift(serializedProject);
    return serializedProject;
  },

  async updateProject(id: number, data: Partial<ProjectWriteInput>): Promise<Project> {
    await delay(800);
    const index = this.records.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Project with ID ${id} not found`);
    this.records[index] = this.serializeProject({
      ...this.records[index],
      ...data,
      updatedAt: new Date().toISOString()
    });
    return this.records[index];
  },

  async deleteProject(id: number): Promise<void> {
    await delay(800);
    const index = this.records.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Project with ID ${id} not found`);
    this.records.splice(index, 1);
  }
};

fakeProjects.initialize();
