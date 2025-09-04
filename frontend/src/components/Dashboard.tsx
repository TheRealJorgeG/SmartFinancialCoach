import React, { useState } from 'react';
import { 
  ChartBarIcon,
  CreditCardIcon,
  Cog6ToothIcon,
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
    { id: 'settings', icon: Cog6ToothIcon, label: 'Settings' },
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
      case 'settings':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Settings panel coming soon...</p>
            </CardContent>
          </Card>
        );
      default:
        return <TransactionManager />;
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

          {/* Bottom Stats */}
          <div className="mt-8 p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">This Month</span>
              <span className="text-green-400 text-sm font-medium">+$700</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-green-400 h-2 rounded-full w-3/4"></div>
            </div>
            <p className="text-gray-400 text-xs mt-2">19.2% savings rate</p>
          </div>
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
