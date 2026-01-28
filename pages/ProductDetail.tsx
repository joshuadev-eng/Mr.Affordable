
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

interface ProductDetailProps {
  products: Product[];
  addToCart: (product: Product, quantity: number) => void;
  toggleWishlist: (product: Product) => void;
  wishlist: Product[];
  onQuickView: (product: Product) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ products, addToCart, toggleWishlist, wishlist, onQuickView }) => {
  const { productId } = useParams<{ productId: string }>();
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const product = useMemo(() => 
    products.find(p => p.id === productId), [products, productId]
  );

  const allImages = useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) return product.images;
    return [product.image];
  }, [product]);

  useEffect(() => {
    setActiveImageIndex(0);
    setQuantity(1);
    window.scrollTo(0, 0);
  }, [productId]);

  const isWishlisted = useMemo(() => 
    wishlist.some(item => item.id === productId), [wishlist, productId]
  );

  const relatedProducts = useMemo(() => 
    products.filter(p => p.category === product?.category && p.id !== productId).slice(0, 4),
    [products, product, productId]
  );

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-black text-gray-900 mb-4">Product Not Found</h1>
        <Link to="/" className="bg-teal-600 text-white px-8 py-3 rounded-full font-bold">Back to Home</Link>
      </div>
    );
  }

  const nextImage = () => setActiveImageIndex(prev => (prev + 1) % allImages.length);
  const prevImage = () => setActiveImageIndex(prev => (prev - 1 + allImages.length) % allImages.length);

  // Default Shop Contact Logic (reverted from vendor contact due to schema constraints)
  const shopNumber = '231888791661';
  const whatsappMsg = `Hello, I am interested in your product: ${product.name}`;
  const whatsappUrl = `https://wa.me/${shopNumber}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-12">
        <nav className="flex mb-8 text-sm text-gray-500 font-medium">
          <Link to="/" className="hover:text-teal-600 transition-colors">Home</Link>
          <span className="mx-3 opacity-30">/</span>
          <Link to={`/category/${encodeURIComponent(product.category)}`} className="hover:text-teal-600 transition-colors">{product.category}</Link>
          <span className="mx-3 opacity-30">/</span>
          <span className="text-gray-900 font-bold">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
          {/* Gallery / Carousel */}
          <div className="space-y-6">
            <div className="aspect-square bg-gray-50 rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-gray-100 shadow-sm relative group">
              <img 
                src={allImages[activeImageIndex]} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              
              {/* Navigation Arrows for Carousel */}
              {allImages.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-800 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white">
                    <i className="fa-solid fa-chevron-left"></i>
                  </button>
                  <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-800 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white">
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </>
              )}

              <button 
                onClick={() => toggleWishlist(product)} 
                className={`absolute top-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all ${isWishlisted ? 'bg-red-500 text-white' : 'bg-white/80 backdrop-blur-md text-gray-400 hover:text-red-500'}`}
              >
                <i className={`${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart text-2xl`}></i>
              </button>
            </div>
            
            {allImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {allImages.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImageIndex(idx)}
                    className={`aspect-square w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-teal-600 shadow-lg scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt={`Thumbnail ${idx}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-teal-50 text-teal-700 font-black uppercase tracking-widest text-[10px] px-4 py-1.5 rounded-full border border-teal-100">{product.category}</span>
                <span className="bg-green-50 text-green-700 font-black uppercase tracking-widest text-[10px] px-4 py-1.5 rounded-full border border-green-100">
                  Verified Item
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">{product.name}</h1>
              <div className="flex items-center space-x-4 mb-8">
                <span className="text-5xl font-black text-teal-700">${product.price.toLocaleString()}</span>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed border-l-4 border-teal-500/20 pl-6 mb-10">{product.description}</p>
              
              {/* CONTACT BUTTONS */}
              <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100 mb-8 flex flex-col sm:flex-row gap-4">
                <a 
                  href={whatsappUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-3"
                >
                  <i className="fa-brands fa-whatsapp text-2xl"></i>
                  <span>WhatsApp Shop</span>
                </a>
                <a 
                  href={`tel:${shopNumber}`} 
                  className="flex-1 bg-white hover:bg-gray-100 text-gray-900 border-2 border-gray-100 font-black py-4 rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center space-x-3"
                >
                  <i className="fa-solid fa-phone text-lg"></i>
                  <span>Call Shop</span>
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-6 mb-10">
              <span className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Quantity</span>
              <div className="flex items-center border-2 border-gray-100 rounded-2xl overflow-hidden p-1">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-colors"><i className="fa-solid fa-minus text-xs"></i></button>
                <span className="w-16 text-center font-black text-xl text-gray-900">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-colors"><i className="fa-solid fa-plus text-xs"></i></button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <button 
                onClick={() => addToCart(product, quantity)} 
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-black py-6 rounded-2xl shadow-2xl transition-all active:scale-95 flex items-center justify-center space-x-4 text-lg"
              >
                <i className="fa-solid fa-cart-shopping text-xl"></i>
                <span>Add to Cart</span>
              </button>
              <Link 
                to="/checkout" 
                onClick={() => addToCart(product, quantity)} 
                className="flex-1 bg-gray-900 hover:bg-black text-white font-black py-6 rounded-2xl shadow-2xl flex items-center justify-center text-lg transition-all"
              >
                Instant Buy
              </Link>
            </div>
          </div>
        </div>

        <div className="py-20 border-t border-gray-100">
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-2xl md:text-3xl font-black text-gray-900">Similar Deals</h3>
            <Link to={`/category/${encodeURIComponent(product.category)}`} className="text-teal-600 font-bold hover:underline uppercase text-[10px] tracking-widest">View All {product.category}</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {relatedProducts.map(p => (
              <ProductCard 
                key={p.id} 
                product={p} 
                addToCart={(item) => addToCart(item, 1)} 
                toggleWishlist={toggleWishlist} 
                onQuickView={onQuickView} 
                isWishlisted={wishlist.some(item => item.id === p.id)} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
