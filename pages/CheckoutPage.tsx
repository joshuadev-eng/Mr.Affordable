
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CartItem, User, Order } from '../types.ts';

interface CheckoutPageProps {
  cart: CartItem[];
  clearCart: () => void;
  user: User | null;
  addOrder: (order: Order) => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ cart, clearCart, user, addOrder }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    address: '',
    paymentMethod: 'whatsapp'
  });

  const [deliveryFee, setDeliveryFee] = useState(0);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  useEffect(() => {
    if (formData.fullName && formData.address) {
      if (subtotal >= 1000) {
        setDeliveryFee(0);
      } else if (subtotal >= 200) {
        setDeliveryFee(5.00);
      } else if (subtotal >= 50) {
        setDeliveryFee(10.00);
      } else {
        setDeliveryFee(15.00);
      }
    } else {
      setDeliveryFee(0);
    }
  }, [formData.fullName, formData.address, subtotal]);

  const total = subtotal + deliveryFee;

  const validatePhone = (phone: string) => {
    const re = /^(\+231|0)(77|88|55)\d{7}$/;
    return re.test(phone.replace(/\s+/g, ''));
  };

  const formatPhone = (phone: string) => {
    let cleaned = phone.replace(/\s+/g, '');
    if (cleaned.startsWith('0')) {
      return '+231' + cleaned.substring(1);
    }
    return cleaned;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const simulatedAddress = `Location Detected: [Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}] - Near Central Monrovia`;
        setFormData(prev => ({ ...prev, address: simulatedAddress }));
        setLocating(false);
      },
      (error) => {
        alert("Unable to retrieve your location. Please type it manually.");
        setLocating(false);
      }
    );
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    if (!validatePhone(formData.phone)) {
      alert('Invalid Phone Number. Please enter a valid WhatsApp number (e.g., 0777 123 456 or +231 777 123 456)');
      return;
    }

    setLoading(true);
    const finalPhone = formatPhone(formData.phone);

    const itemStrings = cart.map(item => `• ${item.name}\n  Qty: ${item.quantity} | Price: $${(item.price * item.quantity).toLocaleString()}`);
    const orderDetailsString = itemStrings.join('\n\n');

    const message = `🛍️ *NEW ORDER - MR. AFFORDABLE* 🛍️\n\n` +
      `👤 *CUSTOMER DETAILS*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Name:* ${formData.fullName}\n` +
      `*Phone:* ${finalPhone}\n` +
      `*Address:* ${formData.address}\n\n` +
      `📦 *ORDER ITEMS*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `${orderDetailsString}\n\n` +
      `💰 *FINANCIAL SUMMARY*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Subtotal:* $${subtotal.toLocaleString()}\n` +
      `*Delivery Fee:* ${deliveryFee === 0 ? 'FREE' : '$' + deliveryFee.toFixed(2)}\n` +
      `*GRAND TOTAL:* $${total.toLocaleString()}\n\n` +
      `✅ _Please confirm this order._`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      userId: user?.id || 'guest',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      items: [...cart],
      subtotal,
      deliveryFee,
      total,
      status: 'Pending',
      address: formData.address
    };
    
    await addOrder(newOrder);

    const whatsappNumber = '231888791661';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    try {
      await fetch('https://formspree.io/f/mraffordableshop@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `🛒 New Order: ${formData.fullName}`,
          customerName: formData.fullName,
          phone: finalPhone,
          address: formData.address,
          orderItems: orderDetailsString,
          totalPrice: `$${total.toLocaleString()}`,
          deliveryFee: deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`
        })
      });
    } catch (err) {
      console.error("Email sending failed", err);
    }

    clearCart();
    setLoading(false);
    
    navigate('/success', { 
      state: { 
        whatsappUrl: whatsappUrl 
      },
      replace: true 
    });
  };

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
          <div>
            <div className="bg-white rounded-[2.5rem] shadow-sm p-10 border border-gray-100 mb-8">
              <h3 className="text-2xl font-black mb-8 flex items-center text-gray-900">
                <i className="fa-solid fa-truck-ramp-box mr-4 text-teal-600"></i> Delivery Details
              </h3>
              <form id="orderForm" onSubmit={handlePlaceOrder} className="space-y-6">
                <div className="group">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                  <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4 focus:bg-white focus:border-teal-600 outline-none transition-all text-lg" placeholder="e.g. Samuel K. Brown" />
                </div>
                <div className="group">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-700">WhatsApp / Phone Number</label>
                    {formData.phone && !validatePhone(formData.phone) && (
                      <span className="text-[10px] text-red-500 font-bold uppercase">Invalid Format</span>
                    )}
                  </div>
                  <input 
                    type="tel" 
                    name="phone" 
                    required 
                    value={formData.phone} 
                    onChange={handleChange} 
                    className={`w-full bg-gray-50 border-2 rounded-2xl px-6 py-4 focus:bg-white outline-none transition-all text-lg ${formData.phone && !validatePhone(formData.phone) ? 'border-red-300' : 'border-transparent focus:border-teal-600'}`} 
                    placeholder="+231 777 000 000" 
                  />
                  <p className="text-[10px] text-gray-400 mt-2 font-bold">Use +231 or 0 prefix (e.g., 0777 123 456)</p>
                </div>
                <div className="group">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-gray-700">Specific Delivery Address</label>
                    <button type="button" onClick={handleUseLocation} disabled={locating} className="text-xs font-black text-teal-600 flex items-center hover:underline">
                      {locating ? <i className="fa-solid fa-circle-notch fa-spin mr-1"></i> : <i className="fa-solid fa-location-crosshairs mr-1"></i>} Use my location
                    </button>
                  </div>
                  <textarea name="address" required value={formData.address} onChange={handleChange} rows={4} className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4 focus:bg-white focus:border-teal-600 outline-none transition-all text-lg" placeholder="House No, Street, Community, City"></textarea>
                </div>
              </form>
            </div>
          </div>

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
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-teal-600 font-black">x{item.quantity}</span>
                          <span className="font-bold text-sm text-gray-900">${(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 mb-10 border-t border-gray-100 pt-8">
                  <div className="flex justify-between text-gray-500 font-bold"><span>Subtotal</span><span>${subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-bold">Delivery Fee</span>
                    {formData.address ? (deliveryFee > 0 ? <span className="font-bold text-gray-900">${deliveryFee.toFixed(2)}</span> : <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">FREE</span>) : <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Add address for fee</span>}
                  </div>
                  <div className="flex justify-between pt-6 border-t border-gray-100">
                    <span className="text-xl font-black text-gray-900">Total Amount</span>
                    <span className="text-4xl font-black text-teal-700">${total.toLocaleString()}</span>
                  </div>
                </div>

                <button form="orderForm" type="submit" disabled={loading} className={`w-full ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white font-black text-xl py-6 rounded-2xl shadow-2xl transition-all active:scale-95 flex items-center justify-center space-x-4`}>
                  {loading ? <i className="fa-solid fa-circle-notch fa-spin text-2xl"></i> : <><i className="fa-brands fa-whatsapp text-3xl"></i><span>Confirm & Place Order</span></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
