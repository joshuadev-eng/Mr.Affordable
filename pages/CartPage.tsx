
import React from 'react';
import { Link } from 'react-router-dom';
import { CartItem } from '../types';

interface CartPageProps {
  cart: CartItem[];
  updateQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
}

const CartPage: React.FC<CartPageProps> = ({ cart, updateQuantity, removeFromCart }) => {
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 0 : 0; // Free delivery for all currently
  const total = subtotal + shipping;

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="mb-6">
          <i className="fa-solid fa-cart-shopping text-7xl text-gray-200"></i>
        </div>
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Look like you haven't added anything to your cart yet.</p>
        <Link 
          to="/categories" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-all"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-10">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cart.map(item => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm p-4 md:p-6 flex items-center gap-4 md:gap-6 border border-gray-100">
                <Link to={`/product/${item.id}`} className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <Link to={`/product/${item.id}`} className="font-bold text-lg hover:text-blue-600 transition-colors">
                      {item.name}
                    </Link>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                  <p className="text-gray-500 text-sm mb-4">{item.category}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-gray-100 rounded-lg">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="px-3 py-1 hover:bg-gray-50 text-gray-600"
                      >
                        <i className="fa-solid fa-minus text-xs"></i>
                      </button>
                      <span className="px-4 py-1 font-bold text-gray-800">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="px-3 py-1 hover:bg-gray-50 text-gray-600"
                      >
                        <i className="fa-solid fa-plus text-xs"></i>
                      </button>
                    </div>
                    <span className="font-bold text-blue-700 text-lg">
                      ${(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            <Link to="/categories" className="inline-block text-blue-600 font-semibold hover:underline mt-4">
              <i className="fa-solid fa-arrow-left mr-2"></i> Continue Shopping
            </Link>
          </div>

          {/* Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 sticky top-28">
              <h3 className="text-xl font-bold mb-6">Order Summary</h3>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold">${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-bold">FREE</span>
                </div>
                <div className="border-t border-gray-100 pt-4 flex justify-between">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-black text-blue-700">${total.toLocaleString()}</span>
                </div>
              </div>
              <Link 
                to="/checkout"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 mb-4"
              >
                Proceed to Checkout
              </Link>
              <p className="text-center text-xs text-gray-400">
                Prices include all local taxes and fees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
