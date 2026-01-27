
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
  const multiProductFileInputRef = useRef<HTMLInputElement>(null);
  const editProductFileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user.role === 'admin';

  const getVendorInfo = (userId?: string) => {
    if (!userId) return { name: 'System', email: 'N/A' };
    const storedUsers: User[] = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const vendor = storedUsers.find(u => u.id === userId);
    return vendor ? { name: vendor.name, email: vendor.email } : { name: 'Unknown Vendor', email: 'N/A' };
  };

  const pendingQueue = useMemo(() => {
    return allLocalProducts.filter(p => p.isApproved === false);
  }, [allLocalProducts]);

  const displayProducts = useMemo(() => {
    if (isAdmin) return allLocalProducts;
    return userProducts;
  }, [isAdmin, allLocalProducts, userProducts]);

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

  const handleSingleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'profile' | 'edit') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (target === 'profile') setProfileData({ ...profileData, profilePic: base64 });
        else if (target === 'edit' && editingProduct) {
          const newImages = editingProduct.images ? [...editingProduct.images] : [editingProduct.image];
          newImages.push(base64);
          setEditingProduct({ ...editingProduct, image: editingProduct.image || base64, images: newImages });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMultiImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + productData.images.length > 5) {
      alert('Maximum 5 images allowed per product.');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProductData(prev => ({ ...prev, images: [...prev.images, base64] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImageFromUpload = (index: number) => {
    setProductData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (productData.images.length === 0) { alert('Please upload at least one product image.'); return; }
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newProduct: Product = {
      id: `local-${Date.now()}`,
      name: productData.name,
      price: parseFloat(productData.price),
      category: productData.category,
      description: productData.description,
      image: productData.images[0], // Use first as main
      images: productData.images,
      userId: user.id,
      isApproved: isAdmin,
      createdAt: Date.now()
    };
    
    onAddProduct(newProduct);
    setIsSubmitting(false);
    alert(isAdmin ? 'Product published instantly!' : 'Product submitted! It will appear in the shop after Admin approval.');
    setProductData({ name: '', price: '', category: Category.Phones, description: '', images: [] });
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
    if (window.confirm(`Permanently delete "${productName}"?`)) {
      onDeleteProduct(productId);
    }
  };

  const handleClearAllAction = () => {
    if (window.confirm('DANGER: This will PERMANENTLY DELETE every product listed on the website. Proceed?')) {
      onClearAllProducts?.();
    }
  };

  const handleRejectAction = (productId: string, productName: string) => {
    if (window.confirm(`Reject and delete "${productName}" submission?`)) {
      onRejectProduct(productId);
    }
  };

  const getStatusBadge = (product: Product) => {
    if (product.isApproved) {
      return <div className="px-3 py-1 rounded-full bg-green-50 border border-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><i className="fa-solid fa-circle-check"></i> Live</div>;
    }
    return <div className="px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse"><i className="fa-solid fa-clock-rotate-left"></i> Pending</div>;
  };

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-1/4 space-y-4">
            <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100 text-center relative overflow-hidden">
              {isAdmin && <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>}
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-full bg-teal-100 overflow-hidden border-4 border-white shadow-md mx-auto">
                  {profileData.profilePic ? <img src={profileData.profilePic} alt={user.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-teal-600">{user.name.charAt(0)}</div>}
                </div>
                <button onClick={() => profileFileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-teal-600 text-white p-2 rounded-full shadow-lg hover:bg-teal-700 transition-all border-2 border-white"><i className="fa-solid fa-camera text-xs"></i></button>
                <input type="file" ref={profileFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleSingleImageUpload(e, 'profile')} />
              </div>
              <h2 className="font-black text-gray-900 text-lg">{user.name}</h2>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-gray-100 rounded-full inline-block mt-1">{user.role}</p>
            </div>
            
            <nav className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center space-x-4 px-6 py-4 text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-teal-50 hover:text-teal-600'}`}><i className="fa-solid fa-user-gear"></i><span>Profile</span></button>
              <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center space-x-4 px-6 py-4 text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-teal-50 hover:text-teal-600'}`}><i className="fa-solid fa-clock-rotate-left"></i><span>Orders</span></button>
              <button onClick={() => setActiveTab('sell')} className={`w-full flex items-center space-x-4 px-6 py-4 text-sm font-bold transition-all ${activeTab === 'sell' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-teal-50 hover:text-teal-600'}`}><i className="fa-solid fa-tag"></i><span>Add Product</span></button>
              <button onClick={() => setActiveTab('my-products')} className={`w-full flex items-center space-x-4 px-6 py-4 text-sm font-bold transition-all ${activeTab === 'my-products' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-teal-50 hover:text-teal-600'}`}><i className="fa-solid fa-boxes-stacked"></i><span>{isAdmin ? 'Catalog' : 'My Items'} ({displayProducts.length})</span></button>
              {isAdmin && (
                <button onClick={() => setActiveTab('admin')} className={`w-full flex items-center space-x-4 px-6 py-4 text-sm font-black transition-all border-t border-gray-50 ${activeTab === 'admin' ? 'bg-orange-600 text-white' : 'text-orange-600 hover:bg-orange-50'}`}><i className="fa-solid fa-shield-halved"></i><span>Review Items ({pendingQueue.length})</span></button>
              )}
            </nav>
          </div>

          {/* Content Area */}
          <div className="w-full md:w-3/4">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 md:p-12 min-h-[500px]">
              {activeTab === 'profile' && (
                <div className="animate-fadeInUp">
                  <h3 className="text-2xl font-black mb-8">Account Details</h3>
                  <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-lg">
                    <div className="space-y-2"><label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label><input type="text" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" /></div>
                    <div className="space-y-2"><label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp Phone</label><input type="tel" value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" /></div>
                    <button type="submit" disabled={isUpdating} className="bg-teal-600 hover:bg-teal-700 text-white font-black px-10 py-4 rounded-2xl shadow-xl transition-all">{isUpdating ? 'Saving...' : 'Save Profile'}</button>
                  </form>
                </div>
              )}

              {activeTab === 'sell' && (
                <div className="animate-fadeInUp">
                  <h3 className="text-2xl font-black mb-8">List New Product</h3>
                  <form onSubmit={handleProductSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Product Title</label>
                        <input type="text" required value={productData.name} onChange={(e) => setProductData({...productData, name: e.target.value})} placeholder="e.g. iPhone 15 Pro Max" className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Price ($)</label>
                        <input type="number" required value={productData.price} onChange={(e) => setProductData({...productData, price: e.target.value})} placeholder="0.00" className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                      <select value={productData.category} onChange={(e) => setProductData({...productData, category: e.target.value as Category})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all">
                        {Object.values(Category).map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Detailed Description</label>
                      <textarea required value={productData.description} onChange={(e) => setProductData({...productData, description: e.target.value})} rows={4} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" placeholder="Describe features, condition, warranty etc."></textarea>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Product Images (Up to 5)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {productData.images.map((img, index) => (
                          <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 group">
                            <img src={img} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeImageFromUpload(index)} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"><i className="fa-solid fa-xmark text-[10px]"></i></button>
                            {index === 0 && <div className="absolute bottom-0 left-0 right-0 bg-teal-600 text-white text-[8px] font-black uppercase tracking-tighter text-center py-1">Featured</div>}
                          </div>
                        ))}
                        {productData.images.length < 5 && (
                          <button 
                            type="button" 
                            onClick={() => multiProductFileInputRef.current?.click()}
                            className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center bg-gray-50 hover:bg-teal-50 hover:border-teal-200 transition-all text-gray-400 hover:text-teal-600"
                          >
                            <i className="fa-solid fa-plus text-2xl mb-1"></i>
                            <span className="text-[10px] font-black uppercase">Add Photo</span>
                          </button>
                        )}
                      </div>
                      <input type="file" ref={multiProductFileInputRef} multiple className="hidden" accept="image/*" onChange={handleMultiImageUpload} />
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3">
                      {isSubmitting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}
                      {isAdmin ? 'Publish Product' : 'Submit for Review'}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'my-products' && (
                <div className="animate-fadeInUp">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black">All Listings</h3>
                    {isAdmin && <button onClick={handleClearAllAction} className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 tracking-widest"><i className="fa-solid fa-trash-arrow-up mr-1"></i> Wipe Site Catalog</button>}
                  </div>
                  {displayProducts.length === 0 ? <div className="text-center py-20"><i className="fa-solid fa-box-open text-5xl text-gray-200 mb-4"></i><p className="text-gray-500">No items found.</p></div> : (
                    <div className="space-y-4">
                      {displayProducts.map(p => (
                        <div key={p.id} className="bg-white border border-gray-100 rounded-3xl p-4 flex flex-col sm:flex-row items-center gap-6 group hover:shadow-md transition-shadow">
                          <img src={p.image} className="w-20 h-20 object-cover rounded-xl shadow-sm" />
                          <div className="flex-grow text-center sm:text-left">
                            <h4 className="font-bold text-gray-900 line-clamp-1">{p.name}</h4>
                            <div className="flex items-center justify-center sm:justify-start gap-3 mt-1">
                              <span className="text-teal-600 font-black">${p.price.toLocaleString()}</span>
                              {getStatusBadge(p)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingProduct(p)} className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center hover:bg-teal-600 hover:text-white transition-all"><i className="fa-solid fa-pencil"></i></button>
                            <button onClick={() => handleDeleteAction(p.id, p.name)} className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><i className="fa-solid fa-trash"></i></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'admin' && isAdmin && (
                <div className="animate-fadeInUp">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-3xl font-black text-orange-600">Review Queue</h3>
                    <div className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-xs font-black uppercase tracking-widest">{pendingQueue.length} Pending</div>
                  </div>
                  
                  {pendingQueue.length === 0 ? (
                    <div className="text-center py-24 bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100">
                      <i className="fa-solid fa-check-circle text-6xl text-green-200 mb-6"></i>
                      <p className="text-gray-400 font-bold">All caught up! No new submissions.</p>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      {pendingQueue.map(p => {
                        const vendor = getVendorInfo(p.userId);
                        return (
                          <div key={p.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden animate-slideInRight">
                            <div className="flex flex-col lg:flex-row">
                              {/* Admin Image Review */}
                              <div className="w-full lg:w-1/3 p-6 bg-gray-50">
                                <div className="grid grid-cols-2 gap-2">
                                  {p.images?.map((img, idx) => (
                                    <div key={idx} className={`${idx === 0 ? 'col-span-2' : ''} rounded-2xl overflow-hidden border border-gray-200 aspect-square`}>
                                      <img src={img} className="w-full h-full object-cover" />
                                    </div>
                                  )) || <img src={p.image} className="w-full h-full object-cover rounded-2xl" />}
                                </div>
                              </div>
                              
                              {/* Admin Details Review */}
                              <div className="w-full lg:w-2/3 p-8 lg:p-10 flex flex-col">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="px-3 py-1 bg-teal-50 text-teal-700 text-[10px] font-black rounded-full uppercase">{p.category}</span>
                                  <span className="text-[10px] font-bold text-gray-400">ID: {p.id.slice(-6)}</span>
                                </div>
                                <h4 className="text-3xl font-black text-gray-900 mb-4">{p.name}</h4>
                                <div className="bg-gray-100 p-6 rounded-2xl mb-8">
                                  <p className="text-sm text-gray-700 italic leading-relaxed">"{p.description}"</p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-gray-100 pt-8 mt-auto">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-white font-black text-xl">{vendor.name.charAt(0)}</div>
                                    <div>
                                      <p className="text-[10px] font-black text-gray-400 uppercase">Vendor</p>
                                      <p className="font-bold text-gray-900">{vendor.name}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-4 w-full sm:w-auto">
                                    <button onClick={() => onToggleApproval(p.id)} className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white font-black px-10 py-5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2">
                                      <i className="fa-solid fa-check-double"></i> Approve
                                    </button>
                                    <button onClick={() => handleRejectAction(p.id, p.name)} className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all">
                                      <i className="fa-solid fa-trash-can"></i>
                                    </button>
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

      {/* Edit Modal (Supports single image update for simplicity in MVP) */}
      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingProduct(null)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl p-8 animate-fadeInUp overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-black mb-8">Edit Listing</h3>
            <form onSubmit={handleEditSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none" placeholder="Title" />
                  <input type="number" value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none" placeholder="Price" />
                  <textarea rows={4} value={editingProduct.description} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none" placeholder="Description"></textarea>
                </div>
                <div>
                   <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-dashed border-gray-200 mb-4">
                      <img src={editingProduct.image} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => editProductFileInputRef.current?.click()} className="absolute inset-0 bg-black/20 text-white flex items-center justify-center font-bold">Change Image</button>
                      <input type="file" ref={editProductFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleSingleImageUpload(e, 'edit')} />
                   </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-teal-600 text-white font-black py-4 rounded-2xl shadow-xl">Update</button>
                <button type="button" onClick={() => setEditingProduct(null)} className="px-8 bg-gray-100 font-bold py-4 rounded-2xl">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
