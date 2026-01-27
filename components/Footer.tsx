
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold text-blue-400 mb-4">Mr.Affordable</h3>
            <p className="text-gray-400 mb-4">
              Providing quality products at prices you can afford. Your one-stop shop for electronics, furniture, and more.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-blue-400 transition-colors"><i className="fa-brands fa-facebook-f"></i></a>
              <a href="#" className="hover:text-blue-400 transition-colors"><i className="fa-brands fa-instagram"></i></a>
              <a href="#" className="hover:text-blue-400 transition-colors"><i className="fa-brands fa-twitter"></i></a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/categories" className="hover:text-white transition-colors">Shop by Category</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">View Cart</Link></li>
              <li><Link to="/checkout" className="hover:text-white transition-colors">Checkout</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start space-x-3">
                <i className="fa-solid fa-location-dot mt-1 text-blue-400"></i>
                <span>Monrovia, Liberia</span>
              </li>
              <li className="flex items-center space-x-3">
                <i className="fa-solid fa-phone text-blue-400"></i>
                <span>+231 888 791 661</span>
              </li>
              <li className="flex items-center space-x-3">
                <i className="fa-solid fa-envelope text-blue-400"></i>
                <span>mrbrownliberia@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Mr.Affordable. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
