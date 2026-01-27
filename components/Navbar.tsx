
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
}

const Navbar: React.FC<NavbarProps> = ({ cartCount, wishlistCount }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const categories = ['Phones', 'Electronics', 'Home Appliances', 'Furniture', 'Kitchen Items', 'Accessories'];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="md:hidden text-gray-700 p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <i className="fa-solid fa-bars text-2xl"></i>
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl md:text-3xl font-extrabold text-blue-600">Mr.<span className="text-gray-900">Affordable</span></span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-gray-700 hover:text-blue-600 font-semibold transition-colors">Home</Link>
          <div className="group relative">
            <Link to="/categories" className="text-gray-700 hover:text-blue-600 font-semibold flex items-center transition-colors">
              Categories <i className="fa-solid fa-chevron-down ml-1 text-xs"></i>
            </Link>
            <div className="absolute top-full left-0 mt-2 w-48 bg-white shadow-xl rounded-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              {categories.map(cat => (
                <Link 
                  key={cat}
                  to={`/category/${encodeURIComponent(cat)}`}
                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
          <Link to="/wishlist" className="text-gray-700 hover:text-blue-600 font-semibold transition-colors">Wishlist</Link>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3 md:space-x-4">
          <Link to="/wishlist" className="relative p-2.5 bg-gray-50 text-gray-600 rounded-full hover:bg-red-50 hover:text-red-500 transition-all">
            <i className="fa-solid fa-heart text-lg"></i>
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link to="/cart" className="relative p-2.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all">
            <i className="fa-solid fa-cart-shopping text-lg"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[60] transition-opacity"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Drawer */}
      <div className={`fixed inset-y-0 left-0 w-80 bg-white z-[70] transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out shadow-2xl`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-10">
            <span className="text-2xl font-bold text-blue-600">Mr.Affordable</span>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <i className="fa-solid fa-xmark text-2xl"></i>
            </button>
          </div>

          <div className="space-y-6">
            <Link 
              to="/" 
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center space-x-4 text-gray-800 font-bold text-lg hover:text-blue-600"
            >
              <i className="fa-solid fa-house w-6 text-blue-600"></i>
              <span>Home</span>
            </Link>
            <Link 
              to="/wishlist" 
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center space-x-4 text-gray-800 font-bold text-lg hover:text-blue-600"
            >
              <i className="fa-solid fa-heart w-6 text-red-500"></i>
              <span>Wishlist</span>
            </Link>
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Shop Categories</p>
              <div className="space-y-4">
                {categories.map(cat => (
                  <Link 
                    key={cat}
                    to={`/category/${encodeURIComponent(cat)}`}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between text-gray-700 hover:text-blue-600 group"
                  >
                    <span className="font-medium">{cat}</span>
                    <i className="fa-solid fa-chevron-right text-xs text-gray-300 group-hover:translate-x-1 transition-transform"></i>
                  </Link>
                ))}
              </div>
            </div>
            <Link 
              to="/cart" 
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center space-x-4 text-gray-800 font-bold text-lg hover:text-blue-600 pt-4 border-t border-gray-100"
            >
              <i className="fa-solid fa-cart-shopping w-6 text-blue-600"></i>
              <span>Your Cart</span>
            </Link>
          </div>

          <div className="absolute bottom-8 left-6 right-6">
            <div className="bg-blue-50 p-4 rounded-xl text-center">
              <p className="text-xs text-blue-800 font-semibold mb-2">Need Help?</p>
              <a href="tel:+231888791661" className="text-blue-600 font-bold">+231 888 791 661</a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
