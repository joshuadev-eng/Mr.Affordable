
import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  addToCart: (product: Product) => void;
  toggleWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  isWishlisted: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, addToCart, toggleWishlist, onQuickView, isWishlisted }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden product-card-hover border border-gray-100 flex flex-col h-full relative group">
      {/* Wishlist Toggle Button */}
      <button 
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist(product);
        }}
        className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${
          isWishlisted ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-400 hover:text-red-500'
        }`}
        title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
      >
        <i className={`${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart`}></i>
      </button>

      <div className="relative overflow-hidden block">
        <Link to={`/product/${product.id}`} className="block">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </Link>
        
        {/* Quick View Button Overlay */}
        <button 
          onClick={() => onQuickView(product)}
          className="absolute bottom-0 left-0 right-0 bg-blue-600/90 text-white py-2 text-xs font-bold uppercase tracking-wider translate-y-full group-hover:translate-y-0 transition-transform duration-300 backdrop-blur-sm"
        >
          Quick View
        </button>

        <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded pointer-events-none">
          {product.category}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <Link to={`/product/${product.id}`} className="block mb-1">
          <h3 className="font-semibold text-gray-800 hover:text-blue-600 transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-grow">
          {product.description}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-xl font-bold text-blue-700">${product.price.toLocaleString()}</span>
          <button 
            onClick={() => addToCart(product)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg transition-colors"
            title="Add to Cart"
          >
            <i className="fa-solid fa-cart-plus"></i>
          </button>
        </div>
        <Link 
          to={`/product/${product.id}`}
          className="block text-center mt-3 text-sm font-medium text-blue-600 hover:underline"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
