import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { useFinancialData } from '../hooks/useFinancialData';
import { Budget } from '../services/api';

interface BudgetFormData {
  category: string;
  allocated: number;
}

export const BudgetManager: React.FC = () => {
  const { 
    budgets, 
    totalIncome, 
    monthlyIncome,
    monthlyExpenses,
    monthlyNetSavings,
    monthlySavingsRate,
    monthlyBudgetSpending,
    currentMonth,
    transactions,
    addBudget, 
    updateBudget, 
    deleteBudget,
    loading,
    error 
  } = useFinancialData();

  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState<BudgetFormData>({
    category: '',
    allocated: 0
  });

  // Use actual monthly income and expenses for current month
  const currentMonthFormatted = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  });

  // Get unique categories from transactions (excluding income transactions)
  const availableCategories = React.useMemo(() => {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const categoriesSet = new Set(expenseTransactions.map(t => t.category));
    const categories = Array.from(categoriesSet);
    
    // Filter out categories that already have budgets for current month
    // BUT include the current editing budget's category if we're editing
    const existingBudgetCategories = budgets.map(b => b.category);
    const availableCategories = categories.filter(cat => {
      if (editingBudget && cat === editingBudget.category) {
        return true; // Include current editing category
      }
      return !existingBudgetCategories.includes(cat);
    });
    
    return availableCategories.sort();
  }, [transactions, budgets, editingBudget]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const getBudgetStatus = (budget: Budget, actualSpent: number) => {
    const percentage = (actualSpent / budget.allocated) * 100;
    
    if (percentage > 100) return { status: 'over', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (percentage > 80) return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  const totalAllocated = budgets.reduce((sum, budget) => sum + budget.allocated, 0);
  const totalActualSpent = monthlyBudgetSpending.reduce((sum, budget) => sum + budget.actualSpent, 0);
  const plannedFreeSpending = monthlyIncome - totalAllocated;
  const actualFreeSpending = monthlyIncome - totalActualSpent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, {
          category: formData.category,
          allocated: formData.allocated,
          is_essential: false
        });
        setEditingBudget(null);
      } else {
        await addBudget({
          category: formData.category,
          allocated: formData.allocated,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
          is_essential: false,
          month_year: new Date().toISOString().slice(0, 7) // YYYY-MM format
        });
      }
      
      setFormData({ category: '', allocated: 0 });
      setShowForm(false);
    } catch (error) {
      console.error('Failed to save budget:', error);
      // You could add a toast notification here
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      allocated: budget.allocated
    });
    setShowForm(true);
  };

  const handleDelete = async (budgetId: number) => {
    try {
      await deleteBudget(budgetId);
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  };

  const budgetChartData = monthlyBudgetSpending.map(budget => ({
    name: budget.category,
    allocated: budget.allocated,
    spent: budget.actualSpent,
    remaining: Math.max(0, budget.allocated - budget.actualSpent),
    color: budget.color
  }));

  const summaryData = [
    { name: 'Allocated', value: totalAllocated, color: '#3B82F6' },
    { name: 'Free Budget', value: Math.max(0, plannedFreeSpending), color: '#10B981' },
    ...(plannedFreeSpending < 0 ? [{ name: 'Over Budget', value: Math.abs(plannedFreeSpending), color: '#EF4444' }] : [])
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading budgets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <p className="mb-2">Error loading budgets:</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
              <div className="flex flex-col">
                <span>{currentMonthFormatted} Budget</span>
                <span className="text-sm font-normal text-gray-500">Current Month Overview</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Income</span>
                <span className="font-semibold text-green-600">{formatCurrency(monthlyIncome)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Budgeted</span>
                <span className="font-semibold">{formatCurrency(totalAllocated)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Budget Spent</span>
                <span className="font-semibold text-orange-600">{formatCurrency(totalActualSpent)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Other Expenses</span>
                <span className="font-semibold text-red-500">{formatCurrency(Math.max(0, monthlyExpenses - totalActualSpent))}</span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Planned Free Money</span>
                <span className={`font-bold ${plannedFreeSpending >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(plannedFreeSpending)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Remaining Budget Money</span>
                <span className={`font-bold ${actualFreeSpending >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(actualFreeSpending)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-sm font-medium">Monthly Savings</span>
                <span className={`font-bold ${monthlyNetSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(monthlyNetSavings)} ({monthlySavingsRate.toFixed(1)}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Allocation Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={summaryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {summaryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  labelStyle={{ fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {summaryData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {entry.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                onClick={() => setShowForm(true)}
                className="w-full flex items-center justify-center space-x-2"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add New Budget</span>
              </Button>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="mb-2">This Month's Budget Health:</p>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    <span>{monthlyBudgetSpending.filter(b => getBudgetStatus(b, b.actualSpent).status === 'good').length} on track</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
                    <span>{monthlyBudgetSpending.filter(b => getBudgetStatus(b, b.actualSpent).status === 'warning').length} at risk</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                    <span>{monthlyBudgetSpending.filter(b => getBudgetStatus(b, b.actualSpent).status === 'over').length} over budget</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget vs Spending Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{currentMonthFormatted} - Budget vs Actual Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={budgetChartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                tick={{ fill: '#6B7280', fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: '#6B7280' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [formatCurrency(value), name === 'allocated' ? 'Budget' : name === 'spent' ? 'Spent' : 'Remaining']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#F9FAFB', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="allocated" fill="#3B82F6" name="Budget" />
              <Bar dataKey="spent" fill="#EF4444" name="Spent" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Budget List */}
      <Card>
        <CardHeader>
          <CardTitle>{currentMonthFormatted} Budget Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyBudgetSpending.map((budget) => {
              const status = getBudgetStatus(budget, budget.actualSpent);
              const remaining = budget.allocated - budget.actualSpent;
              const percentage = (budget.actualSpent / budget.allocated) * 100;
              
              return (
                <div key={budget.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: budget.color }}
                      />
                      <div>
                        <h3 className="font-medium">{budget.category}</h3>
                        <p className="text-xs text-gray-500">
                          {budget.is_essential ? 'Essential' : 'Discretionary'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(budget)}
                        className="p-1 text-gray-400 hover:text-blue-500"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Spent This Month: {formatCurrency(budget.actualSpent)}</span>
                      <span>Monthly Budget: {formatCurrency(budget.allocated)}</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          percentage > 100 ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className={status.color}>
                        {remaining >= 0 ? `${formatCurrency(remaining)} remaining` : `${formatCurrency(Math.abs(remaining))} over budget`}
                      </span>
                      <span className="text-gray-500">
                        {percentage.toFixed(0)}% used
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Budget Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingBudget ? 'Edit Budget' : 'Add New Budget'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  required
                >
                  <option value="">Select a category...</option>
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {availableCategories.length === 0 && !editingBudget && (
                  <p className="text-xs text-gray-500 mt-1">
                    All transaction categories already have budgets. Add more transactions to see more categories.
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Monthly Budget</label>
                <input
                  type="number"
                  value={formData.allocated}
                  onChange={(e) => setFormData({ ...formData, allocated: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              
              <div className="flex space-x-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingBudget ? 'Update Budget' : 'Add Budget'}
                </Button>
                <Button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingBudget(null);
                    setFormData({ category: '', allocated: 0 });
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
