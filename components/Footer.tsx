
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const logoUrl = "https://res.cloudinary.com/dathnxkxz/image/upload/v1769510510/WhatsApp_Image_2026-01-26_at_12.47.57_PM_ln6zz6.jpg";

  return (
    <footer className="bg-slate-900 text-white pt-10 md:pt-16 pb-6 md:pb-8">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-12">
          {/* Brand Info */}
          <div className="space-y-4 md:space-y-6 flex flex-col items-center sm:items-start text-center sm:text-left">
            <Link to="/" className="inline-block">
              <img 
                src={logoUrl} 
                alt="Mr. Affordable" 
                className="h-10 md:h-16 w-auto object-contain rounded-lg shadow-sm" 
              />
            </Link>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-xs mx-auto sm:mx-0">
              Quality products, unbeatable prices. We bring the best electronics, home appliances, and furniture to your doorstep in Liberia.
            </p>
            <div className="flex space-x-3 md:space-x-4">
              <a 
                href="https://www.facebook.com/share/1DMcv92wZf/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-teal-600 hover:text-white transition-all"
              >
                <i className="fa-brands fa-facebook-f text-sm"></i>
              </a>
              <a 
                href="https://www.instagram.com/mr.affordable?utm_source=qr&igsh=MTdlYzk3aHVhdG85cA==" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-pink-600 hover:text-white transition-all"
              >
                <i className="fa-brands fa-instagram text-sm"></i>
              </a>
              <a href="https://wa.me/231888791661" target="_blank" rel="noopener noreferrer" className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-green-600 hover:text-white transition-all">
                <i className="fa-brands fa-whatsapp text-sm"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center sm:text-left">
            <h3 className="text-sm md:text-lg font-bold mb-4 md:mb-6 text-white uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2 md:space-y-4">
              <li>
                <Link to="/" className="text-slate-400 hover:text-teal-400 transition-colors text-xs md:text-sm font-medium">Home</Link>
              </li>
              <li>
                <Link to="/categories" className="text-slate-400 hover:text-teal-400 transition-colors text-xs md:text-sm font-medium">Shop by Category</Link>
              </li>
              <li>
                <Link to="/cart" className="text-slate-400 hover:text-teal-400 transition-colors text-xs md:text-sm font-medium">View Cart</Link>
              </li>
              <li>
                <Link to="/checkout" className="text-slate-400 hover:text-teal-400 transition-colors text-xs md:text-sm font-medium">Checkout</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="text-center sm:text-left">
            <h3 className="text-sm md:text-lg font-bold mb-4 md:mb-6 text-white uppercase tracking-wider">Contact Us</h3>
            <ul className="space-y-3 md:space-y-4">
              <li className="flex items-start justify-center sm:justify-start space-x-3">
                <i className="fa-solid fa-location-dot mt-1 text-teal-500"></i>
                <span className="text-slate-400 text-xs md:text-sm">Monrovia, Liberia</span>
              </li>
              <li className="flex items-center justify-center sm:justify-start space-x-3">
                <i className="fa-solid fa-phone text-teal-500"></i>
                <a href="tel:+231888791661" className="text-slate-400 hover:text-teal-400 text-xs md:text-sm">+231 888 791 661</a>
              </li>
              <li className="flex items-center justify-center sm:justify-start space-x-3">
                <i className="fa-solid fa-envelope text-teal-500"></i>
                <a href="mailto:mraffordableshop@gmail.com" className="text-slate-400 hover:text-teal-400 text-xs md:text-sm truncate max-w-[200px] md:max-w-none">mraffordableshop@gmail.com</a>
              </li>
              <li className="pt-2">
                <div className="bg-teal-600/10 border border-teal-600/20 p-3 md:p-4 rounded-xl inline-block sm:block">
                  <p className="text-teal-400 text-[10px] md:text-xs font-bold mb-1 uppercase">Open Hours:</p>
                  <p className="text-slate-300 text-[10px] md:text-xs">Mon - Sat: 8:00 AM - 7:00 PM</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 md:pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-[10px] md:text-xs text-center md:text-left">
            &copy; {new Date().getFullYear()} Mr.Affordable Liberia. All Rights Reserved.
          </p>
          <div className="flex items-center space-x-4 md:space-x-6">
             <i className="fa-brands fa-cc-visa text-slate-700 text-xl md:text-2xl"></i>
             <i className="fa-brands fa-cc-mastercard text-slate-700 text-xl md:text-2xl"></i>
             <i className="fa-brands fa-whatsapp text-slate-700 text-xl md:text-2xl" title="Order via WhatsApp"></i>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
