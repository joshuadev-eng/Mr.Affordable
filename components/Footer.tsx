
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const logoUrl = "https://res.cloudinary.com/dathnxkxz/image/upload/v1769510510/WhatsApp_Image_2026-01-26_at_12.47.57_PM_ln6zz6.jpg";

  return (
    <footer className="bg-slate-900 text-white pt-8 md:pt-16 pb-4 md:pb-8">
      <div className="container mx-auto px-5 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 mb-8">
          
          {/* Section 1: Brand Info - Full width on mobile (2 columns), 1 column on desktop */}
          <div className="col-span-2 lg:col-span-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-3 md:space-y-5">
            <Link to="/" className="inline-block">
              <img 
                src={logoUrl} 
                alt="Mr. Affordable" 
                className="h-10 md:h-14 w-auto object-contain rounded-lg shadow-sm" 
              />
            </Link>
            <p className="text-slate-400 text-[11px] md:text-sm leading-relaxed max-w-sm">
              Quality products, unbeatable prices. We bring the best electronics, home appliances, and furniture to your doorstep in Liberia.
            </p>
            <div className="flex space-x-3">
              <a 
                href="https://www.facebook.com/share/1DMcv92wZf/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-teal-600 hover:text-white transition-all"
              >
                <i className="fa-brands fa-facebook-f text-xs md:text-sm"></i>
              </a>
              <a 
                href="https://www.instagram.com/mr.affordable?utm_source=qr&igsh=MTdlYzk3aHVhdG85cA==" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-pink-600 hover:text-white transition-all"
              >
                <i className="fa-brands fa-instagram text-xs md:text-sm"></i>
              </a>
              <a href="https://wa.me/231888791661" target="_blank" rel="noopener noreferrer" className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-green-600 hover:text-white transition-all">
                <i className="fa-brands fa-whatsapp text-xs md:text-sm"></i>
              </a>
            </div>
          </div>

          {/* Section 2: Quick Links - 1 column on mobile */}
          <div className="col-span-1 flex flex-col items-start lg:items-start pl-2 md:pl-0">
            <h3 className="text-[11px] md:text-sm font-black mb-4 text-teal-500 uppercase tracking-widest">Links</h3>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link to="/" className="text-slate-400 hover:text-teal-400 transition-colors text-[10px] md:text-sm font-bold">Home</Link>
              </li>
              <li>
                <Link to="/categories" className="text-slate-400 hover:text-teal-400 transition-colors text-[10px] md:text-sm font-bold">Shop</Link>
              </li>
              <li>
                <Link to="/cart" className="text-slate-400 hover:text-teal-400 transition-colors text-[10px] md:text-sm font-bold">My Cart</Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-slate-400 hover:text-teal-400 transition-colors text-[10px] md:text-sm font-bold">Account</Link>
              </li>
            </ul>
          </div>

          {/* Section 3: Contact - 1 column on mobile */}
          <div className="col-span-1 flex flex-col items-start">
            <h3 className="text-[11px] md:text-sm font-black mb-4 text-teal-500 uppercase tracking-widest">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <i className="fa-solid fa-location-dot mt-0.5 text-slate-500 text-[10px]"></i>
                <span className="text-slate-400 text-[10px] md:text-sm">Monrovia, Liberia</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="fa-solid fa-phone text-slate-500 text-[10px]"></i>
                <a href="tel:+231888791661" className="text-slate-400 hover:text-teal-400 text-[10px] md:text-sm">+231 888</a>
              </li>
              <li className="pt-1">
                <div className="bg-teal-600/5 border border-teal-600/10 p-2 rounded-lg">
                  <p className="text-teal-500 text-[8px] md:text-[10px] font-black uppercase mb-0.5">Open Now</p>
                  <p className="text-slate-400 text-[8px] md:text-[10px]">8AM - 7PM</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-slate-600 text-[9px] md:text-xs text-center md:text-left font-medium">
            &copy; {new Date().getFullYear()} Mr.Affordable. All Rights Reserved.
          </p>
          <div className="flex items-center space-x-4 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
             <i className="fa-brands fa-cc-visa text-lg md:text-xl"></i>
             <i className="fa-brands fa-cc-mastercard text-lg md:text-xl"></i>
             <i className="fa-brands fa-whatsapp text-lg md:text-xl"></i>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
