
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
  onToggleApproval: (productId: string) => void;
  onRejectProduct: (productId: string) => void;
  allLocalProducts: Product[];
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
  allLocalProducts 
}) => {
  const isAdmin = user.role === 'admin';
  const [activeTab, setActiveTab] = useState<'profile' | 'sell' | 'my-products' | 'orders' | 'admin'>(
    isAdmin ? 'admin' : 'profile'
  );
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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

  // Review Queue (Admin only): Items not approved and not denied
  const pendingQueue = useMemo(() => {
    return allLocalProducts
      .filter(p => !p.isApproved && !p.isDenied)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [allLocalProducts]);

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (productData.images.length === 0) return alert('Add at least one photo.');
    
    setIsSubmitting(true);
    const newProduct: Product = {
      id: 'staging-' + Date.now(),
      name: productData.name,
      price: parseFloat(productData.price),
      category: productData.category,
      description: productData.description,
      image: productData.images[0],
      images: productData.images,
      userId: user.id,
      isApproved: false, 
      isDenied: false,
      createdAt: Date.now()
    };
    
    onAddProduct(newProduct);
    setIsSubmitting(false);
    setProductData({ name: '', price: '', category: Category.Phones, description: '', images: [] });
    setActiveTab('my-products');
  };

  const getStatusBadge = (product: Product) => {
    if (product.isDenied) {
      return (
        <div title={product.rejectionReason} className="flex items-center space-x-2 px-3 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 cursor-help">
          <i className="fa-solid fa-circle-exclamation text-[10px]"></i>
          <span className="text-[9px] font-black uppercase">Rejected</span>
        </div>
      );
    }
    if (product.isApproved) {
      return (
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
          <i className="fa-solid fa-circle-check text-[10px]"></i>
          <span className="text-[9px] font-black uppercase">Approved</span>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
        <i className="fa-solid fa-clock text-[10px] animate-pulse"></i>
        <span className="text-[9px] font-black uppercase">Reviewing</span>
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
              <div className="w-20 h-20 rounded-full bg-teal-100 mx-auto mb-4 border-2 border-white shadow-md overflow-hidden flex items-center justify-center">
                {user.profilePic ? <img src={user.profilePic} className="w-full h-full object-cover" alt="Profile" /> : <div className="text-2xl font-black text-teal-600">{user.name[0]}</div>}
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
                <i className="fa-solid fa-boxes-stacked"></i><span>My Items</span>
              </button>
              {isAdmin && (
                <button onClick={() => setActiveTab('admin')} className={`w-full flex items-center justify-between px-6 py-4 border-t transition-colors ${activeTab === 'admin' ? 'bg-orange-600 text-white' : 'text-orange-600 hover:bg-orange-50'}`}>
                  <div className="flex items-center space-x-4"><i className="fa-solid fa-shield-halved"></i><span>Review Queue</span></div>
                  {pendingQueue.length > 0 && <span className="bg-white text-orange-600 px-2 py-0.5 rounded-full text-[10px]">{pendingQueue.length}</span>}
                </button>
              )}
            </nav>
          </div>

          <div className="w-full md:w-3/4">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 md:p-12 min-h-[600px]">
              
              {activeTab === 'admin' && isAdmin && (
                <div className="animate-fadeInUp">
                  <h3 className="text-3xl font-black mb-8 text-gray-900">Pending Review</h3>
                  {pendingQueue.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl"><p className="text-gray-400 font-bold">Review queue is empty.</p></div>
                  ) : (
                    <div className="space-y-6">
                      {pendingQueue.map(p => (
                        <div key={p.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row gap-6">
                          <img src={p.image} className="w-full md:w-40 h-40 object-cover rounded-2xl" alt={p.name} />
                          <div className="flex-grow">
                            <h4 className="text-2xl font-black text-gray-900">{p.name}</h4>
                            <p className="text-xl font-black text-teal-700 mb-4">${p.price}</p>
                            <div className="flex gap-4">
                              <button onClick={() => onToggleApproval(p.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl transition-all"><i className="fa-solid fa-check mr-2"></i>Approve</button>
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
                  <h3 className="text-3xl font-black mb-8">My Items</h3>
                  <div className="space-y-4">
                    {userProducts.length === 0 ? (
                      <div className="text-center py-20 bg-gray-50 rounded-3xl"><p className="text-gray-400 font-bold">No items found.</p></div>
                    ) : (
                      userProducts.map(p => (
                        <div key={p.id} className="bg-white border border-gray-100 rounded-3xl p-4 flex items-center gap-4 hover:shadow-md transition-all">
                          <img src={p.image} className="w-16 h-16 object-cover rounded-xl" alt={p.name} />
                          <div className="flex-grow">
                            <h4 className="font-bold text-gray-900">{p.name}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="font-black text-teal-700">${p.price}</span>
                              {getStatusBadge(p)}
                            </div>
                          </div>
                          <button onClick={() => onDeleteProduct(p.id)} className="w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all"><i className="fa-solid fa-trash"></i></button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'sell' && (
                <div className="animate-fadeInUp">
                  <h3 className="text-3xl font-black mb-8">Post New Listing</h3>
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
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Photos</label>
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
                      <input type="file" ref={multiProductFileInputRef} multiple className="hidden" accept="image/*" onChange={(e) => {
                        const files = Array.from(e.target.files || []) as File[];
                        files.forEach(f => {
                          const r = new FileReader();
                          r.onloadend = () => setProductData(prev => ({...prev, images: [...prev.images, r.result as string].slice(0, 5)}));
                          r.readAsDataURL(f);
                        });
                      }} />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-teal-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-teal-700 transition-all">
                      {isSubmitting ? 'Posting...' : 'Save & Submit Listing'}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="animate-fadeInUp">
                  <h3 className="text-3xl font-black mb-8">Settings</h3>
                  <form className="space-y-6 max-w-md">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                      <input type="text" defaultValue={user.name} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                    </div>
                    <button type="button" className="bg-teal-600 text-white font-black px-10 py-4 rounded-2xl shadow-xl hover:bg-teal-700 transition-all">Update Profile</button>
                  </form>
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
