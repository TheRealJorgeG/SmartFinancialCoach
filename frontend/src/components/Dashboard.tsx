import React, { useState } from 'react';
import { 
  ChartBarIcon,
  CreditCardIcon,
  HomeIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { FinancialOverview } from './FinancialOverview';
import { SpendingInsights } from './SpendingInsights';
import { SubscriptionDetector } from './SubscriptionDetector';
import { BudgetManager } from './BudgetManager';
import { TransactionManager } from './TransactionManager';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
      active 
        ? 'bg-blue-600 text-white' 
        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </button>
);

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const sidebarItems = [
    { id: 'overview', icon: HomeIcon, label: 'Overview' },
    { id: 'transactions', icon: CalculatorIcon, label: 'Transactions' },
    { id: 'insights', icon: ChartBarIcon, label: 'Spending Insights' },
    { id: 'budget', icon: CalculatorIcon, label: 'Budget Manager' },
    { id: 'subscriptions', icon: CreditCardIcon, label: 'Subscriptions' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'transactions':
        return <TransactionManager />;
      case 'overview':
        return <FinancialOverview />;
      case 'insights':
        return <SpendingInsights />;
      case 'budget':
        return <BudgetManager />;
      case 'subscriptions':
        return <SubscriptionDetector />;
      default:
        return <FinancialOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-dark-800 min-h-screen p-6">
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <CalculatorIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Smart Financial</h1>
              <p className="text-gray-400 text-sm">Coach</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activeTab === item.id}
                onClick={() => setActiveTab(item.id)}
              />
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {sidebarItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {activeTab === 'transactions' && "Add and manage your income and expenses"}
                {activeTab === 'overview' && "Get a complete view of your financial health"}
                {activeTab === 'insights' && "Discover where your money goes and how to save more"}
                {activeTab === 'budget' && "Set and track your monthly budgets"}
                {activeTab === 'subscriptions' && "Manage your recurring payments and subscriptions"}
                {activeTab === 'settings' && "Customize your financial coaching experience"}
              </p>
            </div>

            {/* Content */}
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
