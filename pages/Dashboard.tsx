
import React, { useState, useRef, useMemo } from 'react';
import { User, Product, Category, Order } from '../types.ts';
import { supabase } from '../supabaseClient.ts';

interface DashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
  userProducts: Product[];
  orders: Order[];
  onUpdateOrder: (orderId: string, status: Order['status']) => void;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onClearAllProducts?: () => void;
  onToggleApproval: (productId: string) => void;
  onRejectProduct: (productId: string) => void;
  allLocalProducts?: Product[];
}

const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  onUpdateUser, 
  userProducts, 
  orders, 
  onUpdateOrder, 
  onAddProduct, 
  onUpdateProduct,
  onDeleteProduct,
  onClearAllProducts,
  onToggleApproval, 
  onRejectProduct,
  allLocalProducts = [] 
}) => {
  const isAdmin = user.role === 'admin';
  const [activeTab, setActiveTab] = useState<'profile' | 'sell' | 'my-products' | 'orders' | 'admin'>(
    isAdmin ? 'admin' : 'profile'
  );
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const multiProductFileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState({
    name: user.name,
    phone: user.phone,
    profilePic: user.profilePic || '',
  });

  const [productData, setProductData] = useState({
    name: '',
    price: '',
    category: Category.Phones,
    description: '',
    images: [] as string[]
  });

  // Calculate Admin Stats
  const adminStats = useMemo(() => {
    if (!isAdmin) return null;
    const totalRevenue = orders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + o.total, 0);
    const pendingCount = allLocalProducts.filter(p => !p.isApproved && !p.isDenied).length;
    return {
      revenue: totalRevenue,
      pending: pendingCount,
      totalItems: allLocalProducts.length,
      orders: orders.length
    };
  }, [isAdmin, allLocalProducts, orders]);

  const pendingQueue = useMemo(() => {
    return allLocalProducts
      .filter(p => !p.isApproved && !p.isDenied)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [allLocalProducts]);

  const displayProducts = useMemo(() => {
    if (isAdmin) return [...allLocalProducts].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return [...userProducts].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [isAdmin, allLocalProducts, userProducts]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    await onUpdateUser({ ...user, ...profileData });
    setIsUpdating(false);
    alert('Profile updated!');
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (productData.images.length === 0) return alert('Add at least one photo.');
    
    setIsSubmitting(true);
    const newProduct: Product = {
      id: `local-${Date.now()}`,
      name: productData.name,
      price: parseFloat(productData.price),
      category: productData.category,
      description: productData.description,
      image: productData.images[0],
      images: productData.images,
      userId: user.id,
      isApproved: isAdmin, 
      isDenied: false,
      createdAt: Date.now()
    };
    
    await onAddProduct(newProduct);
    setIsSubmitting(false);
    setProductData({ name: '', price: '', category: Category.Phones, description: '', images: [] });
    setActiveTab('my-products');
  };

  const removeImage = (index: number) => {
    setProductData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const getStatusBadge = (product: Product) => {
    if (product.isDenied) {
      return (
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-red-100 text-red-700 border border-red-200">
          <i className="fa-solid fa-circle-xmark text-[12px]"></i>
          <span className="text-[10px] font-black uppercase tracking-wider">Denied / Rejected</span>
        </div>
      );
    }
    if (product.isApproved) {
      return (
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 border border-green-200">
          <i className="fa-solid fa-circle-check text-[12px]"></i>
          <span className="text-[10px] font-black uppercase tracking-wider">Approved & Active</span>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
        <i className="fa-solid fa-clock text-[12px] animate-pulse"></i>
        <span className="text-[10px] font-black uppercase tracking-wider">Waiting for Admin Review</span>
      </div>
    );
  };

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-1/4 space-y-4">
            <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100 text-center relative overflow-hidden">
              {isAdmin && <div className="absolute top-0 left-0 w-full h-1 bg-orange-600"></div>}
              <div className="w-20 h-20 rounded-full bg-teal-100 mx-auto mb-4 border-2 border-white shadow-md overflow-hidden flex items-center justify-center">
                {user.profilePic ? (
                  <img src={user.profilePic} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <div className="text-2xl font-black text-teal-600">{user.name[0]}</div>
                )}
              </div>
              <h2 className="font-black text-gray-900">{user.name}</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{user.role}</p>
            </div>
            
            <nav className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden font-bold text-sm">
              <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center space-x-4 px-6 py-4 transition-colors ${activeTab === 'profile' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <i className="fa-solid fa-user-gear"></i><span>Settings</span>
              </button>
              <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center space-x-4 px-6 py-4 transition-colors ${activeTab === 'orders' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <i className="fa-solid fa-receipt"></i><span>Orders</span>
              </button>
              <button onClick={() => setActiveTab('sell')} className={`w-full flex items-center space-x-4 px-6 py-4 transition-colors ${activeTab === 'sell' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <i className="fa-solid fa-plus-circle"></i><span>New Listing</span>
              </button>
              <button onClick={() => setActiveTab('my-products')} className={`w-full flex items-center space-x-4 px-6 py-4 transition-colors ${activeTab === 'my-products' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <i className="fa-solid fa-boxes-stacked"></i><span>{isAdmin ? 'Master Catalog' : 'My Items'}</span>
              </button>
              {isAdmin && (
                <button onClick={() => setActiveTab('admin')} className={`w-full flex items-center justify-between px-6 py-4 border-t transition-colors ${activeTab === 'admin' ? 'bg-orange-600 text-white' : 'text-orange-600 hover:bg-orange-50'}`}>
                  <div className="flex items-center space-x-4">
                    <i className="fa-solid fa-shield-halved"></i>
                    <span>Review Queue</span>
                  </div>
                  {pendingQueue.length > 0 && <span className="bg-white text-orange-600 px-2 py-0.5 rounded-full text-[10px]">{pendingQueue.length}</span>}
                </button>
              )}
            </nav>
          </div>

          {/* Content */}
          <div className="w-full md:w-3/4">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 md:p-12 min-h-[600px]">
              
              {activeTab === 'admin' && isAdmin && (
                <div className="animate-fadeInUp">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                      <p className="text-[10px] font-black text-orange-400 uppercase">Pending Review</p>
                      <p className="text-2xl font-black text-orange-700">{adminStats?.pending}</p>
                    </div>
                    <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100">
                      <p className="text-[10px] font-black text-teal-400 uppercase">Total Items</p>
                      <p className="text-2xl font-black text-teal-700">{adminStats?.totalItems}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                      <p className="text-[10px] font-black text-blue-400 uppercase">Total Orders</p>
                      <p className="text-2xl font-black text-blue-700">{adminStats?.orders}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                      <p className="text-[10px] font-black text-green-400 uppercase">Revenue</p>
                      <p className="text-2xl font-black text-green-700">${adminStats?.revenue.toLocaleString()}</p>
                    </div>
                  </div>

                  <h3 className="text-3xl font-black mb-8 text-gray-900">Review Queue</h3>
                  {pendingQueue.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl">
                      <i className="fa-solid fa-circle-check text-5xl text-green-200 mb-4"></i>
                      <p className="text-gray-500 font-bold">All items reviewed!</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {pendingQueue.map(p => (
                        <div key={p.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row gap-6">
                          <img src={p.image} className="w-full md:w-40 h-40 object-cover rounded-2xl" alt={p.name} />
                          <div className="flex-grow">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="text-2xl font-black text-gray-900">{p.name}</h4>
                                <span className="text-xs text-teal-600 font-bold uppercase">{p.category}</span>
                              </div>
                              <span className="text-2xl font-black text-teal-700">${p.price}</span>
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-6">{p.description}</p>
                            <div className="flex gap-4">
                              <button onClick={() => onToggleApproval(p.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl transition-all">Approve Listing</button>
                              <button onClick={() => onRejectProduct(p.id)} className="px-6 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all">Reject</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'my-products' && (
                <div className="animate-fadeInUp">
                  <h3 className="text-3xl font-black mb-8">{isAdmin ? 'Master Catalog' : 'My Listings'}</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {displayProducts.map(p => (
                      <div key={p.id} className="bg-white border border-gray-100 rounded-3xl p-4 flex items-center gap-4 hover:shadow-md transition-all">
                        <img src={p.image} className="w-20 h-20 object-cover rounded-xl" alt={p.name} />
                        <div className="flex-grow">
                          <h4 className="font-bold text-gray-900">{p.name}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="font-black text-teal-700">${p.price}</span>
                            {getStatusBadge(p)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => onDeleteProduct(p.id)} className="w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all"><i className="fa-solid fa-trash"></i></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="animate-fadeInUp">
                  <h3 className="text-3xl font-black mb-8">Profile Settings</h3>
                  <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-md">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase">Full Name</label>
                      <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase">WhatsApp</label>
                      <input type="tel" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                    </div>
                    <button type="submit" disabled={isUpdating} className="bg-teal-600 text-white font-black px-10 py-4 rounded-2xl shadow-xl hover:bg-teal-700 transition-all">
                      {isUpdating ? 'Saving...' : 'Update Profile'}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'sell' && (
                <div className="animate-fadeInUp">
                  <h3 className="text-3xl font-black mb-4">Add New Product</h3>
                  <p className="text-gray-500 mb-8 font-medium">List an item for sale. It will be live after admin approval.</p>
                  
                  <form onSubmit={handleProductSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase ml-1">Product Name</label>
                        <input type="text" placeholder="e.g. iPhone 15 Pro Max" required value={productData.name} onChange={e => setProductData({...productData, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase ml-1">Price (USD)</label>
                        <input type="number" placeholder="0.00" required value={productData.price} onChange={e => setProductData({...productData, price: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase ml-1">Category</label>
                      <select value={productData.category} onChange={e => setProductData({...productData, category: e.target.value as Category})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all">
                        {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase ml-1">Description</label>
                      <textarea placeholder="Tell buyers about your item..." rows={4} value={productData.description} onChange={e => setProductData({...productData, description: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all"></textarea>
                    </div>
                    
                    <div className="space-y-4">
                      <label className="text-xs font-black text-gray-400 uppercase ml-1 flex justify-between">
                        <span>Product Photos ({productData.images.length}/5)</span>
                        <span className="text-teal-600 italic">First photo is featured</span>
                      </label>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {productData.images.map((img, idx) => (
                          <div key={idx} className="aspect-square relative group rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm">
                            <img src={img} className="w-full h-full object-cover" alt={`Preview ${idx}`} />
                            <button 
                              type="button" 
                              onClick={() => removeImage(idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <i className="fa-solid fa-xmark text-xs"></i>
                            </button>
                            {idx === 0 && (
                              <div className="absolute bottom-0 inset-x-0 bg-teal-600 text-white text-[8px] font-black uppercase py-1 text-center">Featured</div>
                            )}
                          </div>
                        ))}
                        {productData.images.length < 5 && (
                          <button 
                            type="button" 
                            onClick={() => multiProductFileInputRef.current?.click()}
                            className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-600 transition-all"
                          >
                            <i className="fa-solid fa-plus text-xl mb-1"></i>
                            <span className="text-[10px] font-bold uppercase">Add Photo</span>
                          </button>
                        )}
                      </div>
                      
                      <input type="file" ref={multiProductFileInputRef} multiple className="hidden" accept="image/*" onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const remaining = 5 - productData.images.length;
                        files.slice(0, remaining).forEach((f: any) => {
                          const r = new FileReader();
                          r.onloadend = () => setProductData(prev => ({...prev, images: [...prev.images, r.result as string].slice(0, 5)}));
                          r.readAsDataURL(f);
                        });
                      }} />
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full bg-teal-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-teal-700 transition-all flex items-center justify-center space-x-3">
                      {isSubmitting ? (
                        <i className="fa-solid fa-circle-notch fa-spin text-xl"></i>
                      ) : (
                        <>
                          <i className="fa-solid fa-cloud-arrow-up text-xl"></i>
                          <span>Submit Listing for Review</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="animate-fadeInUp">
                  <h3 className="text-3xl font-black mb-8">Order Management</h3>
                  {orders.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl">
                      <i className="fa-solid fa-receipt text-5xl text-gray-200 mb-4"></i>
                      <p className="text-gray-500 font-bold">No orders found.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map(o => (
                        <div key={o.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                          <div className="flex flex-col md:flex-row justify-between mb-4">
                            <div>
                              <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Order #{o.id}</span>
                              <h4 className="font-bold text-lg">{o.date}</h4>
                            </div>
                            <div className="mt-2 md:mt-0">
                              <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Status</label>
                              <select 
                                value={o.status} 
                                onChange={e => onUpdateOrder(o.id, e.target.value as Order['status'])} 
                                disabled={!isAdmin} 
                                className="px-4 py-2 rounded-xl border-2 border-gray-100 font-bold text-xs bg-white focus:border-teal-600 outline-none"
                              >
                                {['Pending', 'Confirmed', 'Shipped', 'Delivered'].map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-2xl flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                              <i className="fa-solid fa-location-dot text-teal-600"></i>
                              <p className="text-xs text-gray-500 truncate max-w-[200px] md:max-w-[400px]">{o.address}</p>
                            </div>
                            <p className="text-xl font-black text-teal-700">${o.total}</p>
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
