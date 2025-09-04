

const API_BASE_URL = 'http://localhost:5000/api';

// Default user ID (since we're not implementing authentication)
const DEFAULT_USER_ID = 1;

export interface Transaction {
  id: number;
  user_id: number;
  date: string;
  vendor: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  budget_id?: number;
  created_at: string;
}

export interface Budget {
  id: number;
  user_id: number;
  category: string;
  allocated: number;
  spent: number;
  color: string;
  is_essential: boolean;
  month_year: string;
  created_at: string;
  updated_at: string;
}



export interface Subscription {
  id: number;
  user_id: number;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly';
  next_billing: string;
  category: string;
  status: 'active' | 'trial' | 'forgotten';
  logo?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialOverview {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  monthlyData: Array<{
    month: string;
    income: number;
    expenses: number;
    savings: number;
  }>;
}

export interface AIInsight {
  id: string;
  category: string;
  insight: string;
  impact: 'high' | 'medium' | 'low' | 'positive';
  savings: number;
  type?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface InsightsResponse {
  spendingCategories: Array<{
    category: string;
    totalSpent: number;
    transactionCount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    expenses: number;
    income: number;
  }>;
  subscriptions: Array<{
    id: number;
    name: string;
    monthlyCost: number;
    status: string;
  }>;
  insights: AIInsight[];
  summary: {
    totalSpent: number;
    averageMonthlySpending: number;
    totalSubscriptions: number;
    monthlySubscriptionCost: number;
  };
}

// Generic API call function
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Transaction API calls
export const transactionAPI = {
  getAll: () => apiCall<Transaction[]>(`/transactions?userId=${DEFAULT_USER_ID}`),
  getById: (id: number) => apiCall<Transaction>(`/transactions/${id}`),
  create: (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) =>
    apiCall<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify({ ...transaction, user_id: DEFAULT_USER_ID }),
    }),
  update: (id: number, transaction: Partial<Transaction>) =>
    apiCall<Transaction>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transaction),
    }),
  delete: (id: number) =>
    apiCall<{ message: string }>(`/transactions/${id}`, {
      method: 'DELETE',
    }),
  getCategorySummary: () => apiCall<Array<{ category: string; amount: number; percentage: number }>>(`/transactions/categories/summary?userId=${DEFAULT_USER_ID}`),
  getMonthlyTrends: () => apiCall<Array<{ month: string; income: number; expenses: number; savings: number }>>(`/transactions/trends/monthly?userId=${DEFAULT_USER_ID}`),
};

// Budget API calls
export const budgetAPI = {
  getAll: () => apiCall<Budget[]>(`/budgets?userId=${DEFAULT_USER_ID}`),
  getById: (id: number) => apiCall<Budget>(`/budgets/${id}`),
  create: (budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'spent'>) =>
    apiCall<Budget>('/budgets', {
      method: 'POST',
      body: JSON.stringify({ ...budget, user_id: DEFAULT_USER_ID, spent: 0 }),
    }),
  update: (id: number, budget: Partial<Budget>) =>
    apiCall<Budget>(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(budget),
    }),
  delete: (id: number) =>
    apiCall<{ message: string }>(`/budgets/${id}`, {
      method: 'DELETE',
    }),
  getSummary: () => apiCall<{ totalAllocated: number; totalSpent: number; budgets: Budget[] }>(`/budgets/summary/${DEFAULT_USER_ID}`),
};



// Subscription API calls
export const subscriptionAPI = {
  getAll: () => apiCall<Subscription[]>(`/subscriptions?userId=${DEFAULT_USER_ID}`),
  getById: (id: number) => apiCall<Subscription>(`/subscriptions/${id}`),
  create: (subscription: Omit<Subscription, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
    apiCall<Subscription>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ ...subscription, user_id: DEFAULT_USER_ID }),
    }),
  update: (id: number, subscription: Partial<Subscription>) =>
    apiCall<Subscription>(`/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subscription),
    }),
  delete: (id: number) =>
    apiCall<{ message: string }>(`/subscriptions/${id}`, {
      method: 'DELETE',
    }),
  updateStatus: (id: number, status: Subscription['status']) =>
    apiCall<Subscription>(`/subscriptions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  markNotSubscription: (vendor: string) =>
    apiCall<{ message: string; vendor: string; userId: number }>('/subscriptions/mark-not-subscription', {
      method: 'POST',
      body: JSON.stringify({ vendor, userId: DEFAULT_USER_ID }),
    }),
  getSummary: () => apiCall<{ totalMonthly: number; totalYearly: number; subscriptions: Subscription[] }>(`/subscriptions/summary/${DEFAULT_USER_ID}`),
};

// Analytics API calls
export const analyticsAPI = {
  getOverview: () => apiCall<FinancialOverview>(`/analytics/overview/${DEFAULT_USER_ID}`),
  getInsights: () => apiCall<InsightsResponse>(`/analytics/insights/${DEFAULT_USER_ID}`),
  getBudgetAnalysis: () => apiCall<{ budgets: Budget[]; recommendations: string[] }>(`/analytics/budget-analysis/${DEFAULT_USER_ID}`),
  getTrends: () => apiCall<Array<{ month: string; income: number; expenses: number; savings: number }>>(`/analytics/trends/${DEFAULT_USER_ID}`),
  getSavingsOpportunities: () => apiCall<{ opportunities: Array<{ category: string; potential: number; reason: string }> }>(`/analytics/savings-opportunities/${DEFAULT_USER_ID}`),
};

// Health check
export const healthCheck = () => fetch(`${API_BASE_URL.replace('/api', '')}/health`).then(res => res.ok);
