const express = require('express');
const { getDatabase } = require('../database/init');

const router = express.Router();
const db = getDatabase();

// Get comprehensive financial overview for a user
router.get('/overview/:userId', (req, res) => {
  const { userId } = req.params;
  const monthYear = req.query.monthYear || new Date().toISOString().slice(0, 7);

  // Get user's monthly income
  db.get(`
    SELECT monthly_income FROM users WHERE id = ?
  `, [userId], (err, user) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ error: 'Failed to fetch financial overview' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const monthlyIncome = user.monthly_income || 0;

    // Get budget summary
    db.get(`
      SELECT 
        COUNT(*) as totalBudgets,
        SUM(allocated) as totalAllocated,
        SUM(spent) as totalSpent,
        COUNT(CASE WHEN spent > allocated THEN 1 END) as overBudget,
        COUNT(CASE WHEN spent > allocated * 0.8 AND spent <= allocated THEN 1 END) as atRisk,
        COUNT(CASE WHEN spent <= allocated * 0.8 THEN 1 END) as onTrack
      FROM budgets 
      WHERE user_id = ? AND month_year = ?
    `, [userId, monthYear], (err, budgetSummary) => {
      if (err) {
        console.error('Error fetching budget summary:', err);
        return res.status(500).json({ error: 'Failed to fetch financial overview' });
      }

      // Get transaction summary for the month
      const startDate = monthYear + '-01';
      const endDate = monthYear + '-31';

      db.get(`
        SELECT 
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
          SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as totalExpenses,
          COUNT(CASE WHEN type = 'income' THEN 1 END) as incomeTransactions,
          COUNT(CASE WHEN type = 'expense' THEN 1 END) as expenseTransactions
        FROM transactions 
        WHERE user_id = ? AND date BETWEEN ? AND ?
      `, [userId, startDate, endDate], (err, transactionSummary) => {
        if (err) {
          console.error('Error fetching transaction summary:', err);
          return res.status(500).json({ error: 'Failed to fetch financial overview' });
        }

        const totalIncome = transactionSummary.totalIncome || 0;
        const totalExpenses = transactionSummary.totalExpenses || 0;
        const netSavings = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

        // Get subscription summary
        db.get(`
          SELECT 
            COUNT(*) as totalSubscriptions,
            SUM(CASE WHEN status = 'active' THEN 
              CASE WHEN frequency = 'monthly' THEN amount ELSE amount / 12 END
            ELSE 0 END) as monthlySubscriptionCost,
            SUM(CASE WHEN status = 'forgotten' THEN 
              CASE WHEN frequency = 'monthly' THEN amount ELSE amount / 12 END
            ELSE 0 END) as forgottenSubscriptionCost
          FROM subscriptions 
          WHERE user_id = ?
        `, [userId], (err, subscriptionSummary) => {
          if (err) {
            console.error('Error fetching subscription summary:', err);
            return res.status(500).json({ error: 'Failed to fetch financial overview' });
          }

          const overview = {
            monthlyIncome,
            totalIncome,
            totalExpenses,
            netSavings,
            savingsRate: Math.round(savingsRate * 100) / 100,
            budgetSummary: {
              ...budgetSummary,
              totalAllocated: budgetSummary.totalAllocated || 0,
              totalSpent: budgetSummary.totalSpent || 0,
              remainingBudget: (budgetSummary.totalAllocated || 0) - (budgetSummary.totalSpent || 0)
            },
            transactionSummary: {
              ...transactionSummary,
              totalIncome: totalIncome,
              totalExpenses: totalExpenses,
              incomeTransactions: transactionSummary.incomeTransactions || 0,
              expenseTransactions: transactionSummary.expenseTransactions || 0
            },
            subscriptionSummary: {
              ...subscriptionSummary,
              totalSubscriptions: subscriptionSummary.totalSubscriptions || 0,
              monthlySubscriptionCost: subscriptionSummary.monthlySubscriptionCost || 0,
              forgottenSubscriptionCost: subscriptionSummary.forgottenSubscriptionCost || 0,
              potentialSavings: subscriptionSummary.forgottenSubscriptionCost || 0
            }
          };

          res.json(overview);
        });
      });
    });
  });
});

// Get spending insights and AI recommendations
router.get('/insights/:userId', (req, res) => {
  const { userId } = req.params;
  const { months, year, month, timeView } = req.query;
  
  let startDate, endDate, queryCondition;
  
  // Determine time period based on parameters
  if (timeView === 'comprehensive') {
    // Comprehensive view - analyze all data for insights
    startDate = new Date(0); // Beginning of time
    endDate = new Date(); // Current date
    queryCondition = `1=1`; // No date filtering for comprehensive insights
  } else if (timeView === 'monthly' && year && month !== undefined) {
    // Specific month view
    startDate = new Date(parseInt(year), parseInt(month), 1);
    endDate = new Date(parseInt(year), parseInt(month) + 1, 0);
    queryCondition = `date >= ? AND date <= ?`;
  } else if (timeView === 'yearly' && year) {
    // Specific year view
    startDate = new Date(parseInt(year), 0, 1);
    endDate = new Date(parseInt(year), 11, 31);
    queryCondition = `date >= ? AND date <= ?`;
  } else {
    // Default: last 3 months
    startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);
    endDate = new Date();
    queryCondition = `date >= ? AND date <= ?`;
  }
  
  const startDateStr = startDate.toISOString().slice(0, 10);
  const endDateStr = endDate.toISOString().slice(0, 10);

  // Get spending by category for the selected time period
  const categoryQuery = timeView === 'comprehensive' ? 
    `SELECT 
      category,
      SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as totalSpent,
      COUNT(CASE WHEN type = 'expense' THEN 1 END) as transactionCount,
      AVG(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as averageTransaction,
      MAX(CASE WHEN type = 'expense' THEN date ELSE NULL END) as lastTransaction
    FROM transactions 
    WHERE user_id = ? AND type = 'expense'
    GROUP BY category
    ORDER BY totalSpent DESC` :
    `SELECT 
      category,
      SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as totalSpent,
      COUNT(CASE WHEN type = 'expense' THEN 1 END) as transactionCount,
      AVG(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as averageTransaction,
      MAX(CASE WHEN type = 'expense' THEN date ELSE NULL END) as lastTransaction
    FROM transactions 
    WHERE user_id = ? AND ${queryCondition} AND type = 'expense'
    GROUP BY category
    ORDER BY totalSpent DESC`;

  const categoryParams = timeView === 'comprehensive' ? [userId] : [userId, startDateStr, endDateStr];
  
  db.all(categoryQuery, categoryParams, (err, spendingCategories) => {
    if (err) {
      console.error('Error fetching spending categories:', err);
      return res.status(500).json({ error: 'Failed to fetch spending insights' });
    }

    // Get monthly spending trends
    const trendsQuery = timeView === 'comprehensive' ?
      `SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as expenses,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income
      FROM transactions 
      WHERE user_id = ?
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month DESC` :
      `SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as expenses,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income
      FROM transactions 
      WHERE user_id = ? AND ${queryCondition}
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month DESC`;

    const trendsParams = timeView === 'comprehensive' ? [userId] : [userId, startDateStr, endDateStr];
    
    db.all(trendsQuery, trendsParams, (err, monthlyTrends) => {
      if (err) {
        console.error('Error fetching monthly trends:', err);
        return res.status(500).json({ error: 'Failed to fetch spending insights' });
      }

      // Get subscription insights
      db.all(`
        SELECT 
          name,
          amount,
          frequency,
          status,
          category,
          CASE 
            WHEN frequency = 'monthly' THEN amount 
            ELSE amount / 12 
          END as monthlyCost
        FROM subscriptions 
        WHERE user_id = ?
        ORDER BY monthlyCost DESC
      `, [userId], (err, subscriptions) => {
        if (err) {
          console.error('Error fetching subscriptions:', err);
          return res.status(500).json({ error: 'Failed to fetch spending insights' });
        }

        // Generate AI insights with time context
        let insights = [];
        if (spendingCategories.length > 0 || monthlyTrends.length > 0) {
          // Generate enhanced AI insights asynchronously
          generateAIInsights(spendingCategories, monthlyTrends, subscriptions, { timeView, year, month })
            .then(enhancedInsights => {
              insights = enhancedInsights;
              
              const spendingInsights = {
                spendingCategories: spendingCategories.map(cat => ({
                  ...cat,
                  percentage: 0 // Will be calculated below
                })),
                monthlyTrends,
                subscriptions,
                insights,
                summary: {
                  totalSpent: spendingCategories.reduce((sum, cat) => sum + cat.totalSpent, 0),
                  averageMonthlySpending: monthlyTrends.reduce((sum, month) => sum + month.expenses, 0) / Math.max(monthlyTrends.length, 1),
                  totalSubscriptions: subscriptions.length,
                  monthlySubscriptionCost: subscriptions.reduce((sum, sub) => sum + sub.monthlyCost, 0)
                }
              };

              // Calculate percentages for spending categories
              if (spendingInsights.summary.totalSpent > 0) {
                spendingInsights.spendingCategories.forEach(cat => {
                  cat.percentage = Math.round((cat.totalSpent / spendingInsights.summary.totalSpent) * 100);
                });
              }

              res.json(spendingInsights);
            })
            .catch(error => {
              console.error('Error generating AI insights:', error);
              // Fallback to basic insights
              insights = generateNoDataInsights({ timeView, year, month });
              
              const spendingInsights = {
                spendingCategories: spendingCategories.map(cat => ({
                  ...cat,
                  percentage: 0
                })),
                monthlyTrends,
                subscriptions,
                insights,
                summary: {
                  totalSpent: spendingCategories.reduce((sum, cat) => sum + cat.totalSpent, 0),
                  averageMonthlySpending: monthlyTrends.reduce((sum, month) => sum + month.expenses, 0) / Math.max(monthlyTrends.length, 1),
                  totalSubscriptions: subscriptions.length,
                  monthlySubscriptionCost: subscriptions.reduce((sum, sub) => sum + sub.monthlyCost, 0)
                }
              };

              if (spendingInsights.summary.totalSpent > 0) {
                spendingInsights.spendingCategories.forEach(cat => {
                  cat.percentage = Math.round((cat.totalSpent / spendingInsights.summary.totalSpent) * 100);
                });
              }

              res.json(spendingInsights);
            });
          
          return; // Exit early since we're handling response asynchronously
        } else {
          // Generate insights for when there's no data in the selected time period
          insights = generateNoDataInsights({ timeView, year, month });
        }


      });
    });
  });
});

// Get budget vs actual spending analysis
router.get('/budget-analysis/:userId', (req, res) => {
  const { userId } = req.params;
  const monthYear = req.query.monthYear || new Date().toISOString().slice(0, 7);

  db.all(`
    SELECT 
      b.id,
      b.category,
      b.allocated,
      b.spent,
      b.color,
      b.is_essential as isEssential,
      CASE 
        WHEN b.spent > b.allocated THEN 'over'
        WHEN b.spent > b.allocated * 0.8 THEN 'warning'
        ELSE 'good'
      END as status,
      ROUND((b.spent / b.allocated) * 100, 1) as percentageUsed,
      b.allocated - b.spent as remaining
    FROM budgets b
    WHERE b.user_id = ? AND b.month_year = ?
    ORDER BY b.is_essential DESC, b.spent DESC
  `, [userId, monthYear], (err, budgetAnalysis) => {
    if (err) {
      console.error('Error fetching budget analysis:', err);
      return res.status(500).json({ error: 'Failed to fetch budget analysis' });
    }

    // Calculate summary statistics
    const totalAllocated = budgetAnalysis.reduce((sum, budget) => sum + budget.allocated, 0);
    const totalSpent = budgetAnalysis.reduce((sum, budget) => sum + budget.spent, 0);
    const totalRemaining = totalAllocated - totalSpent;
    const overallPercentageUsed = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

    const analysis = {
      budgets: budgetAnalysis,
      summary: {
        totalAllocated,
        totalSpent,
        totalRemaining,
        overallPercentageUsed: Math.round(overallPercentageUsed * 100) / 100,
        status: overallPercentageUsed > 100 ? 'over' : overallPercentageUsed > 80 ? 'warning' : 'good'
      }
    };

    res.json(analysis);
  });
});

// Get financial trends over time
router.get('/trends/:userId', (req, res) => {
  const { userId } = req.params;
  const { months = 6 } = req.query;

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - parseInt(months));
  const startDateStr = startDate.toISOString().slice(0, 10);

  db.all(`
    SELECT 
      strftime('%Y-%m', date) as month,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as expenses,
      SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as netCashFlow
    FROM transactions 
    WHERE user_id = ? AND date >= ?
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month ASC
  `, [userId, startDateStr], (err, trends) => {
    if (err) {
      console.error('Error fetching trends:', err);
      return res.status(500).json({ error: 'Failed to fetch financial trends' });
    }

    res.json(trends);
  });
});

// Get savings opportunities
router.get('/savings-opportunities/:userId', (req, res) => {
  const { userId } = req.params;
  const monthYear = req.query.monthYear || new Date().toISOString().slice(0, 7);

  db.all(`
    SELECT 
      category,
      SUM(ABS(amount)) as totalSpent,
      COUNT(*) as transactionCount,
      AVG(ABS(amount)) as averageTransaction
    FROM transactions 
    WHERE user_id = ? AND type = 'expense' AND strftime('%Y-%m', date) = ?
    GROUP BY category
    HAVING totalSpent > 100
    ORDER BY totalSpent DESC
  `, [userId, monthYear], (err, opportunities) => {
    if (err) {
      console.error('Error fetching savings opportunities:', err);
      return res.status(500).json({ error: 'Failed to fetch savings opportunities' });
    }

    const savingsSuggestions = opportunities.map(opp => ({
      category: opp.category,
      potential: Math.round(opp.totalSpent * 0.2), // Suggest 20% reduction
      reason: `High spending in ${opp.category} with ${opp.transactionCount} transactions averaging $${Math.round(opp.averageTransaction)}`,
      currentSpending: opp.totalSpent
    }));

    res.json({ opportunities: savingsSuggestions });
  });
});

// Enhanced AI Insights with Machine Learning-style Analysis
function generateEnhancedAIInsights(transactions, spendingCategories, monthlyTrends, subscriptions, timeView) {
  const insights = [];
  
  if (spendingCategories.length === 0) {
    return insights;
  }

  // 1. ANOMALY DETECTION - Detect unusual spending patterns
  const spendingAnomalies = detectSpendingAnomalies(transactions, timeView);
  spendingAnomalies.forEach((anomaly, index) => {
    insights.push({
      id: `anomaly_${index}`,
      category: 'Anomaly Detection',
      insight: `🚨 Unusual ${anomaly.category} expense: $${Math.abs(anomaly.transaction.amount).toFixed(2)} at ${anomaly.transaction.vendor} on ${anomaly.transaction.date}. This is ${anomaly.deviation.toFixed(1)} standard deviations above your normal spending.`,
      impact: anomaly.severity,
      savings: Math.abs(anomaly.transaction.amount) - calculateCategoryAverage(transactions, anomaly.category),
      type: 'anomaly_detection',
      actionable: true,
      recommendation: `Review if this ${anomaly.category} expense of $${Math.abs(anomaly.transaction.amount).toFixed(2)} was necessary. Your average for this category is $${calculateCategoryAverage(transactions, anomaly.category).toFixed(2)}.`,
      priority: anomaly.severity === 'high' ? 'high' : 'medium'
    });
  });

  // 2. FORECASTING - Predict future spending trends
  const categorySpending = groupTransactionsByCategory(transactions);
  Object.entries(categorySpending).forEach(([category, categoryTransactions]) => {
    const forecast = forecastSpending(getMonthlyTrends(categoryTransactions), category);
    if (forecast && forecast.length > 0) {
      const nextMonthPrediction = forecast[0];
      const currentMonthSpending = getCurrentMonthSpending(categoryTransactions);
      
      if (nextMonthPrediction.predictedAmount > currentMonthSpending * 1.1) {
        insights.push({
          id: `forecast_${category}`,
          category: 'Spending Forecast',
          insight: `📈 Based on your spending patterns, you're likely to spend $${nextMonthPrediction.predictedAmount.toFixed(2)} on ${category} next month (${((nextMonthPrediction.predictedAmount / currentMonthSpending - 1) * 100).toFixed(1)}% increase).`,
          impact: 'medium',
          confidence: nextMonthPrediction.confidence,
          type: 'forecasting',
          actionable: true,
          recommendation: `Consider setting a budget limit of $${(currentMonthSpending * 1.05).toFixed(2)} for ${category} to control this predicted increase.`,
          priority: 'medium'
        });
      }
    }
  });

  // 3. SEASONAL PATTERNS - Analyze monthly spending cycles
  const seasonalPatterns = detectSeasonalPatterns(transactions);
  const currentMonth = new Date().getMonth();
  const currentSeasonality = seasonalPatterns[currentMonth];
  
  if (currentSeasonality.pattern === 'high') {
    insights.push({
      id: 'seasonal_high',
      category: 'Seasonal Patterns',
      insight: `📅 ${currentSeasonality.monthName} is typically a high-spending month for you (${(currentSeasonality.seasonality * 100 - 100).toFixed(1)}% above average). Plan accordingly.`,
      impact: 'medium',
      type: 'seasonal_analysis',
      actionable: true,
          recommendation: `Increase your budget by ${((currentSeasonality.seasonality - 1) * 100).toFixed(1)}% this month or look for ways to reduce non-essential spending.`,
          priority: 'medium'
    });
  }

  // 4. BEHAVIORAL PATTERNS - Vendor frequency analysis
  const vendorFrequency = analyzeVendorPatterns(transactions);
  vendorFrequency.slice(0, 3).forEach((vendor, index) => {
    if (vendor.frequency > 8) { // More than twice a week
      insights.push({
        id: `behavior_${index}`,
        category: 'Behavioral Patterns',
        insight: `🔄 You visit ${vendor.name} frequently (${vendor.frequency} times this period, averaging $${vendor.averageAmount.toFixed(2)} per visit). Total: $${vendor.totalSpent.toFixed(2)}.`,
        impact: vendor.totalSpent > 200 ? 'high' : 'medium',
        savings: vendor.totalSpent * 0.2,
        type: 'behavioral_analysis',
        actionable: true,
        recommendation: `Consider reducing visits to ${vendor.name} by 20% to save $${(vendor.totalSpent * 0.2).toFixed(2)}.`,
        priority: vendor.totalSpent > 200 ? 'high' : 'medium'
      });
    }
  });

  // 5. GOAL-BASED INSIGHTS - Financial health and savings analysis
  const monthlyIncome = calculateMonthlyIncome(transactions);
  const monthlyExpenses = calculateMonthlyExpenses(transactions);
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
  
  if (savingsRate < 20) {
    insights.push({
      id: 'savings_goal',
      category: 'Financial Goals',
      insight: `🎯 Your current savings rate is ${savingsRate.toFixed(1)}%. Financial experts recommend saving at least 20% of income.`,
      impact: 'high',
      type: 'goal_oriented',
      actionable: true,
      recommendation: `To reach a 20% savings rate, reduce monthly expenses by $${((monthlyIncome * 0.2) - (monthlyIncome - monthlyExpenses)).toFixed(2)}.`,
      targetAmount: (monthlyIncome * 0.2) - (monthlyIncome - monthlyExpenses),
      priority: 'high'
    });
  } else {
    insights.push({
      id: 'savings_excellent',
      category: 'Financial Goals',
      insight: `🏆 Excellent! Your savings rate of ${savingsRate.toFixed(1)}% exceeds the recommended 20%. You're building strong financial security.`,
      impact: 'positive',
      type: 'goal_oriented',
      actionable: false,
      priority: 'low'
    });
  }

  // 6. CATEGORY OPTIMIZATION - Spending efficiency analysis
  const topCategory = spendingCategories[0];
  if (topCategory.totalSpent > 300) {
    insights.push({
      id: 'category_optimization',
      category: 'Category Optimization',
      insight: `💡 Your top spending category is ${topCategory.category} at $${topCategory.totalSpent.toFixed(2)} (${topCategory.percentage}% of total spending). This is a significant portion of your budget.`,
      impact: 'high',
      savings: Math.round(topCategory.totalSpent * 0.15),
      type: 'category_optimization',
      actionable: true,
      recommendation: `Consider setting a budget limit of $${(topCategory.totalSpent * 0.8).toFixed(2)} for ${topCategory.category} to reduce spending by 20%.`,
      priority: 'high'
    });
  }

  // 7. TREND ANALYSIS - Monthly spending changes
  if (monthlyTrends.length > 1) {
    const latestMonth = monthlyTrends[0];
    const previousMonth = monthlyTrends[1];
    const spendingChange = latestMonth.expenses - previousMonth.expenses;
    const changePercentage = previousMonth.expenses > 0 ? (spendingChange / previousMonth.expenses) * 100 : 0;
    
    if (Math.abs(changePercentage) > 15) {
      insights.push({
        id: 'trend_analysis',
        category: 'Trend Analysis',
        insight: `📊 Your spending ${spendingChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(changePercentage).toFixed(1)}% from ${previousMonth.month} to ${latestMonth.month}. ${spendingChange > 0 ? 'This significant increase warrants attention.' : 'Great job on reducing spending!'}`,
        impact: Math.abs(changePercentage) > 25 ? 'high' : 'medium',
        savings: spendingChange > 0 ? Math.round(Math.abs(spendingChange) * 0.2) : 0,
        type: 'trend_analysis',
        actionable: spendingChange > 0,
        recommendation: spendingChange > 0 ? `Investigate what caused this ${changePercentage.toFixed(1)}% spending increase and identify areas to cut back.` : 'Maintain this positive trend!',
        priority: Math.abs(changePercentage) > 25 ? 'high' : 'medium'
      });
    }
  }

  // 8. SUBSCRIPTION OPTIMIZATION - Even if no subscriptions
  if (subscriptions.length === 0) {
    insights.push({
      id: 'subscription_status',
      category: 'Subscription Management',
      insight: '✅ You currently have no active subscriptions. This is excellent for keeping monthly expenses low and avoiding recurring charges.',
      impact: 'positive',
      type: 'subscription_status',
      actionable: false,
      priority: 'low'
    });
  } else {
    const totalMonthlySubscriptions = subscriptions.reduce((sum, sub) => sum + sub.monthlyCost, 0);
    if (totalMonthlySubscriptions > 100) {
      insights.push({
        id: 'subscription_optimization',
        category: 'Subscription Management',
        insight: `💰 You're spending $${totalMonthlySubscriptions.toFixed(2)} monthly on subscriptions. This represents ${((totalMonthlySubscriptions / monthlyExpenses) * 100).toFixed(1)}% of your total expenses.`,
        impact: 'medium',
        savings: Math.round(totalMonthlySubscriptions * 0.2),
        type: 'subscription_optimization',
        actionable: true,
        recommendation: `Review all subscriptions and cancel any you don't actively use. Even a 20% reduction could save you $${(totalMonthlySubscriptions * 0.2).toFixed(2)} monthly.`,
        priority: 'medium'
      });
    }
  }

  return insights;
}

// Enhanced AI Insights with Machine Learning-style Analysis
function generateAIInsights(spendingCategories, monthlyTrends, subscriptions, timeContext) {
  console.log('🔍 generateAIInsights called with:', { 
    categoriesCount: spendingCategories.length, 
    trendsCount: monthlyTrends.length, 
    subscriptionsCount: subscriptions.length,
    timeContext 
  });
  
  // Get all transactions for the user to perform advanced analysis
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT * FROM transactions 
      WHERE user_id = 1 
      ORDER BY date DESC
    `, [], (err, transactions) => {
      if (err) {
        console.error('Error fetching transactions for AI analysis:', err);
        resolve([]);
        return;
      }
      
      console.log(`📊 Fetched ${transactions.length} transactions for AI analysis`);
      
      try {
        const enhancedInsights = generateEnhancedAIInsights(
          transactions, 
          spendingCategories, 
          monthlyTrends, 
          subscriptions, 
          timeContext.timeView
        );
        
        // Add time-specific trend insights for comprehensive view
        if (timeContext.timeView === 'comprehensive') {
          const timeTrendInsights = generateTimeTrendInsights(transactions);
          enhancedInsights.push(...timeTrendInsights);
        }
        
        console.log(`🎯 Generated ${enhancedInsights.length} enhanced insights:`, enhancedInsights.map(i => i.category));
        resolve(enhancedInsights);
      } catch (error) {
        console.error('Error in generateEnhancedAIInsights:', error);
        resolve([]);
      }
    });
  });
}

// Helper function for no data insights
function generateNoDataInsights(timeContext) {
  const insights = [];
  
  if (timeContext.timeView === 'monthly') {
    insights.push({
      id: '1',
      category: 'Data',
      insight: `No transaction data found for ${timeContext.month !== undefined ? `month ${parseInt(timeContext.month) + 1}` : 'this period'}. Add some transactions to get personalized insights.`,
      impact: 'low',
      savings: 0,
      type: 'data_encouragement'
    });
  } else if (timeContext.timeView === 'yearly') {
    insights.push({
      id: '1',
      category: 'Data',
      insight: `No transaction data found for ${timeContext.year || 'this year'}. Begin tracking your finances to see your spending patterns.`,
      impact: 'low',
      savings: 0,
      type: 'data_encouragement'
    });
  }

  return insights;
}

// ===== ENHANCED AI HELPER FUNCTIONS =====

// 1. ANOMALY DETECTION FUNCTIONS
function detectSpendingAnomalies(transactions, timeView) {
  const anomalies = [];
  
  // Group by category and calculate statistics
  const categoryGroups = groupBy(transactions, 'category');
  
  categoryGroups.forEach(group => {
    const amounts = group.transactions.map(t => Math.abs(t.amount));
    if (amounts.length < 3) return; // Need at least 3 transactions for statistical analysis
    
    const mean = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return; // No variance, can't detect anomalies
    
    // Find transactions that exceed 2 standard deviations
    group.transactions.forEach(transaction => {
      const amount = Math.abs(transaction.amount);
      if (amount > mean + (2 * stdDev)) {
        anomalies.push({
          transaction,
          category: group.category,
          deviation: (amount - mean) / stdDev,
          severity: amount > (mean + 3 * stdDev) ? 'high' : 'medium'
        });
      }
    });
  });
  
  return anomalies;
}

// 2. FORECASTING FUNCTIONS
function forecastSpending(monthlyData, category) {
  if (monthlyData.length < 3) return null;
  
  // Convert to monthly data points
  const dataPoints = monthlyData.map((data, index) => ({
    x: index,
    y: data.totalSpent || data.expenses || 0
  }));
  
  // Calculate linear regression
  const n = dataPoints.length;
  const sumX = dataPoints.reduce((sum, point) => sum + point.x, 0);
  const sumY = dataPoints.reduce((sum, point) => sum + point.y, 0);
  const sumXY = dataPoints.reduce((sum, point) => sum + (point.x * point.y), 0);
  const sumXX = dataPoints.reduce((sum, point) => sum + (point.x * point.x), 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Predict next month
  const predictedAmount = slope * n + intercept;
  
  return [{
    month: 1,
    predictedAmount: Math.max(0, predictedAmount),
    confidence: calculateConfidence(dataPoints, slope, intercept)
  }];
}

function calculateConfidence(dataPoints, slope, intercept) {
  if (dataPoints.length < 2) return 0;
  
  // Calculate R-squared for confidence measure
  const yMean = dataPoints.reduce((sum, point) => sum + point.y, 0) / dataPoints.length;
  const ssTotal = dataPoints.reduce((sum, point) => sum + Math.pow(point.y - yMean, 2), 0);
  const ssRes = dataPoints.reduce((sum, point) => {
    const predicted = slope * point.x + intercept;
    return sum + Math.pow(point.y - predicted, 2);
  }, 0);
  
  return Math.max(0, Math.min(1, 1 - (ssRes / ssTotal)));
}

// 3. SEASONAL PATTERN FUNCTIONS
function detectSeasonalPatterns(transactions) {
  const monthlySpending = Array(12).fill(0);
  const monthlyCounts = Array(12).fill(0);
  
  transactions.forEach(transaction => {
    const month = new Date(transaction.date).getMonth();
    monthlySpending[month] += Math.abs(transaction.amount);
    monthlyCounts[month]++;
  });
  
  const avgMonthlySpending = monthlySpending.map((total, index) => 
    monthlyCounts[index] > 0 ? total / monthlyCounts[index] : 0
  );
  
  const overallAvg = avgMonthlySpending.reduce((sum, amt) => sum + amt, 0) / 12;
  
  return avgMonthlySpending.map((avg, month) => ({
    month,
    monthName: new Date(2025, month, 1).toLocaleString('default', { month: 'long' }),
    avgSpending: avg,
    seasonality: overallAvg > 0 ? (avg / overallAvg) : 1,
    pattern: avg > overallAvg * 1.2 ? 'high' : avg < overallAvg * 0.8 ? 'low' : 'normal'
  }));
}

// 4. BEHAVIORAL PATTERN FUNCTIONS
function analyzeVendorPatterns(transactions) {
  const vendorGroups = groupBy(transactions, 'vendor');
  
  return vendorGroups.map(vendor => {
    const amounts = vendor.transactions.map(t => Math.abs(t.amount));
    const totalSpent = amounts.reduce((sum, amt) => sum + amt, 0);
    const averageAmount = totalSpent / amounts.length;
    
    return {
      name: vendor.vendor,
      frequency: amounts.length,
      totalSpent,
      averageAmount,
      lastVisit: Math.max(...vendor.transactions.map(t => new Date(t.date)))
    };
  }).sort((a, b) => b.frequency - a.frequency);
}

// 5. UTILITY FUNCTIONS
function groupBy(array, key) {
  const groups = [];
  const groupMap = new Map();
  
  array.forEach(item => {
    const groupKey = item[key];
    if (!groupMap.has(groupKey)) {
      const newGroup = { [key]: groupKey, transactions: [] };
      groupMap.set(groupKey, newGroup);
      groups.push(newGroup);
    }
    groupMap.get(groupKey).transactions.push(item);
  });
  
  return groups;
}

function calculateCategoryAverage(transactions, category) {
  const categoryTransactions = transactions.filter(t => t.category === category);
  const total = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  return categoryTransactions.length > 0 ? total / categoryTransactions.length : 0;
}

function groupTransactionsByCategory(transactions) {
  return groupBy(transactions, 'category').reduce((acc, group) => {
    acc[group.category] = group.transactions;
    return acc;
  }, {});
}

function getMonthlyTrends(categoryTransactions) {
  const monthlyMap = new Map();
  
  categoryTransactions.forEach(transaction => {
    const monthKey = transaction.date.substring(0, 7); // YYYY-MM
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { totalSpent: 0, count: 0 });
    }
    monthlyMap.get(monthKey).totalSpent += Math.abs(transaction.amount);
    monthlyMap.get(monthKey).count += 1;
  });
  
  return Array.from(monthlyMap.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function getCurrentMonthSpending(categoryTransactions) {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const currentMonthTransactions = categoryTransactions.filter(t => 
    t.date.substring(0, 7) === currentMonth
  );
  
  return currentMonthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

function calculateMonthlyIncome(transactions) {
  const currentMonth = new Date().toISOString().substring(0, 7);
  return transactions
    .filter(t => t.date.substring(0, 7) === currentMonth && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
}

function calculateMonthlyExpenses(transactions) {
  const currentMonth = new Date().toISOString().substring(0, 7);
  return transactions
    .filter(t => t.date.substring(0, 7) === currentMonth && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

// 6. TIME-SPECIFIC TREND INSIGHTS
function generateTimeTrendInsights(transactions) {
  const insights = [];
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Today's spending analysis
  const todayTransactions = transactions.filter(t => t.date === today);
  const todaySpending = todayTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  if (todaySpending > 0) {
    const avgDailySpending = transactions
      .filter(t => t.amount < 0 && new Date(t.date) >= thisMonth)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) / 30;
    
    if (todaySpending > avgDailySpending * 2) {
      insights.push({
        id: 'today_high_spending',
        category: 'Today\'s Spending Alert',
        insight: `🚨 You spent $${todaySpending.toFixed(2)} today, which is ${(todaySpending / avgDailySpending).toFixed(1)}x your average daily spending of $${avgDailySpending.toFixed(2)}.`,
        impact: 'high',
        type: 'daily_alert',
        actionable: true,
        recommendation: 'Review today\'s expenses and identify any non-essential purchases that could be reduced.',
        priority: 'high'
      });
    }
  }
  
  // This week's category analysis
  const thisWeekTransactions = transactions.filter(t => new Date(t.date) >= thisWeek);
  const categorySpending = {};
  
  thisWeekTransactions.forEach(t => {
    if (t.amount < 0) {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + Math.abs(t.amount);
    }
  });
  
  // Find categories with unusually high spending this week
  Object.entries(categorySpending).forEach(([category, amount]) => {
    const monthlyAvg = transactions
      .filter(t => t.category === category && t.amount < 0 && new Date(t.date) >= thisMonth)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) / 4; // Weekly average from monthly data
    
    if (amount > monthlyAvg * 1.5) {
      insights.push({
        id: `week_${category}_high`,
        category: 'Weekly Spending Pattern',
        insight: `📊 You spent $${amount.toFixed(2)} on ${category} this week, which is ${(amount / monthlyAvg).toFixed(1)}x your typical weekly average.`,
        impact: 'medium',
        type: 'weekly_pattern',
        actionable: true,
        recommendation: `Monitor your ${category} spending. Consider setting a weekly budget limit for this category.`,
        priority: 'medium'
      });
    }
  });
  
  // Recent unusual transactions (last 3 days)
  const recentTransactions = transactions
    .filter(t => new Date(t.date) >= new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000))
    .filter(t => t.amount < 0);
  
  if (recentTransactions.length > 0) {
    const avgTransactionAmount = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) / transactions.filter(t => t.amount < 0).length;
    
    const unusualTransactions = recentTransactions.filter(t => Math.abs(t.amount) > avgTransactionAmount * 3);
    
    unusualTransactions.forEach((transaction, index) => {
      insights.push({
        id: `recent_unusual_${index}`,
        category: 'Recent Unusual Spending',
        insight: `⚠️ Recent unusual expense: $${Math.abs(transaction.amount).toFixed(2)} at ${transaction.vendor} on ${transaction.date}. This is ${(Math.abs(transaction.amount) / avgTransactionAmount).toFixed(1)}x your average transaction amount.`,
        impact: 'medium',
        type: 'recent_alert',
        actionable: true,
        recommendation: 'Verify this transaction was necessary and consider if similar expenses can be avoided in the future.',
        priority: 'medium'
      });
    });
  }
  
  return insights;
}

module.exports = router;
