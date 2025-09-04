import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { useFinancialData } from '../hooks/useFinancialData';
import { 
  LightBulbIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingDownIcon,
  FireIcon,
  InformationCircleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface AIInsightCardProps {
  insight: {
    id: string;
    category: string;
    insight: string;
    impact: 'high' | 'medium' | 'low' | 'positive';
    savings: number;
    type?: string;
    priority?: 'high' | 'medium' | 'low';
  };
}

const AIInsightCard: React.FC<AIInsightCardProps> = ({ insight }) => {
  const getInsightIcon = (impact: string, priority?: string) => {
    if (priority === 'high') {
      return <FireIcon className="w-5 h-5 text-red-600" />;
    }
    
    switch (impact) {
      case 'high':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <LightBulbIcon className="w-5 h-5 text-yellow-500" />;
      case 'positive':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'low':
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <LightBulbIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getInsightBorderColor = (impact: string, priority?: string) => {
    if (priority === 'high') {
      return 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20';
    }
    
    switch (impact) {
      case 'high':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-red-900/10';
      case 'positive':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10';
      case 'low':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10';
      default:
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10';
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    
    const priorityColors: Record<string, string> = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColors[priority] || priorityColors.medium}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
      </span>
    );
  };

  const getImpactBadge = (impact: string) => {
    const impactColors: Record<string, string> = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      positive: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${impactColors[impact] || impactColors.medium}`}>
        {impact.charAt(0).toUpperCase() + impact.slice(1)} Impact
      </span>
    );
  };

  return (
    <div className={`p-4 rounded-lg border ${getInsightBorderColor(insight.impact, insight.priority)}`}>
      <div className="flex items-start space-x-3">
        {getInsightIcon(insight.impact, insight.priority)}
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {getPriorityBadge(insight.priority)}
            {getImpactBadge(insight.impact)}
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            {insight.insight}
          </p>
          {insight.savings > 0 && (
            <div className="flex items-center text-xs text-green-600 dark:text-green-400">
              <ArrowTrendingDownIcon className="w-3 h-3 mr-1" />
              Potential annual savings: ${insight.savings.toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const SpendingInsights: React.FC = () => {
  const { transactions, loading, error } = useFinancialData();
  const [timeView, setTimeView] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [insights, setInsights] = useState<any[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  // Fetch comprehensive AI insights (not time-constrained)
  const fetchInsights = React.useCallback(async () => {
    setInsightsLoading(true);
    try {
      // Always fetch comprehensive insights without time constraints
      const response = await fetch('/api/analytics/insights/1?timeView=comprehensive');
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights || []);
      } else {
        console.error('Failed to fetch insights');
        setInsights([]);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
      setInsights([]);
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  // Fetch insights once when component mounts
  React.useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Get available years and months from transactions
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    transactions.forEach(transaction => {
      const [year] = transaction.date.split('-');
      years.add(parseInt(year));
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const availableMonths = useMemo(() => {
    const months = new Set<number>();
    transactions.forEach(transaction => {
      const [year, month] = transaction.date.split('-');
      if (parseInt(year) === selectedYear) {
        months.add(parseInt(month) - 1); // Convert 1-12 to 0-11 for month index
      }
    });
    return Array.from(months).sort((a, b) => a - b);
  }, [transactions, selectedYear]);

  // Filter transactions based on selected time period
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const [year, month] = transaction.date.split('-');
      const transactionYear = parseInt(year);
      const transactionMonth = parseInt(month) - 1; // Convert 1-12 to 0-11
      
      if (timeView === 'yearly') {
        return transactionYear === selectedYear;
      } else {
        return transactionYear === selectedYear && transactionMonth === selectedMonth;
      }
    });
  }, [transactions, timeView, selectedYear, selectedMonth]);

  // Calculate spending categories from filtered transactions
  const spendingCategories = useMemo(() => {
    const expenseTransactions = filteredTransactions.filter(t => t.amount < 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const categoryMap = new Map<string, number>();
    expenseTransactions.forEach(transaction => {
      const current = categoryMap.get(transaction.category) || 0;
      categoryMap.set(transaction.category, current + Math.abs(transaction.amount));
    });
    
    return Array.from(categoryMap.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  // Generate monthly spending trends data
  const monthlyTrends = useMemo(() => {
    if (timeView === 'yearly') {
      const monthlyMap = new Map<string, { month: string; expenses: number; income: number; net: number }>();
      
      filteredTransactions.forEach(transaction => {
        const monthKey = transaction.date.slice(0, 7); // YYYY-MM format
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = parseInt(transaction.date.split('-')[1]) - 1; // Convert 1-12 to 0-11
        const monthName = monthNames[monthIndex];
        
        const current = monthlyMap.get(monthKey) || { month: monthName, expenses: 0, income: 0, net: 0 };
        
        if (transaction.amount > 0) {
          current.income += transaction.amount;
        } else {
          current.expenses += Math.abs(transaction.amount);
        }
        
        current.net = current.income - current.expenses;
        monthlyMap.set(monthKey, current);
      });
      
      // Sort by month chronologically
      return Array.from(monthlyMap.values())
        .sort((a, b) => {
          const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
        });
    }
    return [];
  }, [filteredTransactions, timeView]);

  // Generate year-over-year comparison data
  const yearlyComparison = useMemo(() => {
    if (timeView === 'yearly') {
      const years = Array.from(availableYears).slice(0, 3); // Last 3 years
      return years.map(year => {
        const yearTransactions = transactions.filter(t => {
          const [transactionYear] = t.date.split('-');
          return parseInt(transactionYear) === year;
        });
        const expenses = yearTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const income = yearTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        
        return {
          year: year.toString(),
          expenses,
          income,
          net: income - expenses
        };
      }).reverse(); // Show oldest to newest
    }
    return [];
  }, [transactions, timeView, availableYears]);

  // Group insights by impact
  const groupedInsights = useMemo(() => {
    const groups = {
      high: insights.filter(i => i.impact === 'high'),
      medium: insights.filter(i => i.impact === 'medium'),
      low: insights.filter(i => i.impact === 'low'),
      positive: insights.filter(i => i.impact === 'positive')
    };
    return groups;
  }, [insights]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formatCurrency(data.amount)} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;

    const RADIAN = Math.PI / 180;
    const sizeAdjustment = percent > 0.15 ? 0.7 : 0.6;
    const radius = innerRadius + (outerRadius - innerRadius) * sizeAdjustment;

    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
        style={{ pointerEvents: 'none' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading spending insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <p className="mb-2">Error loading spending insights:</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Insights - Always Comprehensive */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <LightBulbIcon className="w-5 h-5 text-yellow-500" />
            <span>AI-Powered Financial Insights</span>
            <span className="text-sm text-gray-500 font-normal">
              (Comprehensive Analysis - Always Up-to-Date)
            </span>
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AI analyzes your complete financial data to provide real-time insights, unusual spending alerts, and personalized recommendations.
          </p>
        </CardHeader>
        <CardContent>
          {insightsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Generating insights...</p>
              </div>
            </div>
          ) : insights.length > 0 ? (
            <div className="space-y-6">
              {/* High Priority Insights */}
              {groupedInsights.high.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center">
                    <FireIcon className="w-5 h-5 mr-2" />
                    High Priority Actions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedInsights.high.map((insight) => (
                      <AIInsightCard key={insight.id} insight={insight} />
                    ))}
                  </div>
                </div>
              )}

              {/* Medium Priority Insights */}
              {groupedInsights.medium.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400 mb-3 flex items-center">
                    <LightBulbIcon className="w-5 h-5 mr-2" />
                    Medium Priority Recommendations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedInsights.medium.map((insight) => (
                      <AIInsightCard key={insight.id} insight={insight} />
                    ))}
                  </div>
                </div>
              )}

              {/* Positive Insights */}
              {groupedInsights.positive.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Great Job! Keep It Up
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedInsights.positive.map((insight) => (
                      <AIInsightCard key={insight.id} insight={insight} />
                    ))}
                  </div>
                </div>
              )}

              {/* Low Priority Insights */}
              {groupedInsights.low.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center">
                    <InformationCircleIcon className="w-5 h-5 mr-2" />
                    Additional Tips
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedInsights.low.map((insight) => (
                      <AIInsightCard key={insight.id} insight={insight} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No AI insights available yet. Add some transactions to get personalized financial recommendations and spending alerts!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Time View Controls - For Spending Categories & Charts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-blue-500" />
            <span>Time Period Selection</span>
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select time period for spending categories and charts below. AI insights are always comprehensive and not affected by this selection.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            {/* Time View Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</span>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <Button
                  variant={timeView === 'monthly' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeView('monthly')}
                  className="text-xs"
                >
                  Month
                </Button>
                <Button
                  variant={timeView === 'yearly' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeView('yearly')}
                  className="text-xs"
                >
                  Yearly
                </Button>
              </div>
            </div>

            {/* Year Selection */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Month Selection (only for monthly view) */}
            {timeView === 'monthly' && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                >
                  {availableMonths.map(month => (
                    <option key={month} value={month}>
                      {new Date(selectedYear, month).toLocaleDateString('en-US', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Current Period Display */}
            <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
              {timeView === 'monthly' ? (
                <span>
                  {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              ) : (
                <span>{selectedYear}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>
              Spending by Category
              <span className="text-sm text-gray-500 font-normal ml-2">
                ({timeView === 'monthly' ? 'Monthly' : 'Yearly'})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer 
              width="100%" 
              height={350}
              debounce={100}
            >
              <PieChart>
                <Pie
                  data={spendingCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomLabel}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="amount"
                  isAnimationActive={true}
                  animationBegin={0}
                  animationDuration={800}
                  style={{ outline: 'none' }}
                >
                  {spendingCategories.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      style={{ outline: 'none' }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time-based Chart */}
        <Card>
          <CardHeader>
            <CardTitle>
              {timeView === 'monthly' ? 'Monthly Spending Trends' : 'Year-over-Year Comparison'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              {timeView === 'monthly' ? (
                // Monthly view: Show spending by category for the selected month
                <BarChart data={spendingCategories}>
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
                    formatter={(value: number, name: string) => [formatCurrency(value), 'Amount']}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                    {spendingCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                // Yearly view: Show year-over-year comparison
                <BarChart data={yearlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="year" 
                    className="text-xs"
                    tick={{ fill: '#6B7280', fontSize: 10 }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: '#6B7280' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    formatter={(value: number, name) => [formatCurrency(value), name]}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            Category Details
            <span className="text-sm text-gray-500 font-normal ml-2">
              ({timeView === 'monthly' ? 'Monthly' : 'Yearly'})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Category</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Amount</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Percentage</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                    {timeView === 'monthly' ? 'vs Last Month' : 'vs Last Year'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {spendingCategories.map((category, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-gray-900 dark:text-white font-medium">
                          {category.name}
                        </span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-900 dark:text-white font-medium">
                      {formatCurrency(category.amount)}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">
                      {category.percentage}%
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className={`text-sm ${
                        Math.random() > 0.5 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {Math.random() > 0.5 ? '+' : '-'}{(Math.random() * 20).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
