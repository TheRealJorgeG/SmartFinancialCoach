import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useFinancialData } from '../hooks/useFinancialData';
import { Transaction } from '../services/api';

interface TransactionFormData {
  date: string;
  vendor: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
}

export const TransactionManager: React.FC = () => {
  const { 
    transactions, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction,
    loading,
    error 
  } = useFinancialData();

  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<TransactionFormData>({
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    description: '',
    amount: 0,
    category: '',
    type: 'expense'
  });

  const transactionsPerPage = 10;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  // Format date without timezone conversion issues
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, {
          ...formData,
          amount: formData.type === 'expense' ? -Math.abs(formData.amount) : Math.abs(formData.amount)
        });
        setEditingTransaction(null);
      } else {
        await addTransaction({
          ...formData,
          amount: formData.type === 'expense' ? -Math.abs(formData.amount) : Math.abs(formData.amount)
        });
      }
      
      setFormData({
        date: new Date().toISOString().split('T')[0],
        vendor: '',
        description: '',
        amount: 0,
        category: '',
        type: 'expense'
      });
      setShowForm(false);
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      date: transaction.date,
      vendor: transaction.vendor,
      description: transaction.description,
      amount: Math.abs(transaction.amount),
      category: transaction.category,
      type: transaction.amount > 0 ? 'income' : 'expense'
    });
    setShowForm(true);
  };

  const handleDelete = async (transactionId: number) => {
    try {
      await deleteTransaction(transactionId);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6B7280'
    ];
    const index = category.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Sort transactions by date (most recent first) and apply pagination
  const sortedTransactions = useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedTransactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const currentTransactions = sortedTransactions.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Reset to first page when transactions change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [transactions.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <p className="mb-2">Error loading transactions:</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Transaction Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Net Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${transactions.reduce((sum, t) => sum + t.amount, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(transactions.reduce((sum, t) => sum + t.amount, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Transaction Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Transaction</span>
        </Button>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {transactions.length === 0 ? (
                  'No transactions yet'
                ) : (
                  `Showing ${startIndex + 1}-${Math.min(endIndex, sortedTransactions.length)} of ${sortedTransactions.length} transactions`
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No transactions yet. Add your first transaction to get started!</p>
            ) : (
              <>
                {currentTransactions.map((transaction) => (
                  <div key={transaction.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getCategoryColor(transaction.category) }}
                        />
                        <div>
                          <h3 className="font-medium">{transaction.vendor}</h3>
                          <p className="text-sm text-gray-500">{transaction.description}</p>
                          <p className="text-xs text-gray-400">{transaction.category}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className={`font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="p-1 text-gray-400 hover:text-blue-500"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      >
                        <ChevronLeftIcon className="w-4 h-4 mr-1" />
                        Previous
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                          // Show first page, last page, current page, and pages around current page
                          const showPage = pageNum === 1 || 
                                         pageNum === totalPages || 
                                         Math.abs(pageNum - currentPage) <= 1;
                          
                          if (!showPage && pageNum === 2 && currentPage > 4) {
                            return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                          }
                          
                          if (!showPage && pageNum === totalPages - 1 && currentPage < totalPages - 3) {
                            return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                          }
                          
                          if (!showPage) return null;
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      >
                        Next
                        <ChevronRightIcon className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                    
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Page {currentPage} of {totalPages}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Transaction Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Vendor</label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
                </Button>
                <Button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingTransaction(null);
                    setFormData({
                      date: new Date().toISOString().split('T')[0],
                      vendor: '',
                      description: '',
                      amount: 0,
                      category: '',
                      type: 'expense'
                    });
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
