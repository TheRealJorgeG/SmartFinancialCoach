const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database/init');

const router = express.Router();
const db = getDatabase();

// Get all transactions for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const category = req.query.category;
    const type = req.query.type;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let query = `
      SELECT 
        t.id,
        t.date,
        t.vendor,
        t.description,
        t.amount,
        t.category,
        t.type,
        t.budget_id as budgetId
      FROM transactions t
      WHERE t.user_id = ?
    `;
    
    const queryParams = [userId];

    if (category) {
      query += ' AND t.category = ?';
      queryParams.push(category);
    }

    if (type) {
      query += ' AND t.type = ?';
      queryParams.push(type);
    }

    if (startDate) {
      query += ' AND t.date >= ?';
      queryParams.push(startDate);
    }

    if (endDate) {
      query += ' AND t.date <= ?';
      queryParams.push(endDate);
    }

    query += ' ORDER BY t.date DESC, t.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    db.all(query, queryParams, (err, transactions) => {
      if (err) {
        console.error('Error fetching transactions:', err);
        return res.status(500).json({ error: 'Failed to fetch transactions' });
      }

      res.json(transactions || []);
    });
  } catch (error) {
    console.error('Error in GET /transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transaction by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId || 1;

    db.get(`
      SELECT 
        id,
        date,
        vendor,
        description,
        amount,
        category,
        type,
        budget_id as budgetId
      FROM transactions 
      WHERE id = ? AND user_id = ?
    `, [id, userId], (err, transaction) => {
      if (err) {
        console.error('Error fetching transaction:', err);
        return res.status(500).json({ error: 'Failed to fetch transaction' });
      }

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json(transaction);
    });
  } catch (error) {
    console.error('Error in GET /transactions/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new transaction
router.post('/', [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('vendor').trim().isLength({ min: 1 }).withMessage('Vendor is required'),
  body('amount').isFloat().withMessage('Valid amount is required'),
  body('category').trim().isLength({ min: 1 }).withMessage('Category is required'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('description').optional().trim(),
  body('budgetId').optional().isInt().withMessage('Budget ID must be an integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, vendor, description, amount, category, type, budgetId } = req.body;
    const userId = req.body.userId || 1;

    // Create transaction
    db.run(`
      INSERT INTO transactions (user_id, date, vendor, description, amount, category, type, budget_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, date, vendor, description || '', amount, category, type, budgetId || null], function(err) {
      if (err) {
        console.error('Error creating transaction:', err);
        return res.status(500).json({ error: 'Failed to create transaction' });
      }

      // If this is an expense and has a budget, update the budget spent amount
      if (type === 'expense' && budgetId) {
        db.run(`
          UPDATE budgets 
          SET spent = spent + ?
          WHERE id = ? AND user_id = ?
        `, [Math.abs(amount), budgetId, userId], (updateErr) => {
          if (updateErr) {
            console.error('Error updating budget spent amount:', updateErr);
          }
        });
      }

      const newTransaction = {
        id: this.lastID,
        date,
        vendor,
        description: description || '',
        amount,
        category,
        type,
        budgetId: budgetId || null
      };

      res.status(201).json(newTransaction);
    });
  } catch (error) {
    console.error('Error in POST /transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update transaction
router.put('/:id', [
  body('date').optional().isISO8601().withMessage('Valid date is required'),
  body('vendor').optional().trim().isLength({ min: 1 }).withMessage('Vendor cannot be empty'),
  body('amount').optional().isFloat().withMessage('Valid amount is required'),
  body('category').optional().trim().isLength({ min: 1 }).withMessage('Category cannot be empty'),
  body('type').optional().isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('description').optional().trim(),
  body('budgetId').optional().isInt().withMessage('Budget ID must be an integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.body.userId || 1;
    const updates = req.body;

    // Check if transaction exists and belongs to user
    db.get(`
      SELECT * FROM transactions WHERE id = ? AND user_id = ?
    `, [id, userId], (err, transaction) => {
      if (err) {
        console.error('Error checking transaction:', err);
        return res.status(500).json({ error: 'Failed to update transaction' });
      }

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // If amount or budget changed, we need to update the budget spent amount
      const oldAmount = transaction.amount;
      const oldBudgetId = transaction.budget_id;
      const newAmount = updates.amount !== undefined ? updates.amount : oldAmount;
      const newBudgetId = updates.budgetId !== undefined ? updates.budgetId : oldBudgetId;

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];
      
      if (updates.date !== undefined) {
        updateFields.push('date = ?');
        updateValues.push(updates.date);
      }
      if (updates.vendor !== undefined) {
        updateFields.push('vendor = ?');
        updateValues.push(updates.vendor);
      }
      if (updates.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(updates.description);
      }
      if (updates.amount !== undefined) {
        updateFields.push('amount = ?');
        updateValues.push(updates.amount);
      }
      if (updates.category !== undefined) {
        updateFields.push('category = ?');
        updateValues.push(updates.category);
      }
      if (updates.type !== undefined) {
        updateFields.push('type = ?');
        updateValues.push(updates.type);
      }
      if (updates.budgetId !== undefined) {
        updateFields.push('budget_id = ?');
        updateValues.push(updates.budgetId);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      updateValues.push(id, userId);

      const updateQuery = `
        UPDATE transactions 
        SET ${updateFields.join(', ')}
        WHERE id = ? AND user_id = ?
      `;

      db.run(updateQuery, updateValues, function(err) {
        if (err) {
          console.error('Error updating transaction:', err);
          return res.status(500).json({ error: 'Failed to update transaction' });
        }

        // Update budget spent amounts if needed
        if (transaction.type === 'expense') {
          // Remove old amount from old budget
          if (oldBudgetId) {
            db.run(`
              UPDATE budgets 
              SET spent = spent - ?, updated_at = ?
              WHERE id = ? AND user_id = ?
            `, [Math.abs(oldAmount), new Date().toISOString(), oldBudgetId, userId]);
          }
          
          // Add new amount to new budget
          if (newBudgetId) {
            db.run(`
              UPDATE budgets 
              SET spent = spent + ?, updated_at = ?
              WHERE id = ? AND user_id = ?
            `, [Math.abs(newAmount), new Date().toISOString(), newBudgetId, userId]);
          }
        }

        // Return updated transaction
        db.get(`
          SELECT 
            id,
            date,
            vendor,
            description,
            amount,
            category,
            type,
            budget_id as budgetId
          FROM transactions 
          WHERE id = ?
        `, [id], (err, updatedTransaction) => {
          if (err) {
            console.error('Error fetching updated transaction:', err);
            return res.status(500).json({ error: 'Transaction updated but failed to fetch' });
          }

          res.json(updatedTransaction);
        });
      });
    });
  } catch (error) {
    console.error('Error in PUT /transactions/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId || 1;

    // Check if transaction exists and belongs to user
    db.get(`
      SELECT * FROM transactions WHERE id = ? AND user_id = ?
    `, [id, userId], (err, transaction) => {
      if (err) {
        console.error('Error checking transaction:', err);
        return res.status(500).json({ error: 'Failed to delete transaction' });
      }

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // If this was an expense with a budget, update the budget spent amount
      if (transaction.type === 'expense' && transaction.budget_id) {
        db.run(`
          UPDATE budgets 
          SET spent = spent - ?
          WHERE id = ? AND user_id = ?
        `, [Math.abs(transaction.amount), transaction.budget_id, userId], (updateErr) => {
          if (updateErr) {
            console.error('Error updating budget spent amount:', updateErr);
          }
        });
      }

      // Delete transaction
      db.run(`
        DELETE FROM transactions WHERE id = ? AND user_id = ?
      `, [id, userId], function(err) {
        if (err) {
          console.error('Error deleting transaction:', err);
          return res.status(500).json({ error: 'Failed to delete transaction' });
        }

        res.json({ message: 'Transaction deleted successfully' });
      });
    });
  } catch (error) {
    console.error('Error in DELETE /transactions/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get spending categories summary
router.get('/categories/summary', async (req, res) => {
  try {
    const userId = req.query.userId || 1;
    const startDate = req.query.startDate || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
    const endDate = req.query.endDate || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

    db.all(`
      SELECT 
        category,
        SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as totalSpent,
        COUNT(CASE WHEN type = 'expense' THEN 1 END) as transactionCount,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome
      FROM transactions 
      WHERE user_id = ? AND date BETWEEN ? AND ?
      GROUP BY category
      ORDER BY totalSpent DESC
    `, [userId, startDate, endDate], (err, categories) => {
      if (err) {
        console.error('Error fetching category summary:', err);
        return res.status(500).json({ error: 'Failed to fetch category summary' });
      }

      // Calculate percentages
      const totalSpent = categories.reduce((sum, cat) => sum + cat.totalSpent, 0);
      const categoriesWithPercentages = categories.map(cat => ({
        ...cat,
        percentage: totalSpent > 0 ? Math.round((cat.totalSpent / totalSpent) * 100) : 0
      }));

      res.json(categoriesWithPercentages);
    });
  } catch (error) {
    console.error('Error in GET /transactions/categories/summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get monthly spending trends
router.get('/trends/monthly', async (req, res) => {
  try {
    const userId = req.query.userId || 1;
    const months = parseInt(req.query.months) || 6;

    db.all(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as expenses,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'income' THEN amount ELSE -ABS(amount) END) as netAmount
      FROM transactions 
      WHERE user_id = ? AND date >= date('now', '-${months} months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month DESC
    `, [userId], (err, trends) => {
      if (err) {
        console.error('Error fetching monthly trends:', err);
        return res.status(500).json({ error: 'Failed to fetch monthly trends' });
      }

      res.json(trends || []);
    });
  } catch (error) {
    console.error('Error in GET /transactions/trends/monthly:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
