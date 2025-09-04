# Smart Financial Coach

A comprehensive AI-powered financial management application that helps users track expenses, manage budgets, detect subscriptions, and gain intelligent insights into their spending patterns.

## Video Link: https://youtu.be/jVfKOJgp_8U 

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** 
- **Git**

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/TheRealJorgeG/SmartFinancialCoach.git
   cd smart-financial-coach
   ```

2. **Install all dependencies**:
   ```bash
   npm run install:all
   ```
   This command installs dependencies for the root, backend, and frontend simultaneously.

3. **Start the application**:
   ```bash
   npm run dev
   ```
   This starts both the backend server (port 5000) and frontend development server (port 3000) concurrently.

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000


## 🚀 Features

### Core Financial Management
- **💰 Budget Management**: Create, update, and track monthly budgets with real-time spending analysis
- **📊 Transaction Tracking**: Log income and expenses with automatic category classification
- **🔍 Subscription Detection**: AI-powered detection of recurring subscriptions with confirmation/rejection functionality
- **📈 Spending Insights**: Advanced analytics with personalized recommendations and trends
- **💡 Financial Overview**: Comprehensive dashboard with income, expenses, and savings tracking

### AI-Powered Features
- **Smart Spending Analysis**: AI analyzes spending patterns to provide personalized recommendations
- **Subscription Detective**: Automatically identifies forgotten subscriptions and recurring charges
- **Budget Optimization**: Intelligent suggestions for budget allocation and savings opportunities
- **Trend Analysis**: Monthly spending trends and financial health insights

### User Experience
- **Modern UI/UX**: Built with React, TypeScript, and Tailwind CSS for a responsive design
- **Real-time Updates**: Live data synchronization across all components
- **Interactive Charts**: Beautiful data visualizations using Recharts
- **Dark/Light Mode**: Adaptive theming for better user experience

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Recharts** for data visualization
- **Heroicons** for iconography
- **Custom Hooks** for state management

### Backend
- **Node.js** with Express.js
- **SQLite3** database with optimized schema
- **JWT** authentication with bcrypt
- **Express Validator** for input validation
- **Helmet & CORS** for security
- **Morgan** for logging

### Development Tools
- **Concurrently** for running multiple services
- **Nodemon** for development
- **PostCSS & Autoprefixer** for CSS processing
- **ESLint** and TypeScript configuration

## 📁 Project Structure

```
smart-financial-coach/
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── BudgetManager.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── FinancialOverview.tsx
│   │   │   ├── SpendingInsights.tsx
│   │   │   ├── SubscriptionDetector.tsx
│   │   │   ├── TransactionManager.tsx
│   │   │   └── ui/          # Base UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API service layer
│   │   └── pages/           # Page components
│   ├── public/
│   └── package.json
├── backend/                 # Express.js API server
│   ├── routes/             # API route handlers
│   │   ├── budgetRoutes.js
│   │   ├── transactionRoutes.js
│   │   ├── subscriptionRoutes.js
│   │   ├── analyticsRoutes.js
│   │   └── userRoutes.js
│   ├── database/           # Database setup and seed data
│   │   ├── init.js
│   │   ├── financial_coach.seed.db
│   │   └── financial_coach.db (generated)
│   ├── server.js
│   └── package.json
├── package.json            # Root package with scripts
├── .gitignore
└── README.md
```

### Database Setup

The application uses SQLite with an automatic seeding system:
- On first run, a working database is created from the seed file
- Each clone gets an independent database with demo data
- The seed database contains sample transactions, budgets, and a demo user

## 📖 Usage Guide

### Dashboard Navigation
- **Overview**: Financial summary with income, expenses, and savings
- **Transactions**: Add, edit, and categorize income/expenses
- **Spending Insights**: AI-powered analysis and recommendations
- **Budget Manager**: Create and track monthly budgets
- **Subscriptions**: Manage active subscriptions and detect new ones

### Managing Budgets
1. Navigate to "Budget Manager"
2. Click "Add New Budget"
3. Enter category and allocated amount
4. Track spending progress in real-time

### Subscription Detection
1. Go to "Subscriptions" tab
2. Review AI-detected potential subscriptions
3. Click "Confirm" to add to your subscription list
4. Click "Reject" to mark as not a subscription

### Transaction Management
1. Access "Transactions" section
2. Add income/expense entries
3. Categorize transactions for better insights
4. View transaction history and patterns

## 🔧 Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run install:all` - Install dependencies for all projects
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend client

### Backend
- `npm start` - Start production server
- `npm run dev` - Start with nodemon for development

### Frontend
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## 🗄 Database Schema

### Users Table
- User authentication and profile information
- Monthly income tracking
- Account timestamps

### Budgets Table
- Monthly budget allocations by category
- Spending tracking and color coding
- Essential vs. discretionary categorization

### Transactions Table
- Income and expense entries
- Vendor and category information
- Date-based organization

### Subscriptions Table
- Active, trial, and forgotten subscriptions
- Billing frequency and amounts
- Next billing date tracking

### Budget Spending Table
- Daily spending entries linked to budgets
- Detailed transaction descriptions

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Helmet security headers
- Input validation on all endpoints
- SQL injection prevention

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `PUT /api/users/change-password/:id` - Change password

### Budget Management
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create new budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Subscriptions
- `GET /api/subscriptions` - Get all subscriptions
- `POST /api/subscriptions` - Create subscription
- `POST /api/subscriptions/mark-not-subscription` - Mark vendor as not a subscription
- `PATCH /api/subscriptions/:id/status` - Update subscription status

### Analytics
- `GET /api/analytics/overview/:userId` - Financial overview
- `GET /api/analytics/insights/:userId` - AI spending insights
- `GET /api/analytics/trends/:userId` - Financial trends

## 🛠 Development

### Environment Setup
- Frontend runs on port 3000
- Backend runs on port 5000
- Database file: `backend/database/financial_coach.db`
- Seed database: `backend/database/financial_coach.seed.db`

### Testing
- Frontend: React Testing Library
- Backend: Jest (configured)
- Run tests with `npm test` in respective directories

## 🐛 Troubleshooting

### Common Issues
1. **Port conflicts**: Change ports in package.json scripts
2. **Database issues**: Delete `financial_coach.db` to regenerate from seed
3. **Module conflicts**: Run `npm run install:all` again
4. **CORS errors**: Check frontend proxy configuration

### Development Tips
- Use browser dev tools for frontend debugging
- Check backend console for API errors
- Database file is regenerated from seed on first run
- Hot reload is enabled for both frontend and backend

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with modern React and Node.js ecosystem
- UI inspired by contemporary fintech applications
- AI insights powered by transaction pattern analysis
- Icons provided by Heroicons
- Charts powered by Recharts

## 📞 Support

For support, feature requests, or bug reports:
1. Check the troubleshooting section
2. Review existing GitHub issues
3. Create a new issue with detailed information
4. Include steps to reproduce for bugs

---

**Happy Financial Planning! 💰📊**
