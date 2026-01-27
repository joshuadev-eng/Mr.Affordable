
import React, { useState } from 'react';
import { Product } from '../types';

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
  addToCart: (product: Product, quantity: number) => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose, addToCart }) => {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden animate-fadeInUp flex flex-col md:flex-row">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/80 hover:bg-white text-gray-900 rounded-full flex items-center justify-center shadow-lg transition-all"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        {/* Product Image */}
        <div className="w-full md:w-1/2 bg-gray-100 flex items-center justify-center">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover max-h-[400px] md:max-h-full"
          />
        </div>

        {/* Product Info */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-6">
            <span className="text-blue-600 font-bold uppercase tracking-widest text-[10px] bg-blue-50 px-3 py-1 rounded-full mb-3 inline-block">
              {product.category}
            </span>
            <h2 className="text-3xl font-black text-gray-900 mb-2">{product.name}</h2>
            <p className="text-2xl font-black text-blue-700">${product.price.toLocaleString()}</p>
          </div>

          <p className="text-gray-600 mb-8 leading-relaxed">
            {product.description}
          </p>

          <div className="flex flex-col space-y-6">
            <div className="flex items-center space-x-6">
              <span className="font-bold text-gray-900">Quantity</span>
              <div className="flex items-center border-2 border-gray-100 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-gray-50 text-gray-600 transition-colors"
                >
                  <i className="fa-solid fa-minus"></i>
                </button>
                <span className="px-6 py-2 font-black text-gray-900 min-w-[50px] text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 hover:bg-gray-50 text-gray-600 transition-colors"
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>

            <button 
              onClick={() => addToCart(product, quantity)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-3"
            >
              <i className="fa-solid fa-cart-shopping"></i>
              <span>Add to Cart</span>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-50 flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <i className="fa-solid fa-truck-fast text-blue-500"></i>
              <span>Monrovia Delivery</span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <i className="fa-solid fa-shield-check text-green-500"></i>
              <span>Quality Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
