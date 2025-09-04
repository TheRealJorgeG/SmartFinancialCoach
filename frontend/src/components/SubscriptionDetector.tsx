import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { useFinancialData } from '../hooks/useFinancialData';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  EyeIcon,
  CreditCardIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface SubscriptionRowProps {
  subscription: {
    id: number;
    name: string;
    amount: number;
    frequency: 'monthly' | 'yearly';
    next_billing: string;
    category: string;
    status: 'active' | 'trial' | 'forgotten';
  };
  onCancel: (id: number) => void;
  onKeep: (id: number) => void;
}

const SubscriptionRow: React.FC<SubscriptionRowProps> = ({ subscription, onCancel, onKeep }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'trial':
        return <ClockIcon className="w-4 h-4 text-yellow-500" />;
      case 'forgotten':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      default:
        return <CheckCircleIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'trial':
        return 'Free Trial';
      case 'forgotten':
        return 'Unused';
      default:
        return 'Unknown';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'trial':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'forgotten':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const handleCancel = async () => {
    setIsProcessing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    onCancel(subscription.id);
    setIsProcessing(false);
  };

  const handleKeep = () => {
    onKeep(subscription.id);
  };

  return (
    <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="py-4 px-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <CreditCardIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{subscription.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{subscription.category}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="text-right">
          <p className="font-medium text-gray-900 dark:text-white">
            {formatCurrency(subscription.amount)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            per {subscription.frequency === 'monthly' ? 'month' : 'year'}
          </p>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="text-center">
          <p className="text-sm text-gray-900 dark:text-white">
            {formatDate(subscription.next_billing)}
          </p>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex justify-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(subscription.status)}`}>
            {getStatusIcon(subscription.status)}
            <span className="ml-1">{getStatusText(subscription.status)}</span>
          </span>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center justify-end space-x-2">
          {subscription.status === 'forgotten' || subscription.status === 'trial' ? (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancel}
                disabled={isProcessing}
                className="flex items-center space-x-1"
              >
                <XMarkIcon className="w-3 h-3" />
                <span>{isProcessing ? 'Canceling...' : 'Cancel'}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleKeep}
                className="flex items-center space-x-1"
              >
                <EyeIcon className="w-3 h-3" />
                <span>Keep</span>
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isProcessing}
              className="flex items-center space-x-1"
            >
              <XMarkIcon className="w-3 h-3" />
              <span>{isProcessing ? 'Canceling...' : 'Cancel'}</span>
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};

export const SubscriptionDetector: React.FC = () => {
  const { subscriptions, loading, error, deleteSubscription, updateSubscriptionStatus, transactions, addSubscription } = useFinancialData();
  
  // AI Subscription Detection State
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [processingSubscriptions, setProcessingSubscriptions] = useState<Set<string>>(new Set());
  const [rejectedVendors, setRejectedVendors] = useState<Set<string>>(new Set());
  const [permanentlyRemovedVendors, setPermanentlyRemovedVendors] = useState<Set<string>>(new Set());

  const handleCancel = async (id: number) => {
    try {
      // Find the subscription being cancelled to get vendor info
      const subscription = subscriptions.find(sub => sub.id === id);
      
      await deleteSubscription(id);
      
      // Remove from rejected vendors so it can be re-detected by AI
      if (subscription) {
        setRejectedVendors(prev => {
          const newSet = new Set(prev);
          newSet.delete(subscription.name); // Using name as vendor identifier
          return newSet;
        });
      }
      
      console.log('Subscription cancelled and can now be re-detected by AI');
    } catch (error) {
      console.error('Error canceling subscription:', error);
    }
  };

  // Handle permanently removing a vendor from AI detection
  const handlePermanentlyRemoveFromAI = async (detectedSub: any) => {
    try {
      setProcessingSubscriptions(prev => new Set(prev).add(detectedSub.id));
      
      // Add to permanently removed vendors
      setPermanentlyRemovedVendors(prev => new Set(prev).add(detectedSub.vendor));
      
      console.log(`${detectedSub.vendor} permanently removed from AI detection`);
    } catch (error) {
      console.error('Error removing from AI detection:', error);
    } finally {
      setProcessingSubscriptions(prev => {
        const newSet = new Set(prev);
        newSet.delete(detectedSub.id);
        return newSet;
      });
    }
  };

  const handleKeep = async (id: number) => {
    try {
      await updateSubscriptionStatus(id, 'active');
    } catch (error) {
      console.error('Error updating subscription status:', error);
    }
  };

  // Handle confirming AI-detected subscription
  const handleConfirmSubscription = async (detectedSub: any) => {
    try {
      console.log('Confirming subscription:', detectedSub);
      setProcessingSubscriptions(prev => new Set(prev).add(detectedSub.id));
      
      // Normalize frequency to only valid values (monthly or yearly)
      let normalizedFrequency: 'monthly' | 'yearly' = 'monthly';
      if (detectedSub.frequency === 'yearly') {
        normalizedFrequency = 'yearly';
      }
      
      // Ensure we have a valid date
      const nextBillingDate = detectedSub.nextBilling instanceof Date 
        ? detectedSub.nextBilling 
        : new Date(detectedSub.nextBilling);
      
      const newSubscription = {
        name: detectedSub.name || 'Unknown Service',
        amount: Number(detectedSub.amount) || 0,
        frequency: normalizedFrequency,
        next_billing: nextBillingDate.toISOString().split('T')[0], // YYYY-MM-DD format
        category: detectedSub.category || 'Other',
        status: 'active' as const
      };
      
      console.log('New subscription data:', newSubscription);
      
      const result = await addSubscription(newSubscription);
      console.log('Subscription added successfully:', result);
      
      // Temporarily remove from potential subscriptions by adding to rejected vendors set
      // This will hide it from the AI detection list but allow re-detection if cancelled
      setRejectedVendors(prev => new Set(prev).add(detectedSub.vendor));
      
      console.log('Subscription confirmation completed successfully');
    } catch (error) {
      console.error('Error confirming subscription:', error);
      alert('Failed to confirm subscription. Please check the console for details.');
    } finally {
      setProcessingSubscriptions(prev => {
        const newSet = new Set(prev);
        newSet.delete(detectedSub.id);
        return newSet;
      });
    }
  };


  // AI Subscription Detection
  const detectPotentialSubscriptions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    const potentialSubs: any[] = [];
    const vendorMap = new Map<string, any>();
    
    // Group transactions by vendor
    transactions.forEach(transaction => {
      if (transaction.amount < 0) { // Only expenses
        const vendor = transaction.vendor;
        // Skip if vendor has been rejected or permanently removed
        if (rejectedVendors.has(vendor) || permanentlyRemovedVendors.has(vendor)) return;
        
        if (!vendorMap.has(vendor)) {
          vendorMap.set(vendor, {
            vendor,
            transactions: [],
            totalSpent: 0,
            frequency: 0,
            categories: new Set(),
            lastTransaction: null,
            firstTransaction: null
          });
        }
        
        const vendorData = vendorMap.get(vendor)!;
        vendorData.transactions.push(transaction);
        vendorData.totalSpent += Math.abs(transaction.amount);
        vendorData.categories.add(transaction.category);
        vendorData.lastTransaction = new Date(transaction.date);
        
        if (!vendorData.firstTransaction || new Date(transaction.date) < vendorData.firstTransaction) {
          vendorData.firstTransaction = new Date(transaction.date);
        }
      }
    });
    
    // Analyze each vendor for subscription patterns
    vendorMap.forEach((vendorData, vendor) => {
      if (vendorData.transactions.length >= 2) {
        const daysBetween = vendorData.transactions
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map((t: any, i: any, arr: any[]) => {
            if (i === 0) return 0;
            return (new Date(t.date).getTime() - new Date(arr[i-1].date).getTime()) / (1000 * 60 * 60 * 24);
          })
          .filter((days: number) => days > 0);
        
        if (daysBetween.length > 0) {
          const avgDaysBetween = daysBetween.reduce((sum: number, days: number) => sum + days, 0) / daysBetween.length;
          const isRegular = daysBetween.every((days: number) => Math.abs(days - avgDaysBetween) < 7); // Within 7 days variance
          
          // Determine subscription type based on frequency and amount
          let subscriptionType = 'unknown';
          let confidence = 0;
          
          if (isRegular && avgDaysBetween <= 35) { // Monthly or more frequent
            subscriptionType = 'monthly';
            confidence = 0.9;
          } else if (isRegular && avgDaysBetween <= 45) { // Monthly with some variance
            subscriptionType = 'monthly';
            confidence = 0.7;
          } else if (isRegular && avgDaysBetween <= 400) { // Yearly
            subscriptionType = 'yearly';
            confidence = 0.8;
          } else if (vendorData.transactions.length >= 3) { // Regular but irregular timing
            subscriptionType = 'irregular';
            confidence = 0.5;
          }
          
          if (confidence > 0.4) {
            const avgAmount = vendorData.totalSpent / vendorData.transactions.length;
            const monthlyCost = subscriptionType === 'yearly' ? avgAmount / 12 : avgAmount;
            
            potentialSubs.push({
              id: `detected_${vendor}`,
              vendor,
              name: vendor,
              amount: avgAmount,
              monthlyCost,
              frequency: subscriptionType,
              confidence,
              category: Array.from(vendorData.categories)[0],
              lastBilling: vendorData.lastTransaction,
              nextBilling: new Date(vendorData.lastTransaction.getTime() + (avgDaysBetween * 24 * 60 * 60 * 1000)),
              transactionCount: vendorData.transactions.length,
              totalSpent: vendorData.totalSpent,
              pattern: {
                avgDaysBetween: Math.round(avgDaysBetween),
                regularity: isRegular ? 'high' : 'medium',
                variance: Math.round(Math.max(...daysBetween) - Math.min(...daysBetween))
              }
            });
          }
        }
      }
    });
    
    return potentialSubs.sort((a, b) => b.confidence - a.confidence);
  }, [transactions, rejectedVendors, permanentlyRemovedVendors]);

  // Generate AI Insights for Confirmed Subscriptions
  const generateSubscriptionInsights = useMemo(() => {
    const insights: any[] = [];
    
    if (subscriptions.length === 0) {
      insights.push({
        id: 'no_subscriptions',
        type: 'info',
        title: 'No Active Subscriptions',
        message: 'Great job! You currently have no active subscriptions, which helps keep your monthly expenses low.',
        icon: CheckCircleIcon,
        color: 'text-green-600'
      });
      return insights;
    }
    
    // Analyze confirmed subscriptions
    const activeSubs = subscriptions.filter(sub => sub.status === 'active');
    const forgottenSubs = subscriptions.filter(sub => sub.status === 'forgotten');
    
    if (activeSubs.length > 0) {
      const totalMonthlyCost = activeSubs.reduce((sum, sub) => {
        return sum + (sub.frequency === 'monthly' ? sub.amount : sub.amount / 12);
      }, 0);
      
      if (totalMonthlyCost > 100) {
        insights.push({
          id: 'high_monthly_cost',
          type: 'warning',
          title: 'High Monthly Subscription Cost',
          message: `Your active subscriptions total $${totalMonthlyCost.toFixed(2)} monthly. Consider reviewing which ones you actually use.`,
          icon: ExclamationTriangleIcon,
          color: 'text-orange-600',
          recommendation: 'Review and cancel unused subscriptions to save money.'
        });
      }
      
      // Find most expensive subscription
      const mostExpensive = activeSubs.reduce((max, sub) => {
        const monthlyCost = sub.frequency === 'monthly' ? sub.amount : sub.amount / 12;
        const maxMonthlyCost = max.frequency === 'monthly' ? max.amount : max.amount / 12;
        return monthlyCost > maxMonthlyCost ? sub : max;
      });
      
      const expensiveMonthlyCost = mostExpensive.frequency === 'monthly' ? mostExpensive.amount : mostExpensive.amount / 12;
      if (expensiveMonthlyCost > 50) {
        insights.push({
          id: 'expensive_subscription',
          type: 'warning',
          title: 'Expensive Subscription Detected',
          message: `${mostExpensive.name} costs $${expensiveMonthlyCost.toFixed(2)} monthly. Verify this is providing value.`,
          icon: ExclamationTriangleIcon,
          color: 'text-red-600',
          recommendation: 'Evaluate if this service is worth the cost.'
        });
      }
      
      // Check for multiple subscriptions in similar categories
      const categoryCount = activeSubs.reduce((acc, sub) => {
        acc[sub.category] = (acc[sub.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const duplicateCategories = Object.entries(categoryCount).filter(([_, count]) => count > 1);
      if (duplicateCategories.length > 0) {
        insights.push({
          id: 'duplicate_categories',
          type: 'info',
          title: 'Multiple Subscriptions in Same Category',
          message: `You have multiple subscriptions in: ${duplicateCategories.map(([cat]) => cat).join(', ')}. Consider consolidating.`,
          icon: ChartBarIcon,
          color: 'text-blue-600',
          recommendation: 'Look for overlapping services you can eliminate.'
        });
      }
    }
    
    // Analyze forgotten/unused subscriptions
    if (forgottenSubs.length > 0) {
      const potentialSavings = forgottenSubs.reduce((sum, sub) => 
        sum + (sub.frequency === 'monthly' ? sub.amount * 12 : sub.amount), 0
      );
      
      insights.push({
        id: 'forgotten_savings',
        type: 'opportunity',
        title: 'Potential Savings Opportunity',
        message: `You could save $${potentialSavings.toFixed(2)} annually by canceling ${forgottenSubs.length} unused subscription${forgottenSubs.length > 1 ? 's' : ''}.`,
        icon: LightBulbIcon,
        color: 'text-green-600',
        recommendation: 'Review and cancel forgotten subscriptions.'
      });
    }
    
    // Check for too many active subscriptions
    if (activeSubs.length > 5) {
      insights.push({
        id: 'many_subscriptions',
        type: 'info',
        title: 'Multiple Active Subscriptions',
        message: `You have ${activeSubs.length} active subscriptions. Consider consolidating similar services.`,
        icon: ChartBarIcon,
        color: 'text-blue-600',
        recommendation: 'Look for overlapping services you can eliminate.'
      });
    }
    
    return insights;
  }, [subscriptions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <p className="mb-2">Error loading subscriptions:</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const totalMonthlySpend = subscriptions.reduce((total: number, sub: any) => {
    return total + (sub.frequency === 'monthly' ? sub.amount : sub.amount / 12);
  }, 0);

  const totalYearlySpend = subscriptions.reduce((total: number, sub: any) => {
    return total + (sub.frequency === 'monthly' ? sub.amount * 12 : sub.amount);
  }, 0);

  const forgottenSubscriptions = subscriptions.filter((sub: any) => sub.status === 'forgotten');
  const trialSubscriptions = subscriptions.filter((sub: any) => sub.status === 'trial');
  const potentialSavings = forgottenSubscriptions.reduce((total: number, sub: any) => {
    return total + (sub.frequency === 'monthly' ? sub.amount * 12 : sub.amount);
  }, 0);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Monthly</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalMonthlySpend)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <CreditCardIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Yearly Cost</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(totalYearlySpend)}
                </p>
                <p className="text-xs text-gray-500 mt-1">all subscriptions</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {subscriptions.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">AI Detected</p>
                <p className="text-2xl font-bold text-purple-600">
                  {detectPotentialSubscriptions.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">potential subscriptions</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Subscription Detection Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="w-6 h-6 text-purple-600" />
              <CardTitle>AI Subscription Detection</CardTitle>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAiAnalysis(!showAiAnalysis)}
              className="flex items-center space-x-2"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
              <span>{showAiAnalysis ? 'Hide' : 'Show'} AI Analysis</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAiAnalysis && (
            <div className="space-y-6">

              {/* Detected Subscriptions */}
              {detectPotentialSubscriptions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Detected Potential Subscriptions ({detectPotentialSubscriptions.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Vendor</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Monthly Cost</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Frequency</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Confidence</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Pattern</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Next Billing</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detectPotentialSubscriptions.map((sub) => (
                          <tr key={sub.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="py-3 px-4">
                              <div className="font-medium text-gray-900 dark:text-white">{sub.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{sub.category}</div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatCurrency(sub.monthlyCost)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                {sub.frequency}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                sub.confidence >= 0.8 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                sub.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              }`}>
                                {Math.round(sub.confidence * 100)}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                <div>~{sub.pattern.avgDaysBetween} days</div>
                                <div className={`text-xs ${
                                  sub.pattern.regularity === 'high' ? 'text-green-600' : 'text-yellow-600'
                                }`}>
                                  {sub.pattern.regularity} regularity
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right text-sm text-gray-600 dark:text-gray-400">
                              {sub.nextBilling.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleConfirmSubscription(sub)}
                                  disabled={processingSubscriptions.has(sub.id)}
                                  className="flex items-center space-x-1"
                                >
                                  <CheckCircleIcon className="w-3 h-3" />
                                  <span>{processingSubscriptions.has(sub.id) ? 'Confirming...' : 'Confirm'}</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePermanentlyRemoveFromAI(sub)}
                                  disabled={processingSubscriptions.has(sub.id)}
                                  className="flex items-center space-x-1 text-gray-500 hover:text-red-500"
                                  title="Remove from AI detection permanently"
                                >
                                  <XMarkIcon className="w-3 h-3" />
                                  <span>Remove</span>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* No Subscriptions Detected */}
              {detectPotentialSubscriptions.length === 0 && subscriptions.length === 0 && (
                <div className="text-center py-8">
                  <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Subscriptions Detected
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Great job! Our AI analysis shows you have no recurring subscriptions, which helps keep your monthly expenses low.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts */}
      {(forgottenSubscriptions.length > 0 || trialSubscriptions.length > 0) && (
        <div className="space-y-4">
          {forgottenSubscriptions.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/10 dark:border-red-800">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                <p className="text-red-800 dark:text-red-400 font-medium">
                  Found {forgottenSubscriptions.length} unused subscription{forgottenSubscriptions.length > 1 ? 's' : ''}
                </p>
              </div>
              <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                Canceling unused subscriptions could save you {formatCurrency(potentialSavings)} annually.
              </p>
            </div>
          )}

          {trialSubscriptions.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/10 dark:border-yellow-800">
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-5 h-5 text-yellow-600" />
                <p className="text-yellow-800 dark:text-yellow-400 font-medium">
                  {trialSubscriptions.length} free trial{trialSubscriptions.length > 1 ? 's' : ''} ending soon
                </p>
              </div>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                Remember to cancel before you get charged if you don't want to continue.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {/* AI Insights Section */}
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center space-x-2 mb-4">
              <SparklesIcon className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Insights</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generateSubscriptionInsights.map((insight) => {
                const IconComponent = insight.icon;
                return (
                  <div
                    key={insight.id}
                    className={`p-3 rounded-lg border-l-4 border-l-${insight.color.split('-')[1]}-500 bg-${insight.color.split('-')[1]}-50 dark:bg-${insight.color.split('-')[1]}-900/10`}
                  >
                    <div className="flex items-start space-x-3">
                      <IconComponent className={`w-4 h-4 ${insight.color} mt-0.5`} />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1 text-sm">
                          {insight.title}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {insight.message}
                        </p>
                        {insight.recommendation && (
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            💡 {insight.recommendation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Service</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Cost</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Next Billing</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription: any) => (
                  <SubscriptionRow
                    key={subscription.id}
                    subscription={subscription}
                    onCancel={handleCancel}
                    onKeep={handleKeep}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Management Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Set Calendar Reminders</h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Add trial end dates to your calendar to avoid unwanted charges.
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-300 mb-2">Review Quarterly</h4>
              <p className="text-sm text-green-700 dark:text-green-400">
                Check your subscriptions every 3 months to catch unused services.
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
              <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-2">Use Annual Plans</h4>
              <p className="text-sm text-purple-700 dark:text-purple-400">
                Annual subscriptions often offer 10-20% savings over monthly plans.
              </p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
              <h4 className="font-medium text-orange-900 dark:text-orange-300 mb-2">Share Family Plans</h4>
              <p className="text-sm text-orange-700 dark:text-orange-400">
                Split family plans with friends or family to reduce per-person costs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
