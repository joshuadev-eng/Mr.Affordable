
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '../types';

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  currentUser: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ cartCount, wishlistCount, currentUser, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const logoUrl = "https://res.cloudinary.com/dathnxkxz/image/upload/v1769510510/WhatsApp_Image_2026-01-26_at_12.47.57_PM_ln6zz6.jpg";
  const categories = ['Phones', 'Electronics', 'Home Appliances', 'Furniture', 'Kitchen Items', 'Accessories'];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-2 md:py-3 flex items-center justify-between">
        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="md:hidden text-gray-700 p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <i className="fa-solid fa-bars text-2xl"></i>
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img 
            src={logoUrl} 
            alt="Mr. Affordable Logo" 
            className="h-10 md:h-14 w-auto object-contain transition-transform hover:scale-105"
          />
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-gray-700 hover:text-teal-600 font-semibold transition-colors text-sm lg:text-base">Home</Link>
          <div className="group relative">
            <Link to="/categories" className="text-gray-700 hover:text-teal-600 font-semibold flex items-center transition-colors text-sm lg:text-base">
              Categories <i className="fa-solid fa-chevron-down ml-1 text-xs"></i>
            </Link>
            <div className="absolute top-full left-0 mt-2 w-48 bg-white shadow-xl rounded-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              {categories.map(cat => (
                <Link 
                  key={cat}
                  to={`/category/${encodeURIComponent(cat)}`}
                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
          <Link to="/wishlist" className="text-gray-700 hover:text-teal-600 font-semibold transition-colors text-sm lg:text-base">Wishlist</Link>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* User Account */}
          <div className="relative">
            {currentUser ? (
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 p-1 md:p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-teal-100 overflow-hidden border-2 border-teal-500">
                  {currentUser.profilePic ? (
                    <img src={currentUser.profilePic} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-teal-700 font-bold">
                      {currentUser.name.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="hidden lg:block text-sm font-bold text-gray-700">{currentUser.name.split(' ')[0]}</span>
              </button>
            ) : (
              <Link to="/auth" className="p-2.5 text-gray-600 hover:text-teal-600 transition-colors">
                <i className="fa-solid fa-circle-user text-2xl"></i>
              </Link>
            )}

            {isUserMenuOpen && currentUser && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-56 bg-white shadow-2xl rounded-2xl border border-gray-100 z-20 overflow-hidden animate-fadeInUp">
                  <div className="p-4 bg-teal-50 border-b border-teal-100">
                    <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-1">Account</p>
                    <p className="font-bold text-gray-900 truncate">{currentUser.name}</p>
                    <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                  </div>
                  <div className="p-2">
                    <Link to="/dashboard" onClick={() => setIsUserMenuOpen(false)} className="flex items-center space-x-3 px-3 py-3 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-600 rounded-xl transition-colors">
                      <i className="fa-solid fa-gauge-high w-5"></i>
                      <span>Dashboard</span>
                    </Link>
                    <Link to="/wishlist" onClick={() => setIsUserMenuOpen(false)} className="flex items-center space-x-3 px-3 py-3 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-600 rounded-xl transition-colors">
                      <i className="fa-solid fa-heart w-5 text-red-500"></i>
                      <span>Wishlist</span>
                    </Link>
                    <button 
                      onClick={() => {
                        onLogout();
                        setIsUserMenuOpen(false);
                        navigate('/');
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <i className="fa-solid fa-right-from-bracket w-5"></i>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <Link to="/cart" className="relative p-2.5 bg-teal-50 text-teal-600 rounded-full hover:bg-teal-600 hover:text-white transition-all">
            <i className="fa-solid fa-cart-shopping text-lg"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setIsMenuOpen(false)}></div>
      )}
      <div className={`fixed inset-y-0 left-0 w-80 bg-white z-[70] transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 shadow-2xl`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-10">
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center">
              <img src={logoUrl} alt="Mr. Affordable" className="h-10 w-auto object-contain" />
            </Link>
            <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-400 hover:text-red-500"><i className="fa-solid fa-xmark text-2xl"></i></button>
          </div>
          <div className="space-y-6">
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-4 text-gray-800 font-bold text-lg hover:text-teal-600">
              <i className="fa-solid fa-house w-6 text-teal-600"></i><span>Home</span>
            </Link>
            {currentUser ? (
               <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-4 text-gray-800 font-bold text-lg hover:text-teal-600">
                <i className="fa-solid fa-gauge-high w-6 text-teal-600"></i><span>Dashboard</span>
              </Link>
            ) : (
              <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-4 text-gray-800 font-bold text-lg hover:text-teal-600">
                <i className="fa-solid fa-circle-user w-6 text-teal-600"></i><span>Login / Sign Up</span>
              </Link>
            )}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Shop Categories</p>
              <div className="space-y-4">
                {categories.map(cat => (
                  <Link key={cat} to={`/category/${encodeURIComponent(cat)}`} onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between text-gray-700 hover:text-teal-600 group">
                    <span className="font-medium">{cat}</span><i className="fa-solid fa-chevron-right text-xs text-gray-300"></i>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
