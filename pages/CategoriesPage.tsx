import React from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../data';
import { Category } from '../types';

const categoryImages: Record<string, string> = {
  [Category.Phones]: 'https://images.unsplash.com/photo-1556656793-062ff9878258?q=80&w=800&auto=format&fit=crop',
  [Category.Electronics]: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=800&auto=format&fit=crop',
  [Category.HomeAppliances]: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop',
  [Category.Furniture]: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=800&auto=format&fit=crop',
  [Category.KitchenItems]: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800&auto=format&fit=crop',
  [Category.Accessories]: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop'
};

const CategoriesPage: React.FC = () => {
  return (
    <div className="py-8 md:py-16 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-16">
          <h1 className="text-3xl md:text-5xl font-black mb-3 md:mb-4 text-gray-900">Shop Categories</h1>
          <p className="text-gray-500 text-sm md:text-lg max-w-xl mx-auto">Explore our wide range of affordable collections curated for your home and lifestyle.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {CATEGORIES.map(category => (
            <Link 
              key={category} 
              to={`/category/${encodeURIComponent(category)}`}
              className="relative group h-48 md:h-72 rounded-xl md:rounded-3xl overflow-hidden shadow-lg border border-gray-100"
            >
              <img 
                src={categoryImages[category] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop'} 
                alt={category} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-teal-900/90 via-teal-900/40 to-transparent flex items-end p-6 md:p-8">
                <div>
                  <h2 className="text-white text-xl md:text-3xl font-black mb-1 md:mb-2">{category}</h2>
                  <p className="text-teal-200 text-xs md:text-sm font-bold flex items-center group-hover:translate-x-2 transition-transform">
                    Explore Collection <i className="fa-solid fa-chevron-right ml-2"></i>
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;