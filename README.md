# Smart Financial Coach

A comprehensive financial management application that helps users track expenses, manage budgets, detect subscriptions, and gain AI-powered insights into their spending patterns.

## 🚀 Features

### 💰 Financial Management
- **Transaction Tracking**: Log income and expenses with detailed categorization
- **Budget Management**: Set monthly budgets for different spending categories
- **Real-time Analytics**: Visualize spending patterns and trends
- **Financial Overview**: Get a complete picture of your financial health

### 🤖 AI-Powered Insights
- **Subscription Detection**: Automatically identify recurring payments and subscriptions
- **Smart Categorization**: AI-powered transaction categorization
- **Spending Analysis**: Get personalized recommendations for saving money
- **Pattern Recognition**: Identify unusual spending patterns and potential savings

### 📊 Dashboard & Analytics
- **Interactive Charts**: Visual representation of spending data
- **Monthly Trends**: Track income vs. expenses over time
- **Category Breakdown**: See where your money goes
- **Savings Opportunities**: Identify areas to cut costs

### 🔔 Smart Notifications
- **Budget Alerts**: Get notified when approaching budget limits
- **Subscription Reminders**: Never miss a renewal or trial expiration
- **Spending Insights**: Weekly/monthly spending summaries

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Heroicons** for beautiful icons
- **Responsive Design** for mobile and desktop

### Backend
- **Node.js** with Express.js
- **SQLite** database for data persistence
- **RESTful API** architecture
- **JWT Authentication** (ready for implementation)

### AI & Analytics
- **Pattern Recognition** algorithms
- **Machine Learning** for subscription detection
- **Predictive Analytics** for spending trends

## 📁 Project Structure

```
financial-coach-app/
├── backend/                 # Backend API server
│   ├── database/           # Database files and initialization
│   ├── routes/             # API route handlers
│   ├── server.js           # Main server file
│   └── package.json        # Backend dependencies
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service layer
│   │   ├── pages/          # Page components
│   │   └── ui/             # Reusable UI components
│   └── package.json        # Frontend dependencies
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** (v8 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd financial-coach-app
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies (if using concurrently)
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set up the database**
   ```bash
   cd ../backend
   node database/init.js
   ```

### Running the Application

#### Option 1: Run Both Services Together (Recommended)
```bash
# From the root directory
npm run dev
```


The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key
```

### Database Configuration
The application uses SQLite by default. Database files are stored in `backend/database/`.

## 📱 Usage Guide

### Getting Started
1. **Launch the application** and navigate to the dashboard
2. **Add your first transaction** by clicking "Add Transaction"
3. **Set up budgets** for your spending categories
4. **Review AI insights** in the analytics section

### Managing Subscriptions
1. **View detected subscriptions** in the Subscriptions tab
2. **Confirm or reject** AI-detected subscriptions
3. **Track renewal dates** and manage active subscriptions
4. **Identify unused services** for potential savings

### Budget Management
1. **Set monthly budgets** for different categories
2. **Monitor spending** against budget limits
3. **Get alerts** when approaching budget thresholds
4. **Adjust budgets** based on spending patterns

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Run All Tests
```bash
# From root directory
npm run test:all
```

## 📦 Build & Deployment

### Frontend Build
```bash
cd frontend
npm run build
```

### Production Deployment
```bash
# Set environment to production
NODE_ENV=production npm start
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

## 🐛 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Kill process using port 3000
npx kill-port 3000
# Kill process using port 5000
npx kill-port 5000
```

**Database connection issues**
```bash
# Reset database
cd backend
rm database/financial_coach.db
node database/init.js
```

**Frontend build errors**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing frontend framework
- **Express.js** for the robust backend framework
- **Tailwind CSS** for the utility-first CSS framework
- **Heroicons** for the beautiful icon set

## 📞 Support

If you encounter any issues or have questions:
- **Create an issue** on GitHub
- **Check the documentation** in the `/docs` folder
- **Review the troubleshooting** section above

---

**Happy Financial Planning! 💰✨**
