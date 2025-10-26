import React, { useState } from 'react';

const FaqItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 py-4">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left">
        <h4 className="font-semibold text-gray-800">{question}</h4>
        <svg className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      {isOpen && <p className="mt-2 text-gray-600 prose prose-sm max-w-none">{answer}</p>}
    </div>
  );
};

const Help: React.FC = () => {
  const faqs = [
    {
      question: 'How does the AI Assistant work?',
      answer: 'Our AI Assistant uses advanced language models from Google to provide conversational search results. It grounds its answers in real-time information from the web and provides sources for its claims. Conversations are now saved to your device for easy access.'
    },
    {
      question: 'Is the Live Chat secure?',
      answer: 'The Live Chat feature now uses a dedicated WebSocket server to enable real-time communication between users across different devices. This allows for features like live user lists and typing indicators. For production environments, this connection should be secured with SSL/TLS (WSS).'
    },
     {
      question: 'What are the new creative tools?',
      answer: 'We have added two new features: the **Image Studio** for generating and editing AI images, and the **Voice Lab** for creating speech from text using different AI voices. These tools leverage powerful generative AI models to bring your ideas to life.'
    },
    {
      question: 'Can I use this app offline?',
      answer: 'Yes! This is a Progressive Web App (PWA). Once you visit the site, key assets are cached, allowing you to access the interface and previously loaded content even without an internet connection. However, AI features require an active connection to our servers and Google\'s APIs.'
    }
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-100">
      <div className="p-4 sm:p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Help & Support</h2>
        <p className="text-gray-600">Find answers to your questions or get in touch with our support team.</p>
      </div>
      <div className="flex-1 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* FAQ Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Frequently Asked Questions</h3>
          <div>
            {faqs.map((faq, index) => <FaqItem key={index} {...faq} />)}
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
           <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Support</h3>
           <form className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-gray-700">Your Email</label>
                <input type="email" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500" placeholder="you@example.com" />
             </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject</label>
                <input type="text" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500" placeholder="How can we help?" />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Message</label>
                <textarea rows={4} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500" placeholder="Describe your issue..."></textarea>
             </div>
             <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                Send Message
             </button>
           </form>
        </div>
      </div>
    </div>
  );
};

export default Help;
