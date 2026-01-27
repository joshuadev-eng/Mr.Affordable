
import React, { useState, useMemo } from 'react';
import { Product } from '../types';

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
  addToCart: (product: Product, quantity: number) => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose, addToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const allImages = useMemo(() => {
    if (product.images && product.images.length > 0) return product.images;
    return [product.image];
  }, [product]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-fadeInUp flex flex-col md:flex-row max-h-[95vh] md:max-h-[80vh]">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-50 w-12 h-12 bg-white/80 hover:bg-white text-gray-900 rounded-full flex items-center justify-center shadow-lg transition-all"
        >
          <i className="fa-solid fa-xmark text-2xl"></i>
        </button>

        {/* Product Images Gallery */}
        <div className="w-full md:w-1/2 bg-gray-50 flex flex-col relative overflow-hidden">
          <div className="flex-grow flex items-center justify-center p-6 md:p-12">
             <img 
               src={allImages[activeImageIndex]} 
               alt={product.name} 
               className="max-w-full max-h-[300px] md:max-h-full object-contain rounded-2xl"
             />
          </div>
          {allImages.length > 1 && (
            <div className="p-4 bg-white/40 backdrop-blur-md flex justify-center gap-2 overflow-x-auto">
              {allImages.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${activeImageIndex === idx ? 'border-teal-600 shadow-md scale-110' : 'border-transparent opacity-60'}`}
                >
                  <img src={img} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center overflow-y-auto">
          <div className="mb-8">
            <span className="text-teal-600 font-black uppercase tracking-widest text-[10px] bg-teal-50 px-4 py-1.5 rounded-full mb-4 inline-block border border-teal-100">
              {product.category}
            </span>
            <h2 className="text-4xl font-black text-gray-900 mb-2 leading-tight">{product.name}</h2>
            <p className="text-4xl font-black text-teal-700">${product.price.toLocaleString()}</p>
          </div>

          <p className="text-gray-500 mb-10 text-lg leading-relaxed">
            {product.description}
          </p>

          <div className="flex flex-col space-y-8">
            <div className="flex items-center space-x-8">
              <span className="font-black text-gray-400 uppercase text-xs tracking-widest">Quantity</span>
              <div className="flex items-center border-2 border-gray-100 rounded-2xl overflow-hidden p-1">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"
                >
                  <i className="fa-solid fa-minus"></i>
                </button>
                <span className="w-16 font-black text-gray-900 text-xl text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>

            <button 
              onClick={() => addToCart(product, quantity)}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-6 rounded-2xl shadow-2xl transition-all active:scale-95 flex items-center justify-center space-x-4 text-lg"
            >
              <i className="fa-solid fa-cart-shopping text-xl"></i>
              <span>Add to Cart</span>
            </button>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-100 grid grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                <i className="fa-solid fa-truck-fast text-xs"></i>
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monrovia Delivery</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <i className="fa-solid fa-shield-check text-xs"></i>
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verified Merchant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
