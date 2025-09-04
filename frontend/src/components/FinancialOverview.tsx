import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { useFinancialData } from '../hooks/useFinancialData';
import { 
  ArrowUpIcon, 
  ArrowDownIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeType, icon: Icon }) => (
  <Card className="hover:shadow-lg transition-shadow duration-200">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${
              changeType === 'positive' ? 'text-green-600' : 
              changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {changeType === 'positive' && <ArrowUpIcon className="w-4 h-4 mr-1" />}
              {changeType === 'negative' && <ArrowDownIcon className="w-4 h-4 mr-1" />}
              {change}
            </div>
          )}
        </div>
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const FinancialOverview: React.FC = () => {
  const { 
    transactions, 
    totalIncome, 
    totalExpenses, 
    netSavings, 
    savingsRate,
    loading,
    error 
  } = useFinancialData();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'yearly' | 'ytd'>('yearly');
  const transactionsPerPage = 10;
  
  // Debug logging to see when data changes
  console.log('FinancialOverview render:', {
    transactionsCount: transactions.length,
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    loading,
    error,
    selectedYear,
    viewMode,
    transactions: transactions.map(t => ({ date: t.date, amount: t.amount, vendor: t.vendor }))
  });
  
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

  // Get available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    transactions.forEach(transaction => {
      const [year] = transaction.date.split('-');
      years.add(parseInt(year));
    });
    return Array.from(years).sort((a, b) => b - a); // Most recent first
  }, [transactions]);

  // Get current year
  const currentYear = new Date().getFullYear();

  // Generate monthly data from transactions for charts based on selected year and view mode
  const generateMonthlyData = () => {
    const monthlyMap = new Map<string, { income: number; expenses: number; savings: number }>();
    
    console.log('Generating monthly data for year:', selectedYear);
    console.log('Available transactions:', transactions.map(t => ({ 
      date: t.date, 
      year: parseInt(t.date.split('-')[0]), 
      month: parseInt(t.date.split('-')[1]) - 1,
      monthKey: t.date.slice(0, 7)
    })));
    
    transactions.forEach(transaction => {
      const [year, month] = transaction.date.split('-');
      const transactionYear = parseInt(year);
      const transactionMonth = parseInt(month) - 1; // Convert 1-12 to 0-11
      
      // Filter by selected year
      if (transactionYear !== selectedYear) return;
      
      // If YTD mode, only include months up to current month
      if (viewMode === 'ytd' && selectedYear === currentYear) {
        const currentMonth = new Date().getMonth();
        if (transactionMonth > currentMonth) return;
      }
      
      const monthKey = transaction.date.slice(0, 7); // YYYY-MM format
      console.log('Processing transaction:', { 
        date: transaction.date, 
        monthKey, 
        month: transactionMonth,
        year: transactionYear 
      });
      
      const current = monthlyMap.get(monthKey) || { income: 0, expenses: 0, savings: 0 };
      
      if (transaction.amount > 0) {
        current.income += transaction.amount;
      } else {
        current.expenses += Math.abs(transaction.amount);
      }
      
      current.savings = current.income - current.expenses;
      monthlyMap.set(monthKey, current);
    });
    
    console.log('MonthlyMap contents:', Array.from(monthlyMap.entries()).map(([key, data]) => ({ key, data })));
    
    // Convert to array and sort by monthKey (YYYY-MM) for chronological order
    const monthlyArray = Array.from(monthlyMap.entries())
      .map(([monthKey, data]) => {
        // Parse the monthKey more reliably
        const [, month] = monthKey.split('-').map(Number);
        const monthIndex = month - 1; // Convert 1-12 to 0-11
        
        // Use a reliable month name mapping
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        return {
          month: monthKey, // Use monthKey (YYYY-MM) for chart data to maintain order
          monthDisplay: monthNames[monthIndex], // For display only
          monthKey: monthKey, // Keep the original month key for sorting
          monthIndex: monthIndex, // Add month index (0-11) for proper ordering
          ...data
        };
      });
    
    // Sort by monthKey (YYYY-MM) for chronological order
    monthlyArray.sort((a, b) => {
      // Parse the monthKey (YYYY-MM) to get year and month for proper sorting
      const [yearA, monthA] = a.monthKey.split('-').map(Number);
      const [yearB, monthB] = b.monthKey.split('-').map(Number);
      
      if (yearA !== yearB) return yearA - yearB;
      return monthA - monthB;
    });
    
    // Debug logging to see the sorting
    console.log('Monthly data sorting:', {
      beforeSort: monthlyArray.map(item => ({ month: item.month, monthDisplay: item.monthDisplay, monthKey: item.monthKey, monthIndex: item.monthIndex })),
      afterSort: monthlyArray.map(item => ({ month: item.month, monthDisplay: item.monthDisplay, monthKey: item.monthKey, monthIndex: item.monthIndex })),
      selectedYear,
      viewMode
    });
    
    return monthlyArray;
  };

  const monthlyData = generateMonthlyData();

  // Calculate YTD totals for the selected year
  const ytdTotals = useMemo(() => {
    let ytdIncome = 0;
    let ytdExpenses = 0;
    
    transactions.forEach(transaction => {
      const [year, month] = transaction.date.split('-');
      const transactionYear = parseInt(year);
      const transactionMonth = parseInt(month) - 1; // Convert 1-12 to 0-11
      
      if (transactionYear !== selectedYear) return;
      
      // If YTD mode and current year, only include months up to current month
      if (viewMode === 'ytd' && selectedYear === currentYear) {
        const currentMonth = new Date().getMonth();
        if (transactionMonth > currentMonth) return;
      }
      
      if (transaction.amount > 0) {
        ytdIncome += transaction.amount;
      } else {
        ytdExpenses += Math.abs(transaction.amount);
      }
    });
    
    return {
      income: ytdIncome,
      expenses: ytdExpenses,
      savings: ytdIncome - ytdExpenses,
      savingsRate: ytdIncome > 0 ? ((ytdIncome - ytdExpenses) / ytdIncome) * 100 : 0
    };
  }, [transactions, selectedYear, viewMode, currentYear]);

  // Sort transactions by date (most recent first)
  const sortedTransactions = transactions
    .sort((a, b) => b.date.localeCompare(a.date));

  // Calculate pagination
  const totalPages = Math.ceil(sortedTransactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const currentTransactions = sortedTransactions.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading financial overview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <p className="mb-2">Error loading financial overview:</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Year Selection and View Mode Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-gray-500" />
                <label htmlFor="year-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Year:
                </label>
              </div>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">View Mode:</label>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('yearly')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'yearly'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Full Year
                </button>
                <button
                  onClick={() => setViewMode('ytd')}
                  disabled={selectedYear !== currentYear}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'ytd'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : selectedYear === currentYear
                      ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                  title={selectedYear !== currentYear ? 'YTD only available for current year' : ''}
                >
                  YTD
                </button>
              </div>
            </div>
          </div>
          
          {/* View Mode Info */}
          {viewMode === 'ytd' && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>YTD (Year-to-Date):</strong> Showing data from January through {new Date().toLocaleDateString('en-US', { month: 'long' })} {selectedYear}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={viewMode === 'ytd' ? 'YTD Income' : 'Total Income'}
          value={formatCurrency(ytdTotals.income)}
          change={viewMode === 'ytd' ? 'Current year to date' : `For ${selectedYear}`}
          changeType="positive"
          icon={CurrencyDollarIcon}
        />
        <StatCard
          title={viewMode === 'ytd' ? 'YTD Expenses' : 'Total Expenses'}
          value={formatCurrency(ytdTotals.expenses)}
          change={viewMode === 'ytd' ? 'Current year to date' : `For ${selectedYear}`}
          changeType="negative"
          icon={BanknotesIcon}
        />
        <StatCard
          title={viewMode === 'ytd' ? 'YTD Net Savings' : 'Net Savings'}
          value={formatCurrency(ytdTotals.savings)}
          change={viewMode === 'ytd' ? 'Current year to date' : `For ${selectedYear}`}
          changeType="positive"
          icon={ArrowTrendingUpIcon}
        />
        <StatCard
          title={viewMode === 'ytd' ? 'YTD Savings Rate' : 'Savings Rate'}
          value={`${ytdTotals.savingsRate.toFixed(1)}%`}
          change={viewMode === 'ytd' ? 'Current year to date' : `For ${selectedYear}`}
          changeType="positive"
          icon={ArrowTrendingUpIcon}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>
              {viewMode === 'ytd' ? 'YTD Income vs Expenses' : `${selectedYear} Income vs Expenses`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="monthDisplay" 
                  className="text-xs"
                  tick={{ fill: '#6B7280', fontSize: 10 }}
                  type="category"
                  allowDataOverflow={false}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: '#6B7280' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  labelFormatter={(label) => {
                    // Convert short month to full month name with year
                    const monthMap: { [key: string]: string } = {
                      'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
                      'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
                      'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
                    };
                    const fullMonth = monthMap[label] || label;
                    return `${fullMonth} ${selectedYear}`;
                  }}
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: '#F9FAFB', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  name="Income"
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  name="Expenses"
                  stroke="#EF4444" 
                  strokeWidth={2}
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Savings Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>
              {viewMode === 'ytd' ? 'YTD Monthly Savings' : `${selectedYear} Monthly Savings`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="monthDisplay" 
                  className="text-xs"
                  tick={{ fill: '#6B7280', fontSize: 10 }}
                  type="category"
                  allowDataOverflow={false}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: '#6B7280' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  labelFormatter={(label) => {
                    // Convert short month to full month name with year
                    const monthMap: { [key: string]: string } = {
                      'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
                      'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
                      'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
                    };
                    const fullMonth = monthMap[label] || label;
                    return `${fullMonth} ${selectedYear}`;
                  }}
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: '#F9FAFB', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="savings" 
                  name="Monthly Savings"
                  fill="#3B82F6" 
                  radius={[4, 4, 0, 0]}
                  className="hover:opacity-80 transition-opacity"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
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
          {transactions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No transactions yet. Add your first transaction to get started!</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Vendor</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Description</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Category</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {transaction.vendor}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {transaction.description}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                            {transaction.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-medium ${
                            transaction.amount > 0 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {transaction.amount > 0 ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
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
        </CardContent>
      </Card>
    </div>
  );
};
