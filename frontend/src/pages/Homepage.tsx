import React from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  BanknotesIcon, 
  ShieldCheckIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const Homepage: React.FC = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 }
  };

  const fadeInUpTransition = { duration: 0.6 };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const features = [
    {
      icon: ChartBarIcon,
      title: "Smart Spending Insights",
      description: "AI-powered analysis of your spending patterns with personalized recommendations to save money effortlessly.",
      color: "text-blue-400"
    },

    {
      icon: BanknotesIcon,
      title: "Subscription Detective",
      description: "Automatically detect forgotten subscriptions and recurring charges, helping you cancel unwanted services.",
      color: "text-purple-400"
    },
    {
      icon: ShieldCheckIcon,
      title: "Secure & Private",
      description: "Bank-level security with end-to-end encryption. Your financial data stays private and protected.",
      color: "text-yellow-400"
    }
  ];

  const targetAudience = [
    {
      icon: AcademicCapIcon,
      title: "Students & Young Adults",
      description: "Build healthy financial habits early with personalized guidance and easy-to-understand insights.",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      icon: BriefcaseIcon,
      title: "Freelancers & Gig Workers",
      description: "Navigate variable income with smart budgeting tools designed for irregular earnings.",
      gradient: "from-green-500 to-blue-500"
    },
    {
      icon: CurrencyDollarIcon,
      title: "Smart Savers",
      description: "Discover hidden savings opportunities and optimize your spending for maximum financial growth.",
      gradient: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <div className="min-h-screen text-white overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute top-40 -left-40 w-60 h-60 bg-purple-500 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute bottom-40 right-20 w-40 h-40 bg-green-500 rounded-full opacity-10 blur-3xl"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 px-6 py-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">Smart Financial Coach</span>
            </motion.div>
            
            <motion.div 
              className="hidden md:flex space-x-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
              <a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a>
            </motion.div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto">
              <motion.h1 
                className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent"
                initial={fadeInUp.initial}
                animate={fadeInUp.animate}
                transition={fadeInUpTransition}
              >
                Take Control of Your Financial Future
              </motion.h1>
              
              <motion.p 
                className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed"
                initial={fadeInUp.initial}
                animate={fadeInUp.animate}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                AI-powered insights that transform your spending data into actionable financial wisdom. 
                Perfect for students, freelancers, and anyone ready to build smarter money habits.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                initial={fadeInUp.initial}
                animate={fadeInUp.animate}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 glow-effect hover:scale-105">
                  Start Your Financial Journey
                </button>
                <button className="px-8 py-4 border border-gray-600 rounded-xl font-semibold text-lg hover:border-gray-500 hover:bg-gray-800/50 transition-all duration-300">
                  Watch Demo
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Target Audience Section */}
      <section className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Built for Your Lifestyle</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Whether you're starting your financial journey or managing variable income, 
              our AI adapts to your unique situation.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {targetAudience.map((audience, index) => (
              <motion.div
                key={index}
                className="glass-effect rounded-2xl p-8 hover:scale-105 transition-all duration-300"
                initial={fadeInUp.initial}
                animate={fadeInUp.animate}
                transition={fadeInUpTransition}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${audience.gradient} rounded-2xl flex items-center justify-center mb-6`}>
                  <audience.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{audience.title}</h3>
                <p className="text-gray-300 leading-relaxed">{audience.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Intelligent Financial Insights</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Our AI analyzes your spending patterns to provide personalized recommendations 
              that actually make a difference in your financial health.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="glass-effect rounded-2xl p-6 hover:scale-105 transition-all duration-300 group"
                initial={fadeInUp.initial}
                animate={fadeInUp.animate}
                transition={fadeInUpTransition}
              >
                <feature.icon className={`w-12 h-12 ${feature.color} mb-4 group-hover:scale-110 transition-transform duration-300`} />
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            className="glass-effect rounded-3xl p-12"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Finances?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of users who have already improved their financial habits with AI-powered insights.
            </p>
            <motion.button 
              className="px-12 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 glow-effect"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started Today
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">Smart Financial Coach</span>
          </div>
          <p className="text-gray-400">
            © 2024 Smart Financial Coach. Empowering financial futures with AI.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
