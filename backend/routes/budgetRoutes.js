const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database/init');

const router = express.Router();
const db = getDatabase();

// Get all budgets for a user (default to demo user for now)
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId || 1; // Default to demo user
    const monthYear = req.query.monthYear || new Date().toISOString().slice(0, 7);

    db.all(`
      SELECT 
        id,
        category,
        allocated,
        spent,
        color,
        is_essential as isEssential,
        month_year as monthYear,
        created_at as createdAt,
        updated_at as updatedAt
      FROM budgets 
      WHERE user_id = ? AND month_year = ?
      ORDER BY is_essential DESC, category ASC
    `, [userId, monthYear], (err, budgets) => {
      if (err) {
        console.error('Error fetching budgets:', err);
        return res.status(500).json({ error: 'Failed to fetch budgets' });
      }

      res.json(budgets || []);
    });
  } catch (error) {
    console.error('Error in GET /budgets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get budget by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId || 1;

    db.get(`
      SELECT 
        id,
        category,
        allocated,
        spent,
        color,
        is_essential as isEssential,
        month_year as monthYear,
        created_at as createdAt,
        updated_at as updatedAt
      FROM budgets 
      WHERE id = ? AND user_id = ?
    `, [id, userId], (err, budget) => {
      if (err) {
        console.error('Error fetching budget:', err);
        return res.status(500).json({ error: 'Failed to fetch budget' });
      }

      if (!budget) {
        return res.status(404).json({ error: 'Budget not found' });
      }

      res.json(budget);
    });
  } catch (error) {
    console.error('Error in GET /budgets/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new budget
router.post('/', [
  body('category').trim().isLength({ min: 1 }).withMessage('Category is required'),
  body('allocated').isFloat({ min: 0 }).withMessage('Allocated amount must be a positive number'),
  body('is_essential').isBoolean().withMessage('is_essential must be a boolean'),
  body('month_year').optional().isISO8601().withMessage('Invalid month format (YYYY-MM)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, allocated, is_essential, month_year } = req.body;
    const userId = req.body.userId || 1;
    const month = month_year || new Date().toISOString().slice(0, 7);
    const color = req.body.color || `#${Math.floor(Math.random()*16777215).toString(16)}`;

    // Check if budget already exists for this category and month
    db.get(`
      SELECT id FROM budgets 
      WHERE user_id = ? AND category = ? AND month_year = ?
    `, [userId, category, month], (err, existing) => {
      if (err) {
        console.error('Error checking existing budget:', err);
        return res.status(500).json({ error: 'Failed to create budget' });
      }

      if (existing) {
        return res.status(409).json({ error: 'Budget already exists for this category and month' });
      }

      // Create new budget
      db.run(`
        INSERT INTO budgets (user_id, category, allocated, spent, color, is_essential, month_year)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [userId, category, allocated, 0, color, is_essential ? 1 : 0, month], function(err) {
        if (err) {
          console.error('Error creating budget:', err);
          return res.status(500).json({ error: 'Failed to create budget' });
        }

        const newBudget = {
          id: this.lastID,
          category,
          allocated,
          spent: 0,
          color,
          is_essential,
          month_year: month,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        res.status(201).json(newBudget);
      });
    });
  } catch (error) {
    console.error('Error in POST /budgets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update budget
router.put('/:id', [
  body('category').optional().trim().isLength({ min: 1 }).withMessage('Category cannot be empty'),
  body('allocated').optional().isFloat({ min: 0 }).withMessage('Allocated amount must be a positive number'),
  body('is_essential').optional().isBoolean().withMessage('is_essential must be a boolean'),
  body('color').optional().isHexColor().withMessage('Invalid color format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.body.userId || 1;
    const updates = req.body;

    // Check if budget exists and belongs to user
    db.get(`
      SELECT * FROM budgets WHERE id = ? AND user_id = ?
    `, [id, userId], (err, budget) => {
      if (err) {
        console.error('Error checking budget:', err);
        return res.status(500).json({ error: 'Failed to update budget' });
      }

      if (!budget) {
        return res.status(404).json({ error: 'Budget not found' });
      }

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];
      
      if (updates.category !== undefined) {
        updateFields.push('category = ?');
        updateValues.push(updates.category);
      }
      if (updates.allocated !== undefined) {
        updateFields.push('allocated = ?');
        updateValues.push(updates.allocated);
      }
      if (updates.is_essential !== undefined) {
        updateFields.push('is_essential = ?');
        updateValues.push(updates.is_essential ? 1 : 0);
      }
      if (updates.color !== undefined) {
        updateFields.push('color = ?');
        updateValues.push(updates.color);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      updateFields.push('updated_at = ?');
      updateValues.push(new Date().toISOString());
      updateValues.push(id, userId);

      const updateQuery = `
        UPDATE budgets 
        SET ${updateFields.join(', ')}
        WHERE id = ? AND user_id = ?
      `;

      db.run(updateQuery, updateValues, function(err) {
        if (err) {
          console.error('Error updating budget:', err);
          return res.status(500).json({ error: 'Failed to update budget' });
        }

        // Return updated budget
        db.get(`
          SELECT 
            id,
            category,
            allocated,
            spent,
            color,
            is_essential as isEssential,
            month_year as monthYear,
            created_at as createdAt,
            updated_at as updatedAt
          FROM budgets 
          WHERE id = ?
        `, [id], (err, updatedBudget) => {
          if (err) {
            console.error('Error fetching updated budget:', err);
            return res.status(500).json({ error: 'Budget updated but failed to fetch' });
          }

          res.json(updatedBudget);
        });
      });
    });
  } catch (error) {
    console.error('Error in PUT /budgets/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete budget
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId || 1;

    // Check if budget exists and belongs to user
    db.get(`
      SELECT id FROM budgets WHERE id = ? AND user_id = ?
    `, [id, userId], (err, budget) => {
      if (err) {
        console.error('Error checking budget:', err);
        return res.status(500).json({ error: 'Failed to delete budget' });
      }

      if (!budget) {
        return res.status(404).json({ error: 'Budget not found' });
      }

      // Delete budget
      db.run(`
        DELETE FROM budgets WHERE id = ? AND user_id = ?
      `, [id, userId], function(err) {
        if (err) {
          console.error('Error deleting budget:', err);
          return res.status(500).json({ error: 'Failed to delete budget' });
        }

        res.json({ message: 'Budget deleted successfully' });
      });
    });
  } catch (error) {
    console.error('Error in DELETE /budgets/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get budget summary for a user
router.get('/summary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const monthYear = req.query.monthYear || new Date().toISOString().slice(0, 7);

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
    `, [userId, monthYear], (err, summary) => {
      if (err) {
        console.error('Error fetching budget summary:', err);
        return res.status(500).json({ error: 'Failed to fetch budget summary' });
      }

      res.json(summary);
    });
  } catch (error) {
    console.error('Error in GET /budgets/summary/:userId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

