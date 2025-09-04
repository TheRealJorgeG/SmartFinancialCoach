const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database/init');

const router = express.Router();
const db = getDatabase();

// Get all subscriptions for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId || 1;
    const status = req.query.status;

    let query = `
      SELECT 
        id,
        name,
        amount,
        frequency,
        next_billing as nextBilling,
        category,
        status,
        logo,
        created_at as createdAt,
        updated_at as updatedAt
      FROM subscriptions 
      WHERE user_id = ?
    `;
    
    const queryParams = [userId];

    if (status) {
      query += ' AND status = ?';
      queryParams.push(status);
    }

    query += ' ORDER BY next_billing ASC';

    db.all(query, queryParams, (err, subscriptions) => {
      if (err) {
        console.error('Error fetching subscriptions:', err);
        return res.status(500).json({ error: 'Failed to fetch subscriptions' });
      }

      res.json(subscriptions || []);
    });
  } catch (error) {
    console.error('Error in GET /subscriptions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get subscription by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId || 1;

    db.get(`
      SELECT 
        id,
        name,
        amount,
        frequency,
        next_billing as nextBilling,
        category,
        status,
        logo,
        created_at as createdAt,
        updated_at as updatedAt
      FROM subscriptions 
      WHERE id = ? AND user_id = ?
    `, [id, userId], (err, subscription) => {
      if (err) {
        console.error('Error fetching subscription:', err);
        return res.status(500).json({ error: 'Failed to fetch subscription' });
      }

      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      res.json(subscription);
    });
  } catch (error) {
    console.error('Error in GET /subscriptions/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new subscription
router.post('/', [
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a non-negative number'),
  body('frequency').isIn(['monthly', 'yearly']).withMessage('Frequency must be monthly or yearly'),
  body('nextBilling').isISO8601().withMessage('Valid next billing date is required'),
  body('category').trim().isLength({ min: 1 }).withMessage('Category is required'),
  body('status').optional().isIn(['active', 'trial', 'forgotten']).withMessage('Invalid status'),
  body('logo').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, amount, frequency, nextBilling, category, status = 'active', logo } = req.body;
    const userId = req.body.userId || 1;

    // Create subscription
    db.run(`
      INSERT INTO subscriptions (user_id, name, amount, frequency, next_billing, category, status, logo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, name, amount, frequency, nextBilling, category, status, logo || null], function(err) {
      if (err) {
        console.error('Error creating subscription:', err);
        return res.status(500).json({ error: 'Failed to create subscription' });
      }

      const newSubscription = {
        id: this.lastID,
        name,
        amount,
        frequency,
        nextBilling,
        category,
        status,
        logo: logo || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      res.status(201).json(newSubscription);
    });
  } catch (error) {
    console.error('Error in POST /subscriptions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update subscription
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Name cannot be empty'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a non-negative number'),
  body('frequency').optional().isIn(['monthly', 'yearly']).withMessage('Frequency must be monthly or yearly'),
  body('nextBilling').optional().isISO8601().withMessage('Valid next billing date is required'),
  body('category').optional().trim().isLength({ min: 1 }).withMessage('Category cannot be empty'),
  body('status').optional().isIn(['active', 'trial', 'forgotten']).withMessage('Invalid status'),
  body('logo').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.body.userId || 1;
    const updates = req.body;

    // Check if subscription exists and belongs to user
    db.get(`
      SELECT * FROM subscriptions WHERE id = ? AND user_id = ?
    `, [id, userId], (err, subscription) => {
      if (err) {
        console.error('Error checking subscription:', err);
        return res.status(500).json({ error: 'Failed to update subscription' });
      }

      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];
      
      if (updates.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(updates.name);
      }
      if (updates.amount !== undefined) {
        updateFields.push('amount = ?');
        updateValues.push(updates.amount);
      }
      if (updates.frequency !== undefined) {
        updateFields.push('frequency = ?');
        updateValues.push(updates.frequency);
      }
      if (updates.nextBilling !== undefined) {
        updateFields.push('next_billing = ?');
        updateValues.push(updates.nextBilling);
      }
      if (updates.category !== undefined) {
        updateFields.push('category = ?');
        updateValues.push(updates.category);
      }
      if (updates.status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(updates.status);
      }
      if (updates.logo !== undefined) {
        updateFields.push('logo = ?');
        updateValues.push(updates.logo);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      updateFields.push('updated_at = ?');
      updateValues.push(new Date().toISOString());
      updateValues.push(id, userId);

      const updateQuery = `
        UPDATE subscriptions 
        SET ${updateFields.join(', ')}
        WHERE id = ? AND user_id = ?
      `;

      db.run(updateQuery, updateValues, function(err) {
        if (err) {
          console.error('Error updating subscription:', err);
          return res.status(500).json({ error: 'Failed to update subscription' });
        }

        // Return updated subscription
        db.get(`
          SELECT 
            id,
            name,
            amount,
            frequency,
            next_billing as nextBilling,
            category,
            status,
            logo,
            created_at as createdAt,
            updated_at as updatedAt
          FROM subscriptions 
          WHERE id = ?
        `, [id], (err, updatedSubscription) => {
          if (err) {
            console.error('Error fetching updated subscription:', err);
            return res.status(500).json({ error: 'Subscription updated but failed to fetch' });
          }

          res.json(updatedSubscription);
        });
      });
    });
  } catch (error) {
    console.error('Error in PUT /subscriptions/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete subscription
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId || 1;

    // Check if subscription exists and belongs to user
    db.get(`
      SELECT id FROM subscriptions WHERE id = ? AND user_id = ?
    `, [id, userId], (err, subscription) => {
      if (err) {
        console.error('Error checking subscription:', err);
        return res.status(500).json({ error: 'Failed to delete subscription' });
      }

      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      // Delete subscription
      db.run(`
        DELETE FROM subscriptions WHERE id = ? AND user_id = ?
      `, [id, userId], function(err) {
        if (err) {
          console.error('Error deleting subscription:', err);
          return res.status(500).json({ error: 'Failed to delete subscription' });
        }

        res.json({ message: 'Subscription deleted successfully' });
      });
    });
  } catch (error) {
    console.error('Error in DELETE /subscriptions/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update subscription status
router.patch('/:id/status', [
  body('status').isIn(['active', 'trial', 'forgotten']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;
    const userId = req.body.userId || 1;

    // Check if subscription exists and belongs to user
    db.get(`
      SELECT id FROM subscriptions WHERE id = ? AND user_id = ?
    `, [id, userId], (err, subscription) => {
      if (err) {
        console.error('Error checking subscription:', err);
        return res.status(500).json({ error: 'Failed to update subscription status' });
      }

      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      // Update status
      db.run(`
        UPDATE subscriptions 
        SET status = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `, [status, new Date().toISOString(), id, userId], function(err) {
        if (err) {
          console.error('Error updating subscription status:', err);
          return res.status(500).json({ error: 'Failed to update subscription status' });
        }

        res.json({ message: 'Subscription status updated successfully', status });
      });
    });
  } catch (error) {
    console.error('Error in PATCH /subscriptions/:id/status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get subscription summary for a user
router.get('/summary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    db.get(`
      SELECT 
        COUNT(*) as totalSubscriptions,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeSubscriptions,
        SUM(CASE WHEN status = 'trial' THEN 1 ELSE 0 END) as trialSubscriptions,
        SUM(CASE WHEN status = 'forgotten' THEN 1 ELSE 0 END) as forgottenSubscriptions,
        SUM(CASE WHEN status = 'active' THEN 
          CASE WHEN frequency = 'monthly' THEN amount ELSE amount / 12 END
        ELSE 0 END) as monthlyCost,
        SUM(CASE WHEN status = 'active' THEN 
          CASE WHEN frequency = 'yearly' THEN amount ELSE amount * 12 END
        ELSE 0 END) as yearlyCost
      FROM subscriptions 
      WHERE user_id = ?
    `, [userId], (err, summary) => {
      if (err) {
        console.error('Error fetching subscription summary:', err);
        return res.status(500).json({ error: 'Failed to fetch subscription summary' });
      }

      res.json(summary);
    });
  } catch (error) {
    console.error('Error in GET /subscriptions/summary/:userId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get upcoming renewals
router.get('/renewals/upcoming', async (req, res) => {
  try {
    const userId = req.query.userId || 1;
    const days = parseInt(req.query.days) || 30;

    db.all(`
      SELECT 
        id,
        name,
        amount,
        frequency,
        next_billing as nextBilling,
        category,
        status,
        logo
      FROM subscriptions 
      WHERE user_id = ? 
        AND status = 'active'
        AND next_billing BETWEEN date('now') AND date('now', '+${days} days')
      ORDER BY next_billing ASC
    `, [userId], (err, renewals) => {
      if (err) {
        console.error('Error fetching upcoming renewals:', err);
        return res.status(500).json({ error: 'Failed to fetch upcoming renewals' });
      }

      res.json(renewals || []);
    });
  } catch (error) {
    console.error('Error in GET /subscriptions/renewals/upcoming:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get subscriptions by category
router.get('/categories/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const userId = req.query.userId || 1;

    db.all(`
      SELECT 
        id,
        name,
        amount,
        frequency,
        next_billing as nextBilling,
        category,
        status,
        logo,
        created_at as createdAt,
        updated_at as updatedAt
      FROM subscriptions 
      WHERE user_id = ? AND category = ?
      ORDER BY next_billing ASC
    `, [userId, category], (err, subscriptions) => {
      if (err) {
        console.error('Error fetching subscriptions by category:', err);
        return res.status(500).json({ error: 'Failed to fetch subscriptions by category' });
      }

      res.json(subscriptions || []);
    });
  } catch (error) {
    console.error('Error in GET /subscriptions/categories/:category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark transaction as not a subscription
router.post('/mark-not-subscription', [
  body('vendor').trim().isLength({ min: 1 }).withMessage('Vendor is required'),
  body('userId').optional().isInt().withMessage('User ID must be an integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { vendor } = req.body;
    const userId = req.body.userId || 1;

    // For now, we'll just return success since we're not storing this information
    // In a real implementation, you might want to store this in a separate table
    // to avoid re-detecting the same vendor as a potential subscription
    
    res.json({ 
      message: 'Vendor marked as not a subscription',
      vendor,
      userId 
    });
  } catch (error) {
    console.error('Error in POST /subscriptions/mark-not-subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

