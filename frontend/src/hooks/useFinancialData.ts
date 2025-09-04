import { useState, useEffect, useCallback } from 'react';
import { 
  transactionAPI, 
  budgetAPI, 
  subscriptionAPI, 
  analyticsAPI,
  Transaction, 
  Budget, 
  Subscription,
  FinancialOverview,
  AIInsight
} from '../services/api';

interface FinancialDataState {
  transactions: Transaction[];
  budgets: Budget[];
  subscriptions: Subscription[];
  overview: FinancialOverview | null;
  insights: AIInsight[];
  loading: boolean;
  error: string | null;
}

export const useFinancialData = () => {
  const [state, setState] = useState<FinancialDataState>({
    transactions: [],
    budgets: [],
    subscriptions: [],
    overview: null,
    insights: [],
    loading: true,
    error: null,
  });

  const refreshData = useCallback(() => {
    // Trigger a refresh by updating the state
    setState(prev => ({ ...prev }));
  }, []);

  // Load all financial data
  const loadAllData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const [
        transactions,
        budgets,
        subscriptions,
        overview,
        insightsResponse
      ] = await Promise.all([
        transactionAPI.getAll(),
        budgetAPI.getAll(),
        subscriptionAPI.getAll(),
        analyticsAPI.getOverview(),
        analyticsAPI.getInsights(),
      ]);

      // Extract insights array from the response object
      const insights = Array.isArray(insightsResponse) ? insightsResponse : (insightsResponse?.insights || []);

      setState(prev => ({
        ...prev,
        transactions,
        budgets,
        subscriptions,
        overview,
        insights,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load financial data',
      }));
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Transaction operations
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const newTransaction = await transactionAPI.create(transaction);
      setState(prev => ({
        ...prev,
        transactions: [...prev.transactions, newTransaction],
      }));
      // Refresh all data to update analytics and overview
      refreshData();
      return newTransaction;
    } catch (error) {
      throw error;
    }
  }, [refreshData]);

  const updateTransaction = useCallback(async (id: number, updates: Partial<Transaction>) => {
    try {
      const updatedTransaction = await transactionAPI.update(id, updates);
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.map(t => 
          t.id === id ? updatedTransaction : t
        ),
      }));
      // Refresh all data to update analytics and overview
      refreshData();
      return updatedTransaction;
    } catch (error) {
      throw error;
    }
  }, [refreshData]);

  const deleteTransaction = useCallback(async (id: number) => {
    try {
      await transactionAPI.delete(id);
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.filter(t => t.id !== id),
      }));
      // Refresh all data to update analytics and overview
      refreshData();
    } catch (error) {
      throw error;
    }
  }, [refreshData]);

  // Budget operations
  const addBudget = useCallback(async (budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'spent'>) => {
    try {
      const newBudget = await budgetAPI.create(budget);
      setState(prev => ({
        ...prev,
        budgets: [...prev.budgets, newBudget],
      }));
      return newBudget;
    } catch (error) {
      throw error;
    }
  }, []);

  const updateBudget = useCallback(async (id: number, updates: Partial<Budget>) => {
    try {
      const updatedBudget = await budgetAPI.update(id, updates);
      setState(prev => ({
        ...prev,
        budgets: prev.budgets.map(b => 
          b.id === id ? updatedBudget : b
        ),
      }));
      return updatedBudget;
    } catch (error) {
      throw error;
    }
  }, []);

  const deleteBudget = useCallback(async (id: number) => {
    try {
      await budgetAPI.delete(id);
      setState(prev => ({
        ...prev,
        budgets: prev.budgets.filter(b => b.id !== id),
      }));
    } catch (error) {
      throw error;
    }
  }, []);



  // Subscription operations
  const addSubscription = useCallback(async (subscription: Omit<Subscription, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const newSubscription = await subscriptionAPI.create(subscription);
      setState(prev => ({
        ...prev,
        subscriptions: [...prev.subscriptions, newSubscription],
      }));
      return newSubscription;
    } catch (error) {
      throw error;
    }
  }, []);

  const updateSubscription = useCallback(async (id: number, updates: Partial<Subscription>) => {
    try {
      const updatedSubscription = await subscriptionAPI.update(id, updates);
      setState(prev => ({
        ...prev,
        subscriptions: prev.subscriptions.map(s => 
          s.id === id ? updatedSubscription : s
        ),
      }));
      return updatedSubscription;
    } catch (error) {
      throw error;
    }
  }, []);

  const deleteSubscription = useCallback(async (id: number) => {
    try {
      await subscriptionAPI.delete(id);
      setState(prev => ({
        ...prev,
        subscriptions: prev.subscriptions.filter(s => s.id !== id),
      }));
    } catch (error) {
      throw error;
    }
  }, []);

  const updateSubscriptionStatus = useCallback(async (id: number, status: Subscription['status']) => {
    try {
      const updatedSubscription = await subscriptionAPI.updateStatus(id, status);
      setState(prev => ({
        ...prev,
        subscriptions: prev.subscriptions.map(s => 
          s.id === id ? updatedSubscription : s
        ),
      }));
      return updatedSubscription;
    } catch (error) {
      throw error;
    }
  }, []);

  const markNotSubscription = useCallback(async (vendor: string) => {
    try {
      await subscriptionAPI.markNotSubscription(vendor);
      // Refresh data to update the AI detection
      refreshData();
    } catch (error) {
      throw error;
    }
  }, [refreshData]);

  // Subscription management functions for UI
  const handleCancel = useCallback(async (id: number) => {
    try {
      await deleteSubscription(id);
    } catch (error) {
      console.error('Error canceling subscription:', error);
    }
  }, [deleteSubscription]);

  const handleKeep = useCallback(async (id: number) => {
    try {
      await updateSubscriptionStatus(id, 'active');
    } catch (error) {
      console.error('Error updating subscription status:', error);
    }
  }, [updateSubscriptionStatus]);

  // Computed values
  const totalIncome = state.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = state.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  return {
    ...state,
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addBudget,
    updateBudget,
    deleteBudget,

    addSubscription,
    updateSubscription,
    deleteSubscription,
    updateSubscriptionStatus,
    markNotSubscription,
    handleCancel,
    handleKeep,
    refreshData,
  };
};
