export interface Expense {
  id: number;
  projectId: number | null;
  projectName: string | null;
  category: string;
  vendor: string | null;
  amount: number;
  date: string;
  notes: string | null;
  createdAt: string;
}

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

export interface ExpensesResponse {
  items: Expense[];
  total_items: number;
}

export interface ExpenseMutationPayload {
  projectId?: number | null;
  category: string;
  vendor?: string | null;
  amount: number;
  date: string;
  notes?: string | null;
}
