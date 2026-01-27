import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CartItem } from '../types';

interface CheckoutPageProps {
  cart: CartItem[];
  clearCart: () => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ cart, clearCart }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    paymentMethod: 'whatsapp'
  });

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    setLoading(true);

    // Build the order summary string
    const itemStrings = cart.map(item => `• ${item.name}\n  Qty: ${item.quantity} | Price: $${(item.price * item.quantity).toLocaleString()}`);
    const orderDetailsString = itemStrings.join('\n\n');

    const message = `🛍️ *NEW ORDER - MR. AFFORDABLE* 🛍️\n\n` +
      `👤 *CUSTOMER DETAILS*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Name:* ${formData.fullName}\n` +
      `*Phone:* ${formData.phone}\n` +
      `*Address:* ${formData.address}\n\n` +
      `📦 *ORDER ITEMS*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `${orderDetailsString}\n\n` +
      `💰 *FINANCIAL SUMMARY*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Subtotal:* $${subtotal.toLocaleString()}\n` +
      `*Shipping:* FREE\n` +
      `*GRAND TOTAL:* $${total.toLocaleString()}\n\n` +
      `✅ _Please confirm this order so we can begin processing it._`;

    // 1. SEND TO WHATSAPP
    const whatsappNumber = '231888791661';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    // 2. SEND EMAIL (Using Formspree as requested)
    try {
      await fetch('https://formspree.io/f/mrbrownliberia@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `🛒 New Order: ${formData.fullName}`,
          customerName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          orderItems: orderDetailsString,
          totalPrice: `$${total.toLocaleString()}`
        })
      });
    } catch (err) {
      console.error("Email sending failed", err);
    }

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');

    // Finish checkout process
    setLoading(false);
    clearCart();
    navigate('/success');
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="bg-white rounded-3xl shadow-sm p-12 max-w-md mx-auto">
          <i className="fa-solid fa-cart-shopping text-6xl text-gray-200 mb-6"></i>
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <Link to="/categories" className="bg-teal-600 text-white px-8 py-3 rounded-full font-bold inline-block hover:bg-teal-700 transition-all">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center space-x-4 mb-10">
          <Link to="/cart" className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center text-gray-600 hover:text-teal-600">
            <i className="fa-solid fa-arrow-left"></i>
          </Link>
          <h1 className="text-3xl font-black">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form */}
          <div>
            <div className="bg-white rounded-[2.5rem] shadow-sm p-10 border border-gray-100 mb-8">
              <h3 className="text-2xl font-black mb-8 flex items-center text-gray-900">
                <i className="fa-solid fa-truck-ramp-box mr-4 text-teal-600"></i> Delivery Details
              </h3>
              <form id="orderForm" onSubmit={handlePlaceOrder} className="space-y-6">
                <div className="group">
                  <label className="block text-sm font-bold text-gray-700 mb-2 transition-colors group-focus-within:text-teal-600">Full Name</label>
                  <input 
                    type="text" 
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4 focus:bg-white focus:border-teal-600 outline-none transition-all text-lg"
                    placeholder="e.g. Samuel K. Brown"
                  />
                </div>
                <div className="group">
                  <label className="block text-sm font-bold text-gray-700 mb-2 transition-colors group-focus-within:text-teal-600">WhatsApp / Phone Number</label>
                  <input 
                    type="tel" 
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4 focus:bg-white focus:border-teal-600 outline-none transition-all text-lg"
                    placeholder="+231 ..."
                  />
                </div>
                <div className="group">
                  <label className="block text-sm font-bold text-gray-700 mb-2 transition-colors group-focus-within:text-teal-600">Specific Delivery Address</label>
                  <textarea 
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    rows={4}
                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4 focus:bg-white focus:border-teal-600 outline-none transition-all text-lg"
                    placeholder="House No, Street, Community, City"
                  ></textarea>
                </div>
                <div className="pt-4">
                   <div className="bg-teal-50 border border-teal-100 p-6 rounded-3xl text-sm text-teal-800 flex items-start">
                     <i className="fa-solid fa-circle-info mt-1 mr-4 text-xl"></i>
                     <p className="font-medium leading-relaxed">
                       Your order will be sent to our official WhatsApp line. One of our agents will respond immediately to confirm your location.
                     </p>
                   </div>
                </div>
              </form>
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden sticky top-28">
              <div className="bg-gray-900 px-10 py-8 text-white">
                <h3 className="text-2xl font-black">Order Summary</h3>
                <p className="text-gray-400 text-sm">{cart.length} unique items</p>
              </div>
              <div className="p-10">
                <div className="space-y-6 mb-10 max-h-[35vh] overflow-y-auto pr-4 scrollbar-hide">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center space-x-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <div className="w-16 h-16 flex-shrink-0 bg-white rounded-xl overflow-hidden border border-gray-100 p-1">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{item.name}</h4>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{item.category}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-teal-600 font-black">x{item.quantity}</span>
                          <span className="font-bold text-sm text-gray-900">${(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 mb-10 border-t border-gray-100 pt-8">
                  <div className="flex justify-between text-gray-500 font-bold">
                    <span>Subtotal</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-bold">Shipping Fees</span>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Free Delivery</span>
                  </div>
                  <div className="flex justify-between pt-6 border-t border-gray-100">
                    <span className="text-xl font-black text-gray-900">Grand Total</span>
                    <span className="text-4xl font-black text-teal-700">${total.toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  form="orderForm"
                  type="submit"
                  disabled={loading}
                  className={`w-full ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white font-black text-xl py-6 rounded-2xl shadow-2xl transition-all active:scale-95 flex items-center justify-center space-x-4`}
                >
                  {loading ? (
                    <i className="fa-solid fa-circle-notch fa-spin text-2xl"></i>
                  ) : (
                    <>
                      <i className="fa-brands fa-whatsapp text-3xl"></i>
                      <span>Confirm & Place Order</span>
                    </>
                  )}
                </button>
                <div className="mt-6 flex items-center justify-center space-x-2 text-gray-400">
                  <i className="fa-solid fa-lock text-xs"></i>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Secure Checkout via WhatsApp</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;