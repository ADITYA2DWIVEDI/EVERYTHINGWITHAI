import React from 'react';
import { motion } from 'framer-motion';

const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
  </svg>
);

const PlanCard: React.FC<{ title: string; price: string; description: string; features: string[]; isFeatured?: boolean }> = ({ title, price, description, features, isFeatured }) => (
  <motion.div 
    className={`border rounded-2xl p-6 flex flex-col ${isFeatured ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
    whileHover={{ y: -5, scale: 1.02, boxShadow: "0px 10px 20px rgba(0,0,0,0.05)" }}
    transition={{ type: 'spring', stiffness: 300 }}
  >
    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
    <p className="text-gray-500 mt-2">{description}</p>
    <div className="my-6">
      <span className="text-4xl font-extrabold text-gray-900">{price}</span>
      {price !== 'Contact Us' && <span className="text-gray-500">/ month</span>}
    </div>
    <ul className="space-y-3 mb-8 flex-1">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start">
          <CheckIcon />
          <span className="ml-2 text-gray-700">{feature}</span>
        </li>
      ))}
    </ul>
    <button className={`w-full py-3 rounded-lg font-semibold transition-colors ${isFeatured ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>
      {isFeatured ? 'Get Started' : 'Choose Plan'}
    </button>
  </motion.div>
);

const Plans: React.FC = () => {
  const plans = [
    {
      title: 'Free',
      price: '$0',
      description: 'For individuals starting out.',
      features: [
        'Limited AI Assistant queries',
        'Standard language lessons',
        'Community support'
      ]
    },
    {
      title: 'Pro',
      price: '$10',
      description: 'For professionals and power users.',
      features: [
        'Unlimited AI Assistant queries',
        'Advanced AI models',
        'Image analysis capabilities',
        'Priority email support'
      ],
      isFeatured: true
    },
    {
      title: 'Enterprise',
      price: 'Contact Us',
      description: 'For teams and organizations.',
      features: [
        'All Pro features',
        'Team management',
        'Dedicated support & onboarding',
        'API access'
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-transparent">
      <div className="p-4 sm:p-6 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Plans & Subscription</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">Choose the plan that's right for you and unlock the full potential of EverythingWithAI.</p>
      </div>
      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => <PlanCard key={plan.title} {...plan} />)}
        </div>
      </div>
    </div>
  );
};

export default Plans;