Smart Financial Coach – Design Documentation

Overview: Smart Financial Coach is a personal finance app that helps people manage money more easily. The goal is to track expenses, create budgets, detect subscriptions, and give users useful insights powered by AI. Instead of being complicated, it’s designed to be intuitive, secure, and something people can get value from right away. I designed the app with transparency fully in mind. I wanted to make it super easy for the user to know what they are looking at and what they could make of it. I believe that a lot of the data analytics components did a good job of that on their own. I feel like the AI insights took it to another level and just gave more depth and direction on the users trends and stuff to keep in mind.

Design Choices
User First
Keep things simple and easy to use.
Show immediate value (like subscription detection) without making people dig through menus.
Hide advanced features so they don’t overwhelm new users.

Data-Driven Intelligence
Use AI to spot spending patterns (subscriptions, unusual charges).
Learn from user behavior over time.
Provide suggestions instead of just showing raw numbers.

Privacy & Security
Use a local SQLite database so data stays on the user’s computer.
Use JWTs for authentication.
Only collect what’s necessary.

Technical Stack
Frontend: React + TypeScript
TailwindCSS for styling
Recharts for charts/graphs
Framer Motion for animations

Backend: Node.js + Express.js
SQLite as the database (simple, file-based, no server setup needed)
JSON Web Tokens (JWT) for authentication
Helmet + CORS for security

AI Features (Current & Planned):
Subscription detection (looks for recurring charges).
Categorizing expenses automatically (NLP).
Spending predictions and budget recommendations (future).
Anomaly detection for unusual spending (future).


Future Enhancements
Short-Term
Better automatic categorization of transactions.
Mobile support (React Native or PWA).
Import/export bank data (CSV/OFX).
More detailed reports.
Finish cleaning up the project and optimizing it
Better AI insight training

Medium-Term
Bank API integrations for live transaction syncing.
Credit score tracking.
Investment tracking.
Shared/family budgets.

Long-Term Vision
Conversational AI assistant for financial questions.
Personalized recommendations (e.g., “Cancel this unused subscription”).
Predictive financial health scoring.
Potential cloud migration for multi-user support.

Why These Choices?
SQLite was chosen because it’s private, simple, and offline-friendly.
React with TypeScript keeps the UI modern, safe, and easy to maintain.
Custom hooks for state management instead of Redux (lighter and simpler).
Security-first mindset to protect sensitive financial data.
Monorepo setup so the frontend and backend live together for easier development.

