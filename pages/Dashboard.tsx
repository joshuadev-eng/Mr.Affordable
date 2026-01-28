
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
  onToggleApproval: (productId: string) => void;
  onRejectProduct: (productId: string) => void;
  allLocalProducts: Product[]; 
  onAddOrder?: (order: Order) => void;
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
  onToggleApproval, 
  onRejectProduct,
  allLocalProducts,
  onAddOrder
}) => {
  const isAdmin = user.role === 'admin';
  const [activeTab, setActiveTab] = useState<'profile' | 'sell' | 'my-products' | 'orders' | 'admin'>(
    isAdmin ? 'admin' : 'profile'
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  
  const multiProductFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Manual Order Form State
  const [orderFormData, setOrderFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    selectedProductId: '',
    quantity: 1
  });

  // Profile editing state
  const [profileData, setProfileData] = useState({
    name: user.name,
    phone: user.phone,
  });

  const [productData, setProductData] = useState({
    name: '',
    price: '',
    category: Category.Phones,
    description: '',
    images: [] as string[]
  });

  // Edit product state
  const [editData, setEditData] = useState({
    name: '',
    price: '',
    category: Category.Phones as string,
    description: '',
    images: [] as string[]
  });

  // Admin Review Queue
  const pendingQueue = useMemo(() => {
    return allLocalProducts.filter(p => !p.isApproved && !p.isDenied);
  }, [allLocalProducts]);

  const displayOrders = useMemo(() => {
    if (isAdmin) return orders;
    return orders.filter(o => o.userId === user.id);
  }, [orders, isAdmin, user.id]);

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (productData.images.length === 0) return alert('Add at least one photo.');
    if (productData.images.length > 5) return alert('Maximum 5 images allowed.');
    
    setIsSubmitting(true);
    const newProduct: Product = {
      id: 'prod-' + Date.now(),
      name: productData.name,
      price: parseFloat(productData.price),
      category: productData.category,
      description: productData.description,
      image: productData.images[0],
      images: productData.images,
      userId: user.id,
      isApproved: false, 
      createdAt: Date.now()
    };
    
    onAddProduct(newProduct);
    setIsSubmitting(false);
    setProductData({ name: '', price: '', category: Category.Phones, description: '', images: [] });
    setActiveTab('my-products');
  };

  const handleManualOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddOrder) return;
    
    const selectedProduct = userProducts.find(p => p.id === orderFormData.selectedProductId);
    if (!selectedProduct) return alert('Please select a product.');

    const subtotal = selectedProduct.price * orderFormData.quantity;
    const deliveryFee = subtotal >= 1000 ? 0 : 15;
    
    const newOrder: Order = {
      id: `man-${Date.now()}`,
      userId: user.id,
      date: new Date().toLocaleDateString(),
      items: [{ ...selectedProduct, quantity: orderFormData.quantity }],
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      status: 'Confirmed',
      address: `(Manual Order) Name: ${orderFormData.customerName}, Phone: ${orderFormData.customerPhone}, Address: ${orderFormData.customerAddress}`
    };

    onAddOrder(newOrder);
    setIsAddingOrder(false);
    setOrderFormData({
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      selectedProductId: '',
      quantity: 1
    });
    alert('Manual order recorded successfully!');
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditData({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      description: product.description,
      images: product.images || [product.image]
    });
    setIsEditingProduct(true);
  };

  const handleUpdateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (editData.images.length > 5) return alert('Maximum 5 images allowed.');
    
    const updatedProduct: Product = {
      ...editingProduct,
      name: editData.name,
      price: parseFloat(editData.price),
      category: editData.category,
      description: editData.description,
      image: editData.images[0],
      images: editData.images,
    };

    onUpdateProduct(updatedProduct);
    setIsEditingProduct(false);
    setEditingProduct(null);
    alert('Product updated successfully!');
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.id === 'master-admin-001') {
      const updatedUser = { ...user, name: profileData.name, phone: profileData.phone };
      onUpdateUser(updatedUser);
      alert('Local profile updated!');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { 
          full_name: profileData.name,
          phone: profileData.phone
        }
      });
      if (error) throw error;
      if (data.user) {
        const updatedUser: User = { ...user, name: profileData.name, phone: profileData.phone };
        onUpdateUser(updatedUser);
        alert('Profile updated successfully!');
      }
    } catch (err: any) {
      alert('Update failed: ' + err.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const getStatusBadge = (product: Product) => {
    if (product.isDenied) return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-red-100 text-red-700">Rejected</span>;
    if (product.isApproved) return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-green-100 text-green-700">Approved</span>;
    return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-700">Pending</span>;
  };

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-1/4 space-y-4">
            <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100 text-center">
              <div className="w-16 h-16 rounded-full bg-teal-100 mx-auto mb-4 flex items-center justify-center font-black text-teal-600 uppercase text-xl">
                {user.name[0]}
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
                <i className="fa-solid fa-plus-circle"></i><span>Add Product</span>
              </button>
              <button onClick={() => setActiveTab('my-products')} className={`w-full flex items-center space-x-4 px-6 py-4 transition-colors ${activeTab === 'my-products' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <i className="fa-solid fa-boxes-stacked"></i><span>{isAdmin ? 'Master Catalog' : 'My Items'}</span>
              </button>
              {isAdmin && (
                <button onClick={() => setActiveTab('admin')} className={`w-full flex items-center justify-between px-6 py-4 border-t transition-colors ${activeTab === 'admin' ? 'bg-orange-600 text-white' : 'text-orange-600 hover:bg-orange-50'}`}>
                  <div className="flex items-center space-x-4"><i className="fa-solid fa-shield-halved"></i><span>Admin Review</span></div>
                  {pendingQueue.length > 0 && <span className="bg-white text-orange-600 px-2 py-0.5 rounded-full text-[10px]">{pendingQueue.length}</span>}
                </button>
              )}
            </nav>
          </div>

          <div className="w-full md:w-3/4">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 min-h-[500px]">
              {activeTab === 'profile' && (
                <div className="animate-fadeInUp">
                  <h3 className="text-2xl font-black mb-8">Account Settings</h3>
                  <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                        <input type="text" required value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">WhatsApp Number</label>
                        <input type="tel" required value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Email (Read-Only)</label>
                      <input type="email" disabled value={user.email} className="w-full px-5 py-4 bg-gray-100 border-2 border-transparent rounded-2xl text-gray-400 cursor-not-allowed outline-none" />
                    </div>
                    <button type="submit" disabled={isUpdatingProfile} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 disabled:bg-teal-400 flex items-center justify-center space-x-3">
                      {isUpdatingProfile ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <><i className="fa-solid fa-floppy-disk"></i><span>Save Settings</span></>}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'my-products' && (
                <div className="animate-fadeInUp">
                  <h3 className="text-2xl font-black mb-8">{isAdmin ? 'Master Catalog' : 'My Items'}</h3>
                  <div className="space-y-4">
                    {userProducts.length === 0 ? (
                      <p className="text-center py-20 text-gray-400 font-bold">No products found.</p>
                    ) : (
                      userProducts.map(p => (
                        <div key={p.id} className="bg-white border border-gray-100 rounded-3xl p-4 flex items-center gap-4 hover:shadow-md transition-all">
                          <img src={p.image} className="w-16 h-16 object-cover rounded-xl" alt={p.name} />
                          <div className="flex-grow">
                            <h4 className="font-bold text-gray-900 line-clamp-1">{p.name}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="font-black text-teal-700">${p.price}</span>
                              {getStatusBadge(p)}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleOpenEditModal(p)} 
                              className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white flex items-center justify-center transition-all"
                              title="Edit Product"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button onClick={() => onDeleteProduct(p.id)} className="w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all"><i className="fa-solid fa-trash"></i></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'sell' && (
                <div className="animate-fadeInUp">
                  <h3 className="text-2xl font-black mb-8">Post New Listing</h3>
                  <form onSubmit={handleProductSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Product Name</label>
                        <input type="text" required value={productData.name} onChange={e => setProductData({...productData, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Price (USD)</label>
                        <input type="number" required value={productData.price} onChange={e => setProductData({...productData, price: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Category</label>
                      <select value={productData.category} onChange={e => setProductData({...productData, category: e.target.value as Category})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all">
                        {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Description</label>
                      <textarea required value={productData.description} onChange={e => setProductData({...productData, description: e.target.value})} rows={4} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all"></textarea>
                    </div>
                    <div className="space-y-4">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Product Images (Max 5)</label>
                      <div className="flex flex-wrap gap-4">
                        {productData.images.map((img, idx) => (
                          <div key={idx} className="w-20 h-20 relative rounded-xl overflow-hidden border">
                            <img src={img} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setProductData(prev => ({...prev, images: prev.images.filter((_, i) => i !== idx)}))} className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center"><i className="fa-solid fa-xmark text-[10px]"></i></button>
                          </div>
                        ))}
                        {productData.images.length < 5 && (
                          <button type="button" onClick={() => multiProductFileInputRef.current?.click()} className="w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center text-gray-300 hover:text-teal-600 hover:border-teal-600"><i className="fa-solid fa-camera"></i></button>
                        )}
                      </div>
                      <input type="file" ref={multiProductFileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const r = new FileReader();
                          r.onloadend = () => setProductData(prev => ({...prev, images: [...prev.images, r.result as string].slice(0, 5)}));
                          r.readAsDataURL(file);
                        }
                      }} />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-teal-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-teal-700 transition-all">
                      {isSubmitting ? 'Submitting...' : 'Save & Submit Listing'}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'admin' && isAdmin && (
                <div className="animate-fadeInUp">
                  <h3 className="text-2xl font-black mb-8">Admin Review Queue</h3>
                  {pendingQueue.length === 0 ? (
                    <p className="text-gray-400 py-20 text-center font-bold">No items waiting for review.</p>
                  ) : (
                    <div className="space-y-6">
                      {pendingQueue.map(p => (
                        <div key={p.id} className="bg-gray-50 rounded-3xl p-6 flex flex-col md:flex-row gap-6 border border-gray-100">
                          <img src={p.image} className="w-32 h-32 object-cover rounded-2xl" alt={p.name} />
                          <div className="flex-grow">
                            <h4 className="text-xl font-black">{p.name}</h4>
                            <p className="text-teal-600 font-black mb-4">${p.price}</p>
                            <div className="flex gap-4">
                              <button onClick={() => onToggleApproval(p.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl transition-all">Approve</button>
                              <button onClick={() => onRejectProduct(p.id)} className="px-6 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all">Reject</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="animate-fadeInUp">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black">Sales & Orders</h3>
                    <button 
                      onClick={() => setIsAddingOrder(true)}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all flex items-center space-x-2 shadow-md"
                    >
                      <i className="fa-solid fa-plus-circle"></i>
                      <span>Add Manual Order</span>
                    </button>
                  </div>
                  
                  {displayOrders.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed">
                      <i className="fa-solid fa-receipt text-5xl text-gray-200 mb-4"></i>
                      <p className="text-gray-400 font-bold">No orders recorded yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {displayOrders.map(order => (
                        <div key={order.id} className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-lg transition-all">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-50">
                            <div>
                              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{order.id}</p>
                              <p className="font-bold text-gray-900">{order.date}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-50 text-teal-700`}>
                                {order.status}
                              </span>
                              <span className="text-xl font-black text-teal-700">${order.total.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Customer Info</p>
                              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{order.address}</p>
                            </div>
                            <div className="flex justify-end items-end">
                              <select 
                                value={order.status} 
                                onChange={(e) => onUpdateOrder(order.id, e.target.value as Order['status'])}
                                className="bg-gray-50 border-none rounded-xl px-4 py-2 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-teal-600"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                              </select>
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

      {/* Manual Order Modal */}
      {isAddingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddingOrder(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 md:p-12 animate-fadeInUp">
            <button onClick={() => setIsAddingOrder(false)} className="absolute top-6 right-6 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all"><i className="fa-solid fa-xmark"></i></button>
            <h3 className="text-2xl font-black mb-8">Record Manual Order</h3>
            <form onSubmit={handleManualOrderSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Customer Name</label>
                  <input type="text" required value={orderFormData.customerName} onChange={e => setOrderFormData({...orderFormData, customerName: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Customer Phone</label>
                  <input type="tel" required value={orderFormData.customerPhone} onChange={e => setOrderFormData({...orderFormData, customerPhone: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Product</label>
                <select required value={orderFormData.selectedProductId} onChange={e => setOrderFormData({...orderFormData, selectedProductId: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all">
                  <option value="">-- Select Product --</option>
                  {userProducts.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Quantity</label>
                <input type="number" min="1" required value={orderFormData.quantity} onChange={e => setOrderFormData({...orderFormData, quantity: parseInt(e.target.value)})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Delivery Address</label>
                <textarea required value={orderFormData.customerAddress} onChange={e => setOrderFormData({...orderFormData, customerAddress: e.target.value})} rows={3} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all"></textarea>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsAddingOrder(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-4 rounded-2xl">Cancel</button>
                <button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-black py-4 rounded-2xl shadow-xl">Record Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditingProduct(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 md:p-12 animate-fadeInUp">
            <button onClick={() => setIsEditingProduct(false)} className="absolute top-6 right-6 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all"><i className="fa-solid fa-xmark"></i></button>
            <h3 className="text-2xl font-black mb-8">Edit Product Details</h3>
            <form onSubmit={handleUpdateProductSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Product Name</label>
                  <input type="text" required value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Price (USD)</label>
                  <input type="number" required value={editData.price} onChange={e => setEditData({...editData, price: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Category</label>
                <select value={editData.category} onChange={e => setEditData({...editData, category: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all">
                  {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Description</label>
                <textarea required value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} rows={4} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all"></textarea>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Product Images (Max 5)</label>
                <div className="flex flex-wrap gap-4">
                  {editData.images.map((img, idx) => (
                    <div key={idx} className="w-20 h-20 relative rounded-xl overflow-hidden border">
                      <img src={img} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setEditData(prev => ({...prev, images: prev.images.filter((_, i) => i !== idx)}))} className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center"><i className="fa-solid fa-xmark text-[10px]"></i></button>
                    </div>
                  ))}
                  {editData.images.length < 5 && (
                    <button type="button" onClick={() => editFileInputRef.current?.click()} className="w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center text-gray-300 hover:text-teal-600 hover:border-teal-600"><i className="fa-solid fa-camera"></i></button>
                  )}
                </div>
                <input type="file" ref={editFileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const r = new FileReader();
                      r.onloadend = () => setEditData(prev => ({...prev, images: [...prev.images, r.result as string].slice(0, 5)}));
                      r.readAsDataURL(file);
                    }
                  }} />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsEditingProduct(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-4 rounded-2xl">Cancel</button>
                <button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-black py-4 rounded-2xl shadow-xl">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
