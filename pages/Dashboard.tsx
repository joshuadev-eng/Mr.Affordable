
import React, { useState, useRef, useMemo } from 'react';
import { User, Product, Category, Order } from '../types.ts';

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
  const [activeTab, setActiveTab] = useState<'profile' | 'sell' | 'my-products' | 'orders' | 'admin'>('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const editProductFileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user.role === 'admin';

  // Helper to get vendor info for admin portal
  const getVendorInfo = (userId?: string) => {
    if (!userId) return { name: 'Unknown', email: 'N/A' };
    const storedUsers: User[] = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const vendor = storedUsers.find(u => u.id === userId);
    return vendor ? { name: vendor.name, email: vendor.email } : { name: 'Deleted User', email: 'N/A' };
  };

  // For Admin Portal: All local products that are not yet approved
  const pendingQueue = useMemo(() => {
    return allLocalProducts.filter(p => !p.isApproved);
  }, [allLocalProducts]);

  // Products shown in "My Products" (Vendors see theirs, Admins see all local ones)
  const displayProducts = useMemo(() => {
    if (isAdmin) return allLocalProducts;
    return userProducts;
  }, [isAdmin, allLocalProducts, userProducts]);

  const [profileData, setProfileData] = useState({
    name: user.name,
    phone: user.phone,
    profilePic: user.profilePic || '',
    avatarFile: null as File | null
  });

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
    await new Promise(resolve => setTimeout(resolve, 600));
    const updatedUser: User = { ...user, name: profileData.name, phone: profileData.phone, profilePic: profileData.profilePic };
    const storedUsers: User[] = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const updatedUsers = storedUsers.map(u => u.id === user.id ? updatedUser : u);
    localStorage.setItem('registered_users', JSON.stringify(updatedUsers));
    onUpdateUser(updatedUser);
    setIsUpdating(false);
    alert('Profile updated successfully!');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'profile' | 'product' | 'edit') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (target === 'profile') setProfileData({ ...profileData, profilePic: base64, avatarFile: file });
        else if (target === 'product') setProductData({ ...productData, image: base64, imageFile: file });
        else if (target === 'edit' && editingProduct) setEditingProduct({ ...editingProduct, image: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productData.image) { alert('Please upload a product image.'); return; }
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const newProduct: Product = {
      id: `local-${Date.now()}`,
      name: productData.name,
      price: parseFloat(productData.price),
      category: productData.category,
      description: productData.description,
      image: productData.image,
      userId: user.id,
      isApproved: isAdmin, // Admins products are auto-approved
      createdAt: Date.now()
    };
    onAddProduct(newProduct);
    setIsSubmitting(false);
    alert(isAdmin ? 'Product published instantly!' : 'Product submitted! It is now in the queue for Admin review.');
    setProductData({ name: '', price: '', category: Category.Phones, description: '', image: '', imageFile: null });
    setActiveTab('my-products');
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    onUpdateProduct(editingProduct);
    setEditingProduct(null);
    alert('Product updated successfully!');
  };

  const handleDeleteAction = (productId: string, productName: string) => {
    const confirmed = window.confirm(`Permanently delete "${productName}"? This cannot be undone.`);
    if (confirmed) {
      onDeleteProduct(productId);
    }
  };

  const handleClearAllAction = () => {
    const confirmed = window.confirm('DANGER: This will PERMANENTLY DELETE every product listed on the website. This action cannot be reversed. Proceed?');
    if (confirmed && onClearAllProducts) {
      onClearAllProducts();
    }
  };

  const handleRejectAction = (productId: string, productName: string) => {
    const confirmed = window.confirm(`Are you sure you want to REJECT and PERMANENTLY DELETE "${productName}"? This action cannot be undone.`);
    if (confirmed) {
      onRejectProduct(productId);
    }
  };

  const getStatusBadge = (product: Product) => {
    if (product.isApproved) {
      return (
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 shadow-sm">
          <i className="fa-solid fa-circle-check text-green-600 text-[10px]"></i>
          <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Live On Site</span>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 shadow-sm">
        <i className="fa-solid fa-clock-rotate-left text-orange-600 text-[10px]"></i>
        <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Pending Review</span>
      </div>
    );
  };

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/4 space-y-4">
            <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100 text-center relative overflow-hidden">
              {isAdmin && <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>}
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-full bg-teal-100 overflow-hidden border-4 border-white shadow-md mx-auto">
                  {profileData.profilePic ? <img src={profileData.profilePic} alt={user.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-teal-600">{user.name.charAt(0)}</div>}
                </div>
                <button onClick={() => profileFileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-teal-600 text-white p-2 rounded-full shadow-lg hover:bg-teal-700 transition-all border-2 border-white"><i className="fa-solid fa-camera text-xs"></i></button>
                <input type="file" ref={profileFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'profile')} />
              </div>
              <h2 className="font-black text-gray-900 text-lg">{user.name}</h2>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-gray-100 rounded-full inline-block mt-1">{user.role}</p>
              {user.isVerified && (
                <div className="mt-2 flex items-center justify-center text-[10px] font-bold text-green-600 uppercase tracking-tighter">
                  <i className="fa-solid fa-circle-check mr-1"></i> Verified Merchant
                </div>
              )}
            </div>
            <nav className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center space-x-4 px-6 py-4 text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-teal-50 hover:text-teal-600'}`}><i className="fa-solid fa-user-gear"></i><span>Edit Profile</span></button>
              <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center space-x-4 px-6 py-4 text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-teal-50 hover:text-teal-600'}`}><i className="fa-solid fa-clock-rotate-left"></i><span>Order History</span></button>
              <button onClick={() => setActiveTab('sell')} className={`w-full flex items-center space-x-4 px-6 py-4 text-sm font-bold transition-all ${activeTab === 'sell' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-teal-50 hover:text-teal-600'}`}><i className="fa-solid fa-tag"></i><span>Sell a Product</span></button>
              <button onClick={() => setActiveTab('my-products')} className={`w-full flex items-center space-x-4 px-6 py-4 text-sm font-bold transition-all ${activeTab === 'my-products' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-teal-50 hover:text-teal-600'}`}><i className="fa-solid fa-boxes-stacked"></i><span>{isAdmin ? 'Full Catalog' : 'My Items'} ({displayProducts.length})</span></button>
              {isAdmin && (
                <button onClick={() => setActiveTab('admin')} className={`w-full flex items-center space-x-4 px-6 py-4 text-sm font-black transition-all border-t border-gray-50 ${activeTab === 'admin' ? 'bg-orange-600 text-white' : 'text-orange-600 hover:bg-orange-50'}`}><i className="fa-solid fa-shield-halved"></i><span>Approval Queue ({pendingQueue.length})</span></button>
              )}
            </nav>
          </div>
          <div className="w-full md:w-3/4">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 md:p-12 min-h-[500px]">
              {activeTab === 'profile' && (
                <div className="animate-fadeInUp">
                  <h3 className="text-2xl font-black mb-8">Profile Settings</h3>
                  <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-lg">
                    <div className="space-y-2"><label className="text-sm font-bold text-gray-700 ml-1">Full Name</label><input type="text" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" /></div>
                    <div className="space-y-2"><label className="text-sm font-bold text-gray-700 ml-1">Phone Number</label><input type="tel" value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" /></div>
                    <div className="space-y-2"><label className="text-sm font-bold text-gray-700 ml-1">Email (Read-only)</label><input type="email" readOnly value={user.email} className="w-full px-5 py-4 bg-gray-100 border-2 border-transparent rounded-2xl text-gray-500 cursor-not-allowed" /></div>
                    <button type="submit" disabled={isUpdating} className="bg-teal-600 hover:bg-teal-700 text-white font-black px-10 py-4 rounded-2xl shadow-xl transition-all active:scale-95 disabled:bg-gray-400">{isUpdating ? 'Updating...' : 'Save Changes'}</button>
                  </form>
                </div>
              )}
              {activeTab === 'orders' && (
                <div className="animate-fadeInUp">
                  <h3 className="text-2xl font-black mb-8">Order History</h3>
                  {orders.length === 0 ? <div className="text-center py-20"><i className="fa-solid fa-receipt text-6xl text-gray-100 mb-4"></i><p className="text-gray-500 font-medium">No orders found.</p></div> : (
                    <div className="space-y-6">
                      {orders.map(order => (
                        <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                          <div className="bg-gray-50 px-6 py-4 flex flex-wrap justify-between items-center gap-4 border-b border-gray-100"><div className="flex gap-6"><div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order ID</p><p className="text-sm font-bold text-gray-700">#{order.id.slice(-8).toUpperCase()}</p></div><div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p><p className="text-sm font-bold text-gray-700">{order.date}</p></div><div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Amount</p><p className="text-sm font-bold text-teal-600">${order.total.toLocaleString()}</p></div></div><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{order.status}</span></div>
                          <div className="p-6"><div className="flex flex-wrap gap-4 mb-6">{order.items.map((item, idx) => (<div key={idx} className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100 min-w-[200px]"><img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg" /><div className="flex-grow"><p className="text-xs font-bold text-gray-800 line-clamp-1">{item.name}</p><p className="text-[10px] text-gray-500">Qty: {item.quantity}</p></div></div>))}</div><div className="mt-4 pt-4 border-t border-gray-50"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Shipping Address</p><p className="text-xs text-gray-600 leading-relaxed italic">{order.address}</p></div></div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><label className="text-sm font-bold text-gray-700 ml-1">Product Name</label><input type="text" required value={productData.name} onChange={(e) => setProductData({...productData, name: e.target.value})} placeholder="e.g. Brand New Solar Panel" className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" /></div><div className="space-y-2"><label className="text-sm font-bold text-gray-700 ml-1">Price ($)</label><input type="number" required value={productData.price} onChange={(e) => setProductData({...productData, price: e.target.value})} placeholder="0.00" className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" /></div></div>
                    <div className="space-y-2"><label className="text-sm font-bold text-gray-700 ml-1">Category</label><select value={productData.category} onChange={(e) => setProductData({...productData, category: e.target.value as Category})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all">{Object.values(Category).map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
                    <div className="space-y-2"><label className="text-sm font-bold text-gray-700 ml-1">Product Description</label><textarea required value={productData.description} onChange={(e) => setProductData({...productData, description: e.target.value})} rows={4} placeholder="Tell buyers more about what you are selling..." className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all"></textarea></div>
                    <div className="space-y-2"><label className="text-sm font-bold text-gray-700 ml-1">Product Image</label><div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl p-8 bg-gray-50 transition-colors hover:bg-teal-50">{productData.image ? <div className="relative group"><img src={productData.image} alt="Preview" className="h-48 rounded-xl object-cover" /><button type="button" onClick={() => setProductData({...productData, image: '', imageFile: null})} className="absolute -top-3 -right-3 bg-red-500 text-white w-8 h-8 rounded-full shadow-lg"><i className="fa-solid fa-xmark"></i></button></div> : <label className="cursor-pointer text-center"><i className="fa-solid fa-cloud-arrow-up text-4xl text-teal-400 mb-2"></i><p className="text-gray-500 text-sm">Click to upload product image</p><input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'product')} /></label>}</div></div>
                    <button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700 text-white font-black px-12 py-5 rounded-2xl shadow-xl transition-all active:scale-95 disabled:bg-gray-400">{isSubmitting ? <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> : (isAdmin ? 'Publish Product Instantly' : 'Submit for Review')}</button>
                  </form>
                </div>
              )}
              {activeTab === 'my-products' && (
                <div className="animate-fadeInUp">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black">{isAdmin ? 'Master Catalog' : 'My Listings'}</h3>
                    {isAdmin && displayProducts.length > 0 && (
                      <button 
                        onClick={handleClearAllAction}
                        className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 border border-red-100"
                      >
                        <i className="fa-solid fa-broom"></i>
                        Wipe Catalog
                      </button>
                    )}
                  </div>
                  {displayProducts.length === 0 ? <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200"><i className="fa-solid fa-box-open text-6xl text-gray-200 mb-4"></i><p className="text-gray-500 font-medium">Your catalog is empty.</p></div> : (
                    <div className="grid grid-cols-1 gap-6">
                      {displayProducts.map(p => (
                        <div key={p.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row items-center p-6 gap-6">
                            <img src={p.image} alt={p.name} className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-2xl shadow-sm" />
                            <div className="flex-grow text-center sm:text-left">
                              <h4 className="font-black text-gray-900 text-xl mb-1">{p.name}</h4>
                              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mb-2">
                                <p className="text-teal-600 font-black text-2xl">${p.price.toLocaleString()}</p>
                                {getStatusBadge(p)}
                              </div>
                              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{p.category}</p>
                            </div>
                            <div className="flex sm:flex-col gap-3">
                              <button 
                                onClick={() => setEditingProduct(p)}
                                className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white transition-all shadow-sm flex items-center justify-center"
                                title="Edit Item"
                              >
                                <i className="fa-solid fa-pen-to-square"></i>
                              </button>
                              <button 
                                onClick={() => handleDeleteAction(p.id, p.name)}
                                className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center justify-center"
                                title="Delete Item"
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'admin' && isAdmin && (
                <div className="animate-fadeInUp">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-orange-600">Merchant Approval Queue</h3>
                        <p className="text-gray-500 text-xs font-medium">Review pending submissions from vendors across Liberia.</p>
                    </div>
                    <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest">{pendingQueue.length} Pending</span>
                  </div>
                  {pendingQueue.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                      <i className="fa-solid fa-clipboard-check text-6xl text-green-200 mb-4"></i>
                      <p className="text-gray-500 font-bold">Inbox clear. No new items to review.</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {pendingQueue.map(p => {
                        const vendor = getVendorInfo(p.userId);
                        return (
                          <div key={p.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden animate-slideInRight">
                            <div className="flex flex-col lg:flex-row">
                                <div className="w-full lg:w-[350px] bg-gray-100 h-80 lg:h-auto shrink-0 relative">
                                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                    <div className="absolute top-4 left-4 bg-orange-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg uppercase tracking-widest">
                                       Review Required
                                    </div>
                                </div>
                                <div className="w-full p-8 lg:p-10 flex flex-col">
                                    <div className="flex flex-wrap items-start justify-between gap-6 mb-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full uppercase tracking-widest">{p.category}</span>
                                                <span className="text-[10px] text-gray-400 font-bold">ID: {p.id.slice(-6)}</span>
                                            </div>
                                            <h4 className="font-black text-gray-900 text-3xl tracking-tight">{p.name}</h4>
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <i className="fa-solid fa-calendar-day text-xs"></i>
                                                <p className="text-[10px] font-black uppercase tracking-widest">
                                                  Submitted: {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-teal-50 border border-teal-100 rounded-2xl px-6 py-3">
                                            <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest text-center mb-1">Asking Price</p>
                                            <p className="text-teal-700 font-black text-3xl">${p.price.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/50 rounded-2xl p-6 mb-8 border border-gray-100">
                                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Merchant Description</h5>
                                        <p className="text-sm text-gray-700 leading-relaxed italic line-clamp-4">"{p.description}"</p>
                                    </div>

                                    <div className="mt-auto pt-8 border-t border-gray-100">
                                      <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                                          <div className="flex items-center gap-4">
                                              <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center text-white font-black text-xl shadow-lg">
                                                  {vendor.name.charAt(0)}
                                              </div>
                                              <div>
                                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Submitted By</p>
                                                  <p className="text-lg font-black text-gray-900">{vendor.name}</p>
                                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                                      <i className="fa-solid fa-envelope text-[10px]"></i>
                                                      <span>{vendor.email}</span>
                                                  </div>
                                              </div>
                                          </div>
                                          
                                          <div className="flex gap-4 w-full sm:w-auto">
                                              <button 
                                                  onClick={() => onToggleApproval(p.id)}
                                                  className="flex-1 sm:flex-none bg-teal-600 hover:bg-teal-700 text-white font-black px-10 py-5 rounded-2xl shadow-xl transition-all active:scale-95 text-sm flex items-center justify-center gap-3"
                                              >
                                                  <i className="fa-solid fa-check-double text-lg"></i>
                                                  <span>Approve & Go Live</span>
                                              </button>
                                              <button 
                                                  onClick={() => handleRejectAction(p.id, p.name)}
                                                  className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100"
                                                  title="Reject & Delete"
                                              >
                                                  <i className="fa-solid fa-trash-can text-lg"></i>
                                              </button>
                                          </div>
                                      </div>
                                    </div>
                                </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingProduct(null)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-fadeInUp flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-teal-600 text-white">
              <h3 className="text-2xl font-black">Edit Listing</h3>
              <button onClick={() => setEditingProduct(null)} className="w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-all"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="p-8 overflow-y-auto flex-grow">
              <form onSubmit={handleEditSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Title</label>
                      <input type="text" required value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Price ($)</label>
                      <input type="number" required value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                      <select value={editingProduct.category} onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value as Category})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all">
                        {Object.values(Category).map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Image Source</label>
                      <div className="relative h-64 bg-gray-50 rounded-3xl overflow-hidden border-2 border-dashed border-gray-200 group">
                        <img src={editingProduct.image} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => editProductFileInputRef.current?.click()} className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all">
                          <i className="fa-solid fa-cloud-arrow-up text-3xl mb-2"></i>
                          <span className="font-bold text-sm">Change Image</span>
                        </button>
                        <input type="file" ref={editProductFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'edit')} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Description</label>
                  <textarea rows={4} required value={editingProduct.description} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all"></textarea>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-grow bg-teal-600 hover:bg-teal-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95">Update Listing</button>
                  <button type="button" onClick={() => setEditingProduct(null)} className="px-10 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-5 rounded-2xl transition-all">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
