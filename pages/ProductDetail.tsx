import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PRODUCTS } from '../data';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

interface ProductDetailProps {
  addToCart: (product: Product, quantity: number) => void;
  toggleWishlist: (product: Product) => void;
  wishlist: Product[];
  onQuickView: (product: Product) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ addToCart, toggleWishlist, wishlist, onQuickView }) => {
  const { productId } = useParams<{ productId: string }>();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  const product = useMemo(() => 
    PRODUCTS.find(p => p.id === productId), [productId]
  );

  const isWishlisted = useMemo(() => 
    wishlist.some(item => item.id === productId), [wishlist, productId]
  );

  const relatedProducts = useMemo(() => 
    PRODUCTS.filter(p => p.category === product?.category && p.id !== productId).slice(0, 4),
    [product, productId]
  );

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Product Not Found</h1>
        <Link to="/" className="text-teal-600 hover:underline mt-4 inline-block">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-12">
        <nav className="flex mb-8 text-sm text-gray-500">
          <Link to="/" className="hover:text-teal-600">Home</Link>
          <span className="mx-2">/</span>
          <Link to={`/category/${encodeURIComponent(product.category)}`} className="hover:text-teal-600">{product.category}</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-3xl overflow-hidden shadow-sm border border-gray-100 relative">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
              <button 
                onClick={() => toggleWishlist(product)}
                className={`absolute top-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
                  isWishlisted ? 'bg-red-500 text-white' : 'bg-white text-gray-400 hover:text-red-500'
                }`}
              >
                <i className={`${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart text-2xl`}></i>
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <div className="mb-8">
              <span className="text-teal-600 font-bold uppercase tracking-wider text-xs mb-2 block">
                {product.category}
              </span>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
              <div className="flex items-center space-x-4 mb-6">
                <span className="text-3xl font-extrabold text-teal-700">${product.price.toLocaleString()}</span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">In Stock</span>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="space-y-6 mb-8">
              <div className="flex items-center space-x-6">
                <span className="font-bold text-gray-900">Quantity</span>
                <div className="flex items-center border border-gray-200 rounded-xl">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-gray-50 text-gray-600 transition-colors"
                  >
                    <i className="fa-solid fa-minus"></i>
                  </button>
                  <span className="px-6 py-2 font-bold text-lg min-w-[50px] text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 hover:bg-gray-50 text-gray-600 transition-colors"
                  >
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => addToCart(product, quantity)}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-3"
              >
                <i className="fa-solid fa-cart-shopping"></i>
                <span>Add to Cart</span>
              </button>
              <Link 
                to="/checkout"
                onClick={() => addToCart(product, quantity)}
                className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center"
              >
                Buy Now
              </Link>
            </div>

            <div className="mt-12 border-t border-gray-100 pt-8 grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 text-gray-600">
                <i className="fa-solid fa-truck-fast text-teal-600"></i>
                <span className="text-sm">Free Local Delivery</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-600">
                <i className="fa-solid fa-rotate text-teal-600"></i>
                <span className="text-sm">7 Days Easy Return</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs section */}
        <div className="mb-20">
          <div className="flex space-x-8 border-b border-gray-200 mb-8">
            <button 
              onClick={() => setActiveTab('description')}
              className={`pb-4 font-bold transition-all ${activeTab === 'description' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Detailed Description
            </button>
            <button 
              onClick={() => setActiveTab('features')}
              className={`pb-4 font-bold transition-all ${activeTab === 'features' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Key Features
            </button>
          </div>
          <div className="max-w-4xl">
            {activeTab === 'description' ? (
              <div className="prose max-w-none text-gray-600">
                <p>This premium {product.name} is designed to provide high performance and durability at an affordable price. Sourced from the best manufacturers, we guarantee quality and long-term service.</p>
                <p className="mt-4">Whether you're looking to upgrade your home or office, this item fits perfectly into any setting. We offer a full warranty and dedicated customer support for this specific product.</p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <li className="flex items-center space-x-3 text-gray-600">
                  <i className="fa-solid fa-circle-check text-green-500"></i>
                  <span>Original Manufacturer Quality</span>
                </li>
                <li className="flex items-center space-x-3 text-gray-600">
                  <i className="fa-solid fa-circle-check text-green-500"></i>
                  <span>Energy Efficient & Eco-friendly</span>
                </li>
                <li className="flex items-center space-x-3 text-gray-600">
                  <i className="fa-solid fa-circle-check text-green-500"></i>
                  <span>Ergonomic & Modern Design</span>
                </li>
                <li className="flex items-center space-x-3 text-gray-600">
                  <i className="fa-solid fa-circle-check text-green-500"></i>
                  <span>Available in multiple variants</span>
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* Related Products */}
        <div className="py-12 border-t border-gray-100">
          <h3 className="text-2xl font-bold mb-8">Related Products</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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