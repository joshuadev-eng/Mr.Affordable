
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const profileFileInputRef = useRef<HTMLInputElement>(null);
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
      isApproved: isAdmin, // Admins auto-approve their own stuff
      isDenied: false,
      createdAt: Date.now()
    };
    
    await onAddProduct(newProduct);
    setIsSubmitting(false);
    setProductData({ name: '', price: '', category: Category.Phones, description: '', images: [] });
    setActiveTab('my-products');
  };

  const getStatusBadge = (product: Product) => {
    if (product.isDenied) {
      return (
        <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
          <i className="fa-solid fa-circle-xmark text-[10px]"></i>
          <span className="text-[10px] font-black uppercase">Denied</span>
        </div>
      );
    }
    if (product.isApproved) {
      return (
        <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
          <i className="fa-solid fa-circle-check text-[10px]"></i>
          <span className="text-[10px] font-black uppercase">Active</span>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
        <i className="fa-solid fa-clock text-[10px] animate-pulse"></i>
        <span className="text-[10px] font-black uppercase">Pending</span>
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
              <div className="w-20 h-20 rounded-full bg-teal-100 mx-auto mb-4 border-2 border-white shadow-md overflow-hidden">
                {user.profilePic ? <img src={user.profilePic} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-teal-600">{user.name[0]}</div>}
              </div>
              <h2 className="font-black text-gray-900">{user.name}</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{user.role}</p>
            </div>
            
            <nav className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden font-bold text-sm">
              <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center space-x-4 px-6 py-4 ${activeTab === 'profile' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <i className="fa-solid fa-user-gear"></i><span>Settings</span>
              </button>
              <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center space-x-4 px-6 py-4 ${activeTab === 'orders' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <i className="fa-solid fa-receipt"></i><span>Orders</span>
              </button>
              <button onClick={() => setActiveTab('sell')} className={`w-full flex items-center space-x-4 px-6 py-4 ${activeTab === 'sell' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <i className="fa-solid fa-plus-circle"></i><span>New Listing</span>
              </button>
              <button onClick={() => setActiveTab('my-products')} className={`w-full flex items-center space-x-4 px-6 py-4 ${activeTab === 'my-products' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <i className="fa-solid fa-boxes-stacked"></i><span>{isAdmin ? 'Master Catalog' : 'My Items'}</span>
              </button>
              {isAdmin && (
                <button onClick={() => setActiveTab('admin')} className={`w-full flex items-center justify-between px-6 py-4 border-t ${activeTab === 'admin' ? 'bg-orange-600 text-white' : 'text-orange-600 hover:bg-orange-50'}`}>
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
                  {/* Admin Header Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                      <p className="text-[10px] font-black text-orange-400 uppercase">Pending</p>
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
                          <img src={p.image} className="w-full md:w-40 h-40 object-cover rounded-2xl" />
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
                        <img src={p.image} className="w-20 h-20 object-cover rounded-xl" />
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
                  <h3 className="text-3xl font-black mb-8">Add New Product</h3>
                  <form onSubmit={handleProductSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <input type="text" placeholder="Product Name" required value={productData.name} onChange={e => setProductData({...productData, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                      <input type="number" placeholder="Price (USD)" required value={productData.price} onChange={e => setProductData({...productData, price: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                    </div>
                    <select value={productData.category} onChange={e => setProductData({...productData, category: e.target.value as Category})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all">
                      {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <textarea placeholder="Description" rows={4} value={productData.description} onChange={e => setProductData({...productData, description: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all"></textarea>
                    
                    <div className="flex items-center gap-4">
                      <button type="button" onClick={() => multiProductFileInputRef.current?.click()} className="bg-gray-100 px-6 py-4 rounded-2xl font-bold text-gray-600 hover:bg-teal-50 hover:text-teal-600 transition-all">
                        <i className="fa-solid fa-camera mr-2"></i> Add Photos ({productData.images.length}/5)
                      </button>
                      <input type="file" ref={multiProductFileInputRef} multiple className="hidden" accept="image/*" onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        // Fix for line 305: Added explicit File type to prevent 'unknown' inference in readAsDataURL
                        files.forEach((f: any) => {
                          const r = new FileReader();
                          r.onloadend = () => setProductData(prev => ({...prev, images: [...prev.images, r.result as string].slice(0, 5)}));
                          r.readAsDataURL(f);
                        });
                      }} />
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full bg-teal-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-teal-700 transition-all">
                      {isSubmitting ? 'Uploading...' : 'List Product Now'}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="animate-fadeInUp">
                  <h3 className="text-3xl font-black mb-8">Order Management</h3>
                  <div className="space-y-6">
                    {orders.map(o => (
                      <div key={o.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between mb-4">
                          <div>
                            <span className="text-[10px] font-black text-teal-600 uppercase">Order #{o.id}</span>
                            <h4 className="font-bold text-lg">{o.date}</h4>
                          </div>
                          <select value={o.status} onChange={e => onUpdateOrder(o.id, e.target.value as Order['status'])} disabled={!isAdmin} className="mt-2 md:mt-0 px-4 py-2 rounded-full border-2 border-gray-100 font-bold text-xs">
                            {['Pending', 'Confirmed', 'Shipped', 'Delivered'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl flex justify-between items-center">
                          <p className="text-xs text-gray-500 truncate max-w-[300px]">{o.address}</p>
                          <p className="text-xl font-black text-teal-700">${o.total}</p>
                        </div>
                      </div>
                    ))}
                  </div>
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
