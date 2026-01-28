
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

  const nextImage = () => setActiveImageIndex(prev => (prev + 1) % allImages.length);
  const prevImage = () => setActiveImageIndex(prev => (prev - 1 + allImages.length) % allImages.length);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-5xl rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl overflow-hidden animate-fadeInUp flex flex-col md:flex-row max-h-[95vh] md:max-h-[85vh]">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 md:top-8 md:right-8 z-50 w-10 h-10 md:w-14 md:h-14 bg-white/90 hover:bg-white text-gray-900 rounded-full flex items-center justify-center shadow-xl transition-all"
        >
          <i className="fa-solid fa-xmark text-xl md:text-2xl"></i>
        </button>

        {/* Product Images Gallery (Carousel) */}
        <div className="w-full md:w-1/2 bg-gray-50 flex flex-col relative group">
          <div className="flex-grow flex items-center justify-center p-6 md:p-12">
             <img 
               src={allImages[activeImageIndex]} 
               alt={product.name} 
               className="max-w-full max-h-[250px] md:max-h-full object-contain rounded-2xl"
             />
          </div>
          
          {/* Carousel Arrows */}
          {allImages.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-800 shadow hover:bg-white transition-all opacity-0 group-hover:opacity-100">
                <i className="fa-solid fa-chevron-left text-xs"></i>
              </button>
              <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-800 shadow hover:bg-white transition-all opacity-0 group-hover:opacity-100">
                <i className="fa-solid fa-chevron-right text-xs"></i>
              </button>
            </>
          )}

          {allImages.length > 1 && (
            <div className="p-4 bg-white/50 backdrop-blur-md flex justify-center gap-2 overflow-x-auto scrollbar-hide">
              {allImages.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${activeImageIndex === idx ? 'border-teal-600 shadow-lg scale-110' : 'border-transparent opacity-60'}`}
                >
                  <img src={img} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center overflow-y-auto">
          <div className="mb-6 md:mb-10">
            <span className="text-teal-600 font-black uppercase tracking-widest text-[9px] bg-teal-50 px-4 py-1.5 rounded-full mb-4 inline-block border border-teal-100">
              {product.category}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 leading-tight">{product.name}</h2>
            <p className="text-3xl md:text-4xl font-black text-teal-700">${product.price.toLocaleString()}</p>
          </div>

          <p className="text-gray-500 mb-8 md:mb-12 text-base md:text-lg leading-relaxed line-clamp-4 md:line-clamp-none">
            {product.description}
          </p>

          <div className="flex flex-col space-y-6 md:space-y-8">
            <div className="flex items-center space-x-6">
              <span className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Quantity</span>
              <div className="flex items-center border-2 border-gray-100 rounded-2xl overflow-hidden p-1">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"
                >
                  <i className="fa-solid fa-minus text-xs"></i>
                </button>
                <span className="w-14 md:w-16 font-black text-gray-900 text-lg md:text-xl text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"
                >
                  <i className="fa-solid fa-plus text-xs"></i>
                </button>
              </div>
            </div>

            <button 
              onClick={() => addToCart(product, quantity)}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-5 md:py-6 rounded-2xl shadow-2xl transition-all active:scale-95 flex items-center justify-center space-x-4 text-base md:text-lg"
            >
              <i className="fa-solid fa-cart-shopping text-lg md:text-xl"></i>
              <span>Add to Shopping Cart</span>
            </button>
          </div>

          <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-100 grid grid-cols-2 gap-4 md:gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                <i className="fa-solid fa-truck-fast text-[10px]"></i>
              </div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Fast Delivery</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <i className="fa-solid fa-shield-check text-[10px]"></i>
              </div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Secure Order</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
