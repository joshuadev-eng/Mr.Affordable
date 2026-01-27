import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PRODUCTS } from '../data';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

interface ProductListingProps {
  addToCart: (product: Product) => void;
  toggleWishlist: (product: Product) => void;
  wishlist: Product[];
  onQuickView: (product: Product) => void;
}

const ProductListing: React.FC<ProductListingProps> = ({ addToCart, toggleWishlist, wishlist, onQuickView }) => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const filteredProducts = PRODUCTS.filter(p => p.category === categoryName);

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <nav className="flex mb-8 text-sm text-gray-500">
          <Link to="/" className="hover:text-teal-600 transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/categories" className="hover:text-teal-600 transition-colors">Categories</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{categoryName}</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {categoryName} <span className="text-gray-400 text-lg font-normal">({filteredProducts.length} items)</span>
          </h1>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-600 outline-none">
              <option>Newest First</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                addToCart={addToCart} 
                toggleWishlist={toggleWishlist}
                onQuickView={onQuickView}
                isWishlisted={wishlist.some(item => item.id === product.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <i className="fa-solid fa-box-open text-6xl text-gray-200 mb-4"></i>
            <p className="text-gray-500 text-lg">No products found in this category yet.</p>
            <Link to="/categories" className="mt-4 inline-block text-teal-600 font-medium hover:underline">
              Back to all categories
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductListing;