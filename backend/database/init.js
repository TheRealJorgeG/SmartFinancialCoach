const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'financial_coach.db');
const seedDbPath = path.join(__dirname, 'financial_coach.seed.db');

// If no working DB exists but a seed DB is present, copy the seed so each clone
// gets an independent local database initialized with the same data.
try {
  if (!fs.existsSync(dbPath) && fs.existsSync(seedDbPath)) {
    fs.copyFileSync(seedDbPath, dbPath);
    console.log('Seed database copied to working database.');
  }
} catch (copyError) {
  console.error('Error copying seed database:', copyError);
}

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize database tables
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON');

      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          first_name TEXT,
          last_name TEXT,
          monthly_income REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Budgets table
      db.run(`
        CREATE TABLE IF NOT EXISTS budgets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          category TEXT NOT NULL,
          allocated REAL NOT NULL,
          spent REAL DEFAULT 0,
          color TEXT DEFAULT '#3B82F6',
          is_essential BOOLEAN DEFAULT 0,
          month_year TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(user_id, category, month_year)
        )
      `);

      // Transactions table
      db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          date TEXT NOT NULL,
          vendor TEXT NOT NULL,
          description TEXT,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
          budget_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (budget_id) REFERENCES budgets (id)
        )
      `);



      // Subscriptions table
      db.run(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          amount REAL NOT NULL,
          frequency TEXT CHECK(frequency IN ('monthly', 'yearly')) NOT NULL,
          next_billing TEXT NOT NULL,
          category TEXT NOT NULL,
          status TEXT CHECK(status IN ('active', 'trial', 'forgotten')) DEFAULT 'active',
          logo TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);



      // Budget Spending table (for tracking daily spending)
      db.run(`
        CREATE TABLE IF NOT EXISTS budget_spending (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          budget_id INTEGER NOT NULL,
          amount REAL NOT NULL,
          date TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (budget_id) REFERENCES budgets (id)
        )
      `);

      // Create indexes for better performance
      db.run('CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date)');
      db.run('CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)');
      db.run('CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month_year)');

      db.run('CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id)');

      // Insert default user if none exists
      db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) {
          console.error('Error checking users:', err);
          reject(err);
          return;
        }

        if (row.count === 0) {
          // Insert demo user
          db.run(`
            INSERT INTO users (email, password_hash, first_name, last_name, monthly_income)
            VALUES (?, ?, ?, ?, ?)
          `, ['demo@example.com', 'demo123', 'Demo', 'User', 3500], function(err) {
            if (err) {
              console.error('Error inserting demo user:', err);
              reject(err);
              return;
            }
            
            const userId = this.lastID;
            console.log('Demo user created with ID:', userId);
            
            // Insert sample data for demo user
            insertSampleData(userId, resolve, reject);
          });
        } else {
          console.log('Users already exist, skipping demo data');
          resolve();
        }
      });
    });
  });
}

// Insert sample data for demo user
function insertSampleData(userId, resolve, reject) {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  
  // Insert sample budgets
  const sampleBudgets = [
    ['Rent', 1000, 1000, '#EF4444', 1],
    ['Groceries', 400, 320, '#10B981', 1],
    ['Utilities', 200, 145, '#F59E0B', 1],
    ['Transportation', 150, 125, '#3B82F6', 1],
    ['Entertainment', 200, 180, '#8B5CF6', 0],
    ['Dining Out', 300, 250, '#EC4899', 0],
    ['Shopping', 250, 300, '#F97316', 0]
  ];

  let budgetCount = 0;
  sampleBudgets.forEach(([category, allocated, spent, color, isEssential]) => {
    db.run(`
      INSERT INTO budgets (user_id, category, allocated, spent, color, is_essential, month_year)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, category, allocated, spent, color, isEssential, currentMonth], function(err) {
      if (err) {
        console.error('Error inserting budget:', err);
        return;
      }
      budgetCount++;
      if (budgetCount === sampleBudgets.length) {
        console.log('Sample budgets inserted');
        resolve();
      }
    });
  });
}

// Get database instance
function getDatabase() {
  return db;
}

// Close database connection
function closeDatabase() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
  });
}

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase
};
