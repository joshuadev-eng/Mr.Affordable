
import React from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../data';

const CategoriesPage: React.FC = () => {
  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Shop Categories</h1>
          <p className="text-gray-600">Explore our wide range of affordable collections</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {CATEGORIES.map(category => (
            <Link 
              key={category} 
              to={`/category/${encodeURIComponent(category)}`}
              className="relative group h-64 rounded-2xl overflow-hidden shadow-lg"
            >
              <img 
                src={`https://picsum.photos/seed/${category.replace(' ', '')}/600/400`} 
                alt={category} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent flex items-end p-8">
                <div>
                  <h2 className="text-white text-2xl font-bold mb-2">{category}</h2>
                  <p className="text-blue-200 text-sm mb-4">Explore Collection <i className="fa-solid fa-chevron-right ml-1"></i></p>
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
