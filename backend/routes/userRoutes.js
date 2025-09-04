const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database/init');

const router = express.Router();
const db = getDatabase();

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Get user profile
router.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;

    db.get(`
      SELECT 
        id,
        email,
        first_name as firstName,
        last_name as lastName,
        monthly_income as monthlyIncome,
        created_at as createdAt,
        updated_at as updatedAt
      FROM users 
      WHERE id = ?
    `, [id], (err, user) => {
      if (err) {
        console.error('Error fetching user profile:', err);
        return res.status(500).json({ error: 'Failed to fetch user profile' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    });
  } catch (error) {
    console.error('Error in GET /users/profile/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile/:id', [
  body('firstName').optional().trim().isLength({ min: 1 }).withMessage('First name cannot be empty'),
  body('lastName').optional().trim().isLength({ min: 1 }).withMessage('Last name cannot be empty'),
  body('monthlyIncome').optional().isFloat({ min: 0 }).withMessage('Monthly income must be a non-negative number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if user exists
    db.get(`
      SELECT id FROM users WHERE id = ?
    `, [id], (err, user) => {
      if (err) {
        console.error('Error checking user:', err);
        return res.status(500).json({ error: 'Failed to update user profile' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];
      
      if (updates.firstName !== undefined) {
        updateFields.push('first_name = ?');
        updateValues.push(updates.firstName);
      }
      if (updates.lastName !== undefined) {
        updateFields.push('last_name = ?');
        updateValues.push(updates.lastName);
      }
      if (updates.monthlyIncome !== undefined) {
        updateFields.push('monthly_income = ?');
        updateValues.push(updates.monthlyIncome);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      updateFields.push('updated_at = ?');
      updateValues.push(new Date().toISOString());
      updateValues.push(id);

      const updateQuery = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      db.run(updateQuery, updateValues, function(err) {
        if (err) {
          console.error('Error updating user profile:', err);
          return res.status(500).json({ error: 'Failed to update user profile' });
        }

        // Return updated user profile
        db.get(`
          SELECT 
            id,
            email,
            first_name as firstName,
            last_name as lastName,
            monthly_income as monthlyIncome,
            created_at as createdAt,
            updated_at as updatedAt
          FROM users 
          WHERE id = ?
        `, [id], (err, updatedUser) => {
          if (err) {
            console.error('Error fetching updated user profile:', err);
            return res.status(500).json({ error: 'Profile updated but failed to fetch' });
          }

          res.json(updatedUser);
        });
      });
    });
  } catch (error) {
    console.error('Error in PUT /users/profile/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User registration
router.post('/register', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('monthlyIncome').optional().isFloat({ min: 0 }).withMessage('Monthly income must be a non-negative number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, monthlyIncome = 0 } = req.body;

    // Check if user already exists
    db.get(`
      SELECT id FROM users WHERE email = ?
    `, [email], (err, existingUser) => {
      if (err) {
        console.error('Error checking existing user:', err);
        return res.status(500).json({ error: 'Failed to register user' });
      }

      if (existingUser) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }

      // Hash password
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          console.error('Error hashing password:', err);
          return res.status(500).json({ error: 'Failed to register user' });
        }

        // Create user
        db.run(`
          INSERT INTO users (email, password_hash, first_name, last_name, monthly_income)
          VALUES (?, ?, ?, ?, ?)
        `, [email, hashedPassword, firstName, lastName, monthlyIncome], function(err) {
          if (err) {
            console.error('Error creating user:', err);
            return res.status(500).json({ error: 'Failed to register user' });
          }

          const userId = this.lastID;

          // Generate JWT token
          const token = jwt.sign(
            { userId, email },
            JWT_SECRET,
            { expiresIn: '24h' }
          );

          const newUser = {
            id: userId,
            email,
            firstName,
            lastName,
            monthlyIncome,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          res.status(201).json({
            message: 'User registered successfully',
            user: newUser,
            token
          });
        });
      });
    });
  } catch (error) {
    console.error('Error in POST /users/register:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    db.get(`
      SELECT 
        id,
        email,
        password_hash,
        first_name as firstName,
        last_name as lastName,
        monthly_income as monthlyIncome
      FROM users 
      WHERE email = ?
    `, [email], (err, user) => {
      if (err) {
        console.error('Error finding user:', err);
        return res.status(500).json({ error: 'Failed to login' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check password
      bcrypt.compare(password, user.password_hash, (err, isMatch) => {
        if (err) {
          console.error('Error comparing passwords:', err);
          return res.status(500).json({ error: 'Failed to login' });
        }

        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        const userResponse = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          monthlyIncome: user.monthlyIncome
        };

        res.json({
          message: 'Login successful',
          user: userResponse,
          token
        });
      });
    });
  } catch (error) {
    console.error('Error in POST /users/login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/change-password/:id', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Check if user exists and verify current password
    db.get(`
      SELECT password_hash FROM users WHERE id = ?
    `, [id], (err, user) => {
      if (err) {
        console.error('Error checking user:', err);
        return res.status(500).json({ error: 'Failed to change password' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      bcrypt.compare(currentPassword, user.password_hash, (err, isMatch) => {
        if (err) {
          console.error('Error comparing passwords:', err);
          return res.status(500).json({ error: 'Failed to change password' });
        }

        if (!isMatch) {
          return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
          if (err) {
            console.error('Error hashing new password:', err);
            return res.status(500).json({ error: 'Failed to change password' });
          }

          // Update password
          db.run(`
            UPDATE users 
            SET password_hash = ?, updated_at = ?
            WHERE id = ?
          `, [hashedPassword, new Date().toISOString(), id], function(err) {
            if (err) {
              console.error('Error updating password:', err);
              return res.status(500).json({ error: 'Failed to change password' });
            }

            res.json({ message: 'Password changed successfully' });
          });
        });
      });
    });
  } catch (error) {
    console.error('Error in PUT /users/change-password/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user statistics
router.get('/stats/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get user's financial statistics
    db.get(`
      SELECT 
        u.monthly_income as monthlyIncome,
        COUNT(DISTINCT b.id) as totalBudgets,

        COUNT(DISTINCT s.id) as totalSubscriptions,
        COUNT(DISTINCT t.id) as totalTransactions
      FROM users u
      LEFT JOIN budgets b ON u.id = b.user_id

      LEFT JOIN subscriptions s ON u.id = s.user_id
      LEFT JOIN transactions t ON u.id = t.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [id], (err, stats) => {
      if (err) {
        console.error('Error fetching user stats:', err);
        return res.status(500).json({ error: 'Failed to fetch user statistics' });
      }

      if (!stats) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(stats);
    });
  } catch (error) {
    console.error('Error in GET /users/stats/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Protected route example
router.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

module.exports = router;
