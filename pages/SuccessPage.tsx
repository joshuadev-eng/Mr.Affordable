import React from 'react';
import { Link } from 'react-router-dom';

const SuccessPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-20 bg-white">
      <div className="container mx-auto px-4 max-w-lg text-center">
        <div className="mb-8 relative inline-block">
          <div className="w-32 h-32 bg-teal-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <i className="fa-solid fa-check text-6xl text-teal-600"></i>
          </div>
          <div className="absolute top-0 right-0 -mr-2 -mt-2">
            <span className="flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-6 w-6 bg-teal-500"></span>
            </span>
          </div>
        </div>
        
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Order Received!</h1>
        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
          Thank you for shopping with <span className="text-teal-600 font-bold">Mr.Affordable</span>. 
          Your order has been sent to our sales team via WhatsApp and Email.
        </p>

        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-10 text-left">
          <h3 className="font-bold text-gray-800 mb-3">What happens next?</h3>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start">
              <i className="fa-solid fa-circle-1 text-teal-500 mr-3 mt-1 text-sm"></i>
              <span>Our team will confirm your order on WhatsApp shortly.</span>
            </li>
            <li className="flex items-start">
              <i className="fa-solid fa-circle-2 text-teal-500 mr-3 mt-1 text-sm"></i>
              <span>We will verify your delivery address and location.</span>
            </li>
            <li className="flex items-start">
              <i className="fa-solid fa-circle-3 text-teal-500 mr-3 mt-1 text-sm"></i>
              <span>Your items will be dispatched for delivery!</span>
            </li>
          </ul>
        </div>

        <Link 
          to="/" 
          className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-bold px-10 py-4 rounded-full shadow-lg transition-all hover:scale-105"
        >
          Return to Shop
        </Link>
      </div>
    </div>
  );
};

export default SuccessPage;