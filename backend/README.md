# Smart Financial Coach Backend API

A comprehensive backend API for the Smart Financial Coach application, providing financial management, budgeting, goal tracking, and AI-powered insights.

## Features

- **Budget Management**: Create, update, and track monthly budgets with spending analysis
- **Transaction Tracking**: Log income and expenses with category classification

- **Subscription Management**: Monitor active, trial, and forgotten subscriptions
- **AI-Powered Insights**: Get personalized financial recommendations and spending analysis
- **User Authentication**: Secure user registration and login with JWT tokens
- **Comprehensive Analytics**: Financial overview, trends, and savings opportunities

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3
- **Authentication**: JWT + bcrypt
- **Validation**: express-validator
- **Security**: Helmet, CORS

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Start the production server**:
   ```bash
   npm start
   ```

The server will start on port 5000 by default. You can change this by setting the `PORT` environment variable.

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `PUT /api/users/change-password/:id` - Change password

### User Management
- `GET /api/users/profile/:id` - Get user profile
- `PUT /api/users/profile/:id` - Update user profile
- `GET /api/users/stats/:id` - Get user statistics

### Budget Management
- `GET /api/budgets` - Get all budgets for a user
- `GET /api/budgets/:id` - Get specific budget
- `POST /api/budgets` - Create new budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `GET /api/budgets/summary/:userId` - Get budget summary

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get specific transaction
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/categories/summary` - Get spending by category
- `GET /api/transactions/trends/monthly` - Get monthly spending trends



### Subscriptions
- `GET /api/subscriptions` - Get all subscriptions
- `GET /api/subscriptions/:id` - Get specific subscription
- `POST /api/subscriptions` - Create new subscription
- `PUT /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Delete subscription
- `PATCH /api/subscriptions/:id/status` - Update subscription status
- `GET /api/subscriptions/summary/:userId` - Get subscription summary
- `GET /api/subscriptions/renewals/upcoming` - Get upcoming renewals

### Analytics & Insights
- `GET /api/analytics/overview/:userId` - Get comprehensive financial overview
- `GET /api/analytics/insights/:userId` - Get spending insights and AI recommendations
- `GET /api/analytics/budget-analysis/:userId` - Get budget vs actual spending analysis
- `GET /api/analytics/trends/:userId` - Get financial trends over time
- `GET /api/analytics/savings-opportunities/:userId` - Get savings opportunities

## Database Schema

### Users Table
- `id` - Primary key
- `email` - User email (unique)
- `password_hash` - Hashed password
- `first_name` - User's first name
- `last_name` - User's last name
- `monthly_income` - Monthly income amount
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

### Budgets Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `category` - Budget category name
- `allocated` - Budgeted amount
- `spent` - Amount spent so far
- `color` - Color for UI display
- `is_essential` - Whether this is an essential expense
- `month_year` - Month and year (YYYY-MM format)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Transactions Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `date` - Transaction date
- `vendor` - Vendor/merchant name
- `description` - Transaction description
- `amount` - Transaction amount (positive for income, negative for expenses)
- `category` - Transaction category
- `type` - 'income' or 'expense'
- `budget_id` - Optional foreign key to budgets
- `created_at` - Creation timestamp



### Subscriptions Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `name` - Subscription name
- `amount` - Subscription cost
- `frequency` - 'monthly' or 'yearly'
- `next_billing` - Next billing date
- `category` - Subscription category
- `status` - 'active', 'trial', or 'forgotten'
- `logo` - Optional logo URL
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## API Usage Examples

### Creating a Budget
```bash
curl -X POST http://localhost:5000/api/budgets \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Groceries",
    "allocated": 400,
    "isEssential": true,
    "monthYear": "2024-01"
  }'
```

### Adding a Transaction
```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15",
    "vendor": "Whole Foods",
    "description": "Weekly groceries",
    "amount": -85.30,
    "category": "Groceries",
    "type": "expense"
  }'
```

### Getting Financial Insights
```bash
curl http://localhost:5000/api/analytics/insights/1?months=3
```

### User Registration
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "monthlyIncome": 3500
  }'
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:3000
```

## Development

### Running Tests
```bash
npm test
```

### Database Reset
To reset the database and start fresh:
1. Delete the `database/financial_coach.db` file
2. Restart the server - it will automatically recreate the database with sample data

### Sample Data
The backend automatically creates a demo user with sample data when first initialized:
- Email: `demo@example.com`
- Password: `demo123`
- Sample budgets and transactions

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: All inputs are validated using express-validator
- **SQL Injection Protection**: Parameterized queries prevent SQL injection
- **CORS Configuration**: Configurable CORS settings for frontend integration
- **Helmet Security**: Security headers and middleware

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message",
  "message": "Detailed error description (in development)"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
