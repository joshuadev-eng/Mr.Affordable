
import React, { useState, useRef } from 'react';
import { User, Product, Category, Order } from '../types.ts';
import { pb } from '../App.tsx';

interface DashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
  userProducts: Product[];
  orders: Order[];
  onUpdateOrder: (orderId: string, status: Order['status']) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onUpdateUser, userProducts, orders, onUpdateOrder }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'sell' | 'my-products' | 'orders'>('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const productFileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: user.name,
    phone: user.phone,
    profilePic: user.profilePic || '',
    avatarFile: null as File | null
  });

  // Product Sell State
  const [productData, setProductData] = useState({
    name: '',
    price: '',
    category: Category.Phones,
    description: '',
    image: '',
    imageFile: null as File | null
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('phone', profileData.phone);
      if (profileData.avatarFile) {
        formData.append('avatar', profileData.avatarFile);
      }

      const updatedRecord = await pb.collection('users').update(user.id, formData);
      
      const updatedUser: User = {
        ...user,
        name: updatedRecord.name,
        phone: updatedRecord.phone,
        profilePic: updatedRecord.avatar ? pb.getFileUrl(updatedRecord, updatedRecord.avatar) : user.profilePic
      };
      
      onUpdateUser(updatedUser);
      alert('Profile updated successfully!');
    } catch (err: any) {
      console.error("Profile update error:", err);
      alert(`Failed to update profile: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'profile' | 'product') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (target === 'profile') {
          setProfileData({ ...profileData, profilePic: base64, avatarFile: file });
        } else {
          setProductData({ ...productData, image: base64, imageFile: file });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productData.imageFile) {
      alert('Please upload a product image.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', productData.name);
      formData.append('price', productData.price);
      formData.append('category', productData.category);
      formData.append('description', productData.description);
      formData.append('image', productData.imageFile);
      formData.append('user', user.id);
      formData.append('isApproved', 'false');

      await pb.collection('products').create(formData);
      
      alert('Product submitted! It will appear on the website once an administrator approves it.');
      setProductData({ name: '', price: '', category: Category.Phones, description: '', image: '', imageFile: null });
      setActiveTab('my-products');
    } catch (err: any) {
      console.error("Product submission error:", err);
      alert(`Failed to submit product: ${err.message}. Please ensure the 'products' collection exists in PocketBase.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Delivered': return 'bg-green-100 text-green-700';
      case 'Shipped': return 'bg-blue-100 text-blue-700';
      case 'Confirmed': return 'bg-teal-100 text-teal-700';
      default: return 'bg-orange-100 text-orange-700';
    }
  };

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-1/4 space-y-4">
            <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100 text-center">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-full bg-teal-100 overflow-hidden border-4 border-white shadow-md mx-auto">
                  {profileData.profilePic ? (
                    <img src={profileData.profilePic} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-teal-600">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => profileFileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-teal-600 text-white p-2 rounded-full shadow-lg hover:bg-teal-700 transition-all border-2 border-white"
                >
                  <i className="fa-solid fa-camera text-xs"></i>
                </button>
                <input 
                  type="file" 
                  ref={profileFileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'profile')}
                />
              </div>
              <h2 className="font-black text-gray-900 text-lg">{user.name}</h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{user.role}</p>
            </div>

            <nav className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-4 px-6 py-4 text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-teal-50 hover:text-teal-600'}`}
              >
                <i className="fa-solid fa-user-gear"></i>
                <span>Edit Profile</span>
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center space-x-4 px-6 py-4 text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-teal-50 hover:text-teal-600'}`}
              >
                <i className="fa-solid fa-clock-rotate-left"></i>
                <span>Order History</span>
              </button>
              <button 
                onClick={() => setActiveTab('sell')}
                className={`w-full flex items-center space-x-4 px-6 py-4 text-sm font-bold transition-all ${activeTab === 'sell' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-teal-50 hover:text-teal-600'}`}
              >
                <i className="fa-solid fa-tag"></i>
                <span>Sell a Product</span>
              </button>
              <button 
                onClick={() => setActiveTab('my-products')}
                className={`w-full flex items-center space-x-4 px-6 py-4 text-sm font-bold transition-all ${activeTab === 'my-products' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-teal-50 hover:text-teal-600'}`}
              >
                <i className="fa-solid fa-boxes-stacked"></i>
                <span>My Products ({userProducts.length})</span>
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="w-full md:w-3/4">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 md:p-12 min-h-[500px]">
              {activeTab === 'profile' && (
                <div className="animate-fadeInUp">
                  <h3 className="text-2xl font-black mb-8">Profile Settings</h3>
                  <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-lg">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                      <input 
                        type="text" 
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Phone Number</label>
                      <input 
                        type="tel" 
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Email (Read-only)</label>
                      <input 
                        type="email" 
                        readOnly
                        value={user.email}
                        className="w-full px-5 py-4 bg-gray-100 border-2 border-transparent rounded-2xl text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isUpdating}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-black px-10 py-4 rounded-2xl shadow-xl transition-all active:scale-95 disabled:bg-gray-400"
                    >
                      {isUpdating ? 'Updating...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="animate-fadeInUp">
                  <h3 className="text-2xl font-black mb-8">Order History</h3>
                  {orders.length === 0 ? (
                    <div className="text-center py-20">
                      <i className="fa-solid fa-receipt text-6xl text-gray-100 mb-4"></i>
                      <p className="text-gray-500 font-medium">No orders found.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map(order => (
                        <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                          <div className="bg-gray-50 px-6 py-4 flex flex-wrap justify-between items-center gap-4 border-b border-gray-100">
                            <div className="flex gap-6">
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order ID</p>
                                <p className="text-sm font-bold text-gray-700">#{order.id.slice(-8).toUpperCase()}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p>
                                <p className="text-sm font-bold text-gray-700">{order.date}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Amount</p>
                                <p className="text-sm font-bold text-teal-600">${order.total.toLocaleString()}</p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="p-6">
                            <div className="flex flex-wrap gap-4 mb-6">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100 min-w-[200px]">
                                  <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg" />
                                  <div className="flex-grow">
                                    <p className="text-xs font-bold text-gray-800 line-clamp-1">{item.name}</p>
                                    <p className="text-[10px] text-gray-500">Qty: {item.quantity}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-50">
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Shipping Address</p>
                               <p className="text-xs text-gray-600 leading-relaxed italic">{order.address}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'sell' && (
                <div className="animate-fadeInUp">
                  <h3 className="text-2xl font-black mb-8">Sell Your Product</h3>
                  <form onSubmit={handleProductSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Product Name</label>
                        <input 
                          type="text" 
                          required
                          value={productData.name}
                          onChange={(e) => setProductData({...productData, name: e.target.value})}
                          placeholder="e.g. Brand New Solar Panel"
                          className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Price ($)</label>
                        <input 
                          type="number" 
                          required
                          value={productData.price}
                          onChange={(e) => setProductData({...productData, price: e.target.value})}
                          placeholder="0.00"
                          className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Category</label>
                      <select 
                        value={productData.category}
                        onChange={(e) => setProductData({...productData, category: e.target.value as Category})}
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all"
                      >
                        {Object.values(Category).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Product Description</label>
                      <textarea 
                        required
                        value={productData.description}
                        onChange={(e) => setProductData({...productData, description: e.target.value})}
                        rows={4}
                        placeholder="Tell buyers more about what you are selling..."
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all"
                      ></textarea>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Product Image</label>
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl p-8 bg-gray-50 transition-colors hover:bg-teal-50">
                        {productData.image ? (
                          <div className="relative group">
                            <img src={productData.image} alt="Preview" className="h-48 rounded-xl object-cover" />
                            <button 
                              type="button" 
                              onClick={() => setProductData({...productData, image: '', imageFile: null})}
                              className="absolute -top-3 -right-3 bg-red-500 text-white w-8 h-8 rounded-full shadow-lg"
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer text-center">
                            <i className="fa-solid fa-cloud-arrow-up text-4xl text-teal-400 mb-2"></i>
                            <p className="text-gray-500 text-sm">Click to upload product image</p>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'product')}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-black px-12 py-5 rounded-2xl shadow-xl transition-all active:scale-95 disabled:bg-gray-400"
                    >
                      {isSubmitting ? <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> : 'Submit for Approval'}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'my-products' && (
                <div className="animate-fadeInUp">
                  <h3 className="text-2xl font-black mb-8">My Uploaded Products</h3>
                  {userProducts.length === 0 ? (
                    <div className="text-center py-20">
                      <i className="fa-solid fa-box-open text-6xl text-gray-100 mb-4"></i>
                      <p className="text-gray-500 font-medium">You haven't uploaded any products yet.</p>
                      <button 
                        onClick={() => setActiveTab('sell')}
                        className="mt-6 text-teal-600 font-bold hover:underline"
                      >
                        Start Selling Now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userProducts.map(p => (
                        <div key={p.id} className="flex items-center gap-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <img src={p.image} alt={p.name} className="w-20 h-20 object-cover rounded-xl shadow-sm" />
                          <div className="flex-grow">
                            <h4 className="font-bold text-gray-900">{p.name}</h4>
                            <p className="text-teal-600 font-black">${p.price.toLocaleString()}</p>
                            <div className="flex items-center mt-1">
                               {p.isApproved ? (
                                 <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full uppercase tracking-widest">Approved</span>
                               ) : (
                                 <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full uppercase tracking-widest">Pending Review</span>
                               )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
