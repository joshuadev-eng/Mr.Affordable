
import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

interface WishlistPageProps {
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  addToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
}

const WishlistPage: React.FC<WishlistPageProps> = ({ wishlist, toggleWishlist, addToCart, onQuickView }) => {
  if (wishlist.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="mb-8 inline-block relative">
          <div className="w-32 h-32 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <i className="fa-solid fa-heart text-6xl text-red-100"></i>
          </div>
          <div className="absolute top-0 right-0 -mr-2 -mt-2">
             <i className="fa-solid fa-question-circle text-2xl text-red-400"></i>
          </div>
        </div>
        <h2 className="text-3xl font-black mb-4">Your wishlist is empty</h2>
        <p className="text-gray-500 mb-10 max-w-sm mx-auto">
          Save items that you love here. You haven't added any products to your wishlist yet.
        </p>
        <Link 
          to="/categories" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 rounded-2xl font-black shadow-xl transition-all hover:scale-105 inline-block"
        >
          Explore Products
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <nav className="flex mb-4 text-sm text-gray-500">
              <Link to="/" className="hover:text-blue-600">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">My Wishlist</span>
            </nav>
            <h1 className="text-4xl font-black text-gray-900">
              My Wishlist <span className="text-gray-400 text-2xl font-normal">({wishlist.length})</span>
            </h1>
          </div>
          <p className="text-gray-500 max-w-md">
            All your favorite items in one place. Move them to your cart when you're ready to buy.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {wishlist.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              addToCart={addToCart} 
              toggleWishlist={toggleWishlist}
              onQuickView={onQuickView}
              isWishlisted={true}
            />
          ))}
        </div>

        <div className="mt-20 bg-blue-600 rounded-[2.5rem] p-12 text-center text-white relative overflow-hidden">
           <div className="relative z-10">
              <h2 className="text-3xl font-black mb-4">Ready to checkout?</h2>
              <p className="text-blue-100 mb-8">All these amazing products are just a few clicks away from being yours.</p>
              <Link 
                to="/cart"
                className="bg-white text-blue-600 font-black px-10 py-4 rounded-xl shadow-lg hover:bg-blue-50 transition-all inline-block"
              >
                Go to Shopping Cart
              </Link>
           </div>
           <i className="fa-solid fa-heart absolute -bottom-10 -right-10 text-[15rem] text-blue-500/20"></i>
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
