
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const SuccessPage: React.FC = () => {
  const location = useLocation();
  const [redirecting, setRedirecting] = useState(false);
  const whatsappUrl = location.state?.whatsappUrl;

  useEffect(() => {
    if (whatsappUrl) {
      setRedirecting(true);
      // Short delay to allow the user to see the success message before redirection
      const timer = setTimeout(() => {
        // Use window.location.assign to trigger the protocol handler in the SAME tab/window
        window.location.assign(whatsappUrl);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [whatsappUrl]);

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
        
        {redirecting ? (
          <div className="bg-teal-50 border border-teal-100 rounded-2xl p-6 mb-10 text-center animate-fadeInUp">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <i className="fa-brands fa-whatsapp text-2xl text-green-500"></i>
              <p className="font-black text-teal-800 uppercase tracking-widest text-xs">Connecting to WhatsApp...</p>
            </div>
            <p className="text-sm text-teal-600">Please click "Send" in WhatsApp to finalize your order.</p>
          </div>
        ) : (
          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Thank you for shopping with <span className="text-teal-600 font-bold">Mr.Affordable</span>. 
            Your order has been saved and shared with our team.
          </p>
        )}

        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-10 text-left">
          <h3 className="font-bold text-gray-800 mb-3">What happens next?</h3>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start">
              <i className="fa-solid fa-circle-1 text-teal-500 mr-3 mt-1 text-sm"></i>
              <span>Your order details have been sent to our shop email.</span>
            </li>
            <li className="flex items-start">
              <i className="fa-solid fa-circle-2 text-teal-500 mr-3 mt-1 text-sm"></i>
              <span>A WhatsApp chat is opening for your final confirmation.</span>
            </li>
            <li className="flex items-start">
              <i className="fa-solid fa-circle-3 text-teal-500 mr-3 mt-1 text-sm"></i>
              <span>Our team will verify your location and dispatch your items!</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
           {whatsappUrl && (
             <a 
               href={whatsappUrl}
               className="bg-green-600 hover:bg-green-700 text-white font-black px-10 py-4 rounded-full shadow-lg transition-all flex items-center justify-center space-x-3"
             >
               <i className="fa-brands fa-whatsapp text-xl"></i>
               <span>Open WhatsApp Manually</span>
             </a>
           )}
           <Link 
            to="/" 
            className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-bold px-10 py-4 rounded-full shadow-lg transition-all hover:scale-105"
          >
            Return to Shop
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
