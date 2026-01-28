
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
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showStorageGuide, setShowStorageGuide] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const multiProductFileInputRef = useRef<HTMLInputElement>(null);
  const editProductFileInputRef = useRef<HTMLInputElement>(null);

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

  const pendingQueue = useMemo(() => {
    return allLocalProducts
      .filter(p => p.isApproved === false || p.isApproved === undefined)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [allLocalProducts]);

  const displayProducts = useMemo(() => {
    if (isAdmin) {
      return [...allLocalProducts].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    return [...userProducts].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [isAdmin, allLocalProducts, userProducts]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhone(profileData.phone)) {
      alert('Please enter a valid Liberian phone number (e.g., 0888 123 456 or +231 888 123 456)');
      return;
    }

    setIsUpdating(true);
    const finalPhone = formatPhone(profileData.phone);
    const updatedUser: User = { 
      ...user, 
      name: profileData.name, 
      phone: finalPhone, 
      profilePic: profileData.profilePic 
    };
    
    await onUpdateUser(updatedUser);
    setIsUpdating(false);
    alert('Profile information saved!');
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image is too large. Please select an image under 2MB.");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error("Supabase Storage Error:", error);
        // Specifically check for missing bucket
        if (error.message.toLowerCase().includes('bucket not found') || (error as any).status === 404) {
          setShowStorageGuide(true);
          throw new Error("BUCKET_MISSING");
        }
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfileData(prev => ({ ...prev, profilePic: publicUrl }));
      
      const updatedUser: User = { 
        ...user, 
        profilePic: publicUrl 
      };
      await onUpdateUser(updatedUser);
      alert("Profile picture updated successfully!");
      
    } catch (err: any) {
      if (err.message !== "BUCKET_MISSING") {
        alert("Upload failed: " + (err.message || "Unknown error"));
      }
    } finally {
      setIsUploadingPhoto(false);
      if (profileFileInputRef.current) profileFileInputRef.current.value = '';
    }
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'new' | 'edit') => {
    if (target === 'new') {
      const files = Array.from(e.target.files || []) as File[];
      if (productData.images.length + files.length > 5) {
        alert('Maximum 5 images allowed.');
        return;
      }

      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setProductData(prev => ({
            ...prev,
            images: [...prev.images, base64]
          }));
        };
        reader.readAsDataURL(file);
      });
    } else if (target === 'edit' && editingProduct) {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditingProduct({ ...editingProduct, image: reader.result as string });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImageFromUpload = (index: number) => {
    setProductData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (productData.images.length === 0) {
      alert('Please upload at least one image of the product.');
      return;
    }
    
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
      createdAt: Date.now()
    };
    
    await onAddProduct(newProduct);
    setIsSubmitting(false);
    
    alert(isAdmin ? 'Product listed successfully!' : 'Product submitted for review!');
    setProductData({ name: '', price: '', category: Category.Phones, description: '', images: [] });
    setActiveTab('my-products');
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    await onUpdateProduct(editingProduct);
    setEditingProduct(null);
    alert('Product updated!');
  };

  const getStatusBadge = (product: Product) => {
    if (product.isApproved) {
      return (
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 shadow-sm">
          <i className="fa-solid fa-circle-check text-[10px]"></i>
          <span className="text-[10px] font-black uppercase tracking-widest">Approved</span>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100 shadow-sm">
        <i className="fa-solid fa-clock text-[10px] animate-pulse"></i>
        <span className="text-[10px] font-black uppercase tracking-widest">Pending</span>
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
              {isAdmin && <div className="absolute top-0 left-0 w-full h-1 bg-teal-600"></div>}
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-full bg-teal-100 overflow-hidden border-4 border-white shadow-md mx-auto relative">
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                      <i className="fa-solid fa-circle-notch fa-spin text-white text-xl"></i>
                    </div>
                  )}
                  {profileData.profilePic ? (
                    <img src={profileData.profilePic} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-teal-600">{user.name.charAt(0)}</div>
                  )}
                </div>
                <button 
                  type="button" 
                  disabled={isUploadingPhoto}
                  onClick={() => profileFileInputRef.current?.click()} 
                  className="absolute bottom-0 right-0 bg-teal-600 text-white p-2.5 rounded-full shadow-lg hover:bg-teal-700 transition-all border-2 border-white disabled:bg-gray-400"
                >
                  <i className="fa-solid fa-camera text-xs"></i>
                </button>
                <input 
                  type="file" 
                  ref={profileFileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleProfilePhotoUpload} 
                />
              </div>
              <h2 className="font-black text-gray-900 text-lg">{user.name}</h2>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-gray-100 rounded-full inline-block mt-1">{user.role}</p>
            </div>
            
            <nav className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <button type="button" onClick={() => setActiveTab('profile')} className={`w-full flex items-center space-x-4 px-6 py-4 text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-teal-50 hover:text-teal-600'}`}>
                <i className="fa-solid fa-user-gear"></i><span>Profile</span>
              </button>
              <button type="button" onClick={() => setActiveTab('orders')} className={`w-full flex items-center space-x-4 px-6 py-4 text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-teal-50 hover:text-teal-600'}`}>
                <i className="fa-solid fa-receipt"></i><span>Orders</span>
              </button>
              <button type="button" onClick={() => setActiveTab('sell')} className={`w-full flex items-center space-x-4 px-6 py-4 text-sm font-bold transition-all ${activeTab === 'sell' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-teal-50 hover:text-teal-600'}`}>
                <i className="fa-solid fa-tag"></i><span>Add Product</span>
              </button>
              <button type="button" onClick={() => setActiveTab('my-products')} className={`w-full flex items-center space-x-4 px-6 py-4 text-sm font-bold transition-all ${activeTab === 'my-products' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-teal-50 hover:text-teal-600'}`}>
                <i className="fa-solid fa-boxes-stacked"></i><span>{isAdmin ? 'Master Catalog' : 'My Listings'}</span>
              </button>
              {isAdmin && (
                <button type="button" onClick={() => setActiveTab('admin')} className={`w-full flex items-center justify-between px-6 py-4 text-sm font-black transition-all border-t border-gray-100 ${activeTab === 'admin' ? 'bg-orange-600 text-white' : 'text-orange-600 hover:bg-orange-50'}`}>
                  <div className="flex items-center space-x-4">
                    <i className="fa-solid fa-shield-halved"></i>
                    <span>Review Queue</span>
                  </div>
                  {pendingQueue.length > 0 && <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'admin' ? 'bg-white text-orange-600' : 'bg-orange-600 text-white'}`}>{pendingQueue.length}</span>}
                </button>
              )}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="w-full md:w-3/4">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 md:p-12 min-h-[600px]">
              
              {/* Storage Missing Alert */}
              {showStorageGuide && (
                <div className="mb-10 bg-orange-50 border-2 border-orange-200 rounded-3xl p-8 animate-fadeInUp">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                      <i className="fa-solid fa-triangle-exclamation text-xl"></i>
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-xl font-black text-orange-900 mb-2">Supabase Storage Missing</h4>
                      <p className="text-orange-700 text-sm leading-relaxed mb-6">
                        The <strong>'avatars'</strong> bucket was not found in your Supabase project. To enable profile pictures, please follow these steps:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/50 p-4 rounded-xl text-xs text-orange-900 border border-orange-200">
                          <span className="font-black block mb-1">1. Create Bucket</span>
                          Go to <strong>Storage</strong> in your Supabase dashboard and create a new bucket named exactly <strong>'avatars'</strong>.
                        </div>
                        <div className="bg-white/50 p-4 rounded-xl text-xs text-orange-900 border border-orange-200">
                          <span className="font-black block mb-1">2. Set Public</span>
                          Toggle the <strong>'Public bucket'</strong> switch so images can be viewed without a token.
                        </div>
                        <div className="bg-white/50 p-4 rounded-xl text-xs text-orange-900 border border-orange-200">
                          <span className="font-black block mb-1">3. Add Policies</span>
                          Click 'Policies' and add a <strong>'Select'</strong> and <strong>'Insert'</strong> policy for Authenticated or All users.
                        </div>
                        <div className="bg-white/50 p-4 rounded-xl text-xs text-orange-900 border border-orange-200">
                          <span className="font-black block mb-1">4. Save</span>
                          Once done, refresh this page and try uploading again!
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowStorageGuide(false)}
                        className="mt-6 bg-orange-600 text-white font-black px-6 py-2 rounded-full text-xs hover:bg-orange-700 transition-colors"
                      >
                        Dismiss Guide
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="animate-fadeInUp">
                  <h3 className="text-2xl font-black mb-8">Personal Information</h3>
                  <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-lg">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input type="text" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">WhatsApp Phone</label>
                        {profileData.phone && !validatePhone(profileData.phone) && (
                          <span className="text-[10px] text-red-500 font-bold uppercase">Invalid Format</span>
                        )}
                      </div>
                      <input 
                        type="tel" 
                        value={profileData.phone} 
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})} 
                        className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl focus:bg-white outline-none transition-all ${profileData.phone && !validatePhone(profileData.phone) ? 'border-red-300' : 'border-transparent focus:border-teal-600'}`}
                        placeholder="+231 777 000 000"
                      />
                      <p className="text-[10px] text-gray-400 ml-1 font-bold">Use +231 or 0 prefix (e.g., 0777 123 456)</p>
                    </div>
                    <button type="submit" disabled={isUpdating} className="bg-teal-600 hover:bg-teal-700 text-white font-black px-10 py-4 rounded-2xl shadow-xl transition-all">
                      {isUpdating ? 'Saving Changes...' : 'Save Profile Details'}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'sell' && (
                <div className="animate-fadeInUp">
                  <h3 className="text-2xl font-black mb-8">Create New Listing</h3>
                  <form onSubmit={handleProductSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Product Title</label>
                        <input type="text" required value={productData.name} onChange={(e) => setProductData({...productData, name: e.target.value})} placeholder="e.g. Samsung Galaxy S23" className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Price (USD)</label>
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
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Description</label>
                      <textarea required value={productData.description} onChange={(e) => setProductData({...productData, description: e.target.value})} rows={4} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" placeholder="Tell buyers about features, condition, and warranty."></textarea>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Product Images (Max 5)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {productData.images.map((img, index) => (
                          <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 group">
                            <img src={img} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeImageFromUpload(index)} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                              <i className="fa-solid fa-xmark text-[10px]"></i>
                            </button>
                          </div>
                        ))}
                        {productData.images.length < 5 && (
                          <button 
                            type="button" 
                            onClick={() => multiProductFileInputRef.current?.click()}
                            className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center bg-gray-50 hover:bg-teal-50 hover:border-teal-200 transition-all text-gray-400 hover:text-teal-600"
                          >
                            <i className="fa-solid fa-camera text-2xl mb-1"></i>
                            <span className="text-[10px] font-black uppercase">Add Photo</span>
                          </button>
                        )}
                      </div>
                      <input type="file" ref={multiProductFileInputRef} multiple className="hidden" accept="image/*" onChange={(e) => handleProductImageUpload(e, 'new')} />
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3">
                      {isSubmitting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}
                      {isAdmin ? 'List Product Instantly' : 'Submit for Admin Review'}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'my-products' && (
                <div className="animate-fadeInUp">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <div>
                      <h3 className="text-2xl font-black">{isAdmin ? 'Master Catalog' : 'My Listings'}</h3>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">
                        {displayProducts.length} Total items registered
                      </p>
                    </div>
                  </div>
                  
                  {displayProducts.length === 0 ? (
                    <div className="text-center py-24 bg-gray-50 rounded-[3rem] border border-gray-100">
                      <i className="fa-solid fa-box-open text-6xl text-gray-200 mb-6"></i>
                      <p className="text-gray-400 font-bold">No active listings found.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {displayProducts.map(p => (
                        <div key={p.id} className={`bg-white border ${p.isApproved ? 'border-gray-100' : 'border-orange-100 bg-orange-50/20'} rounded-3xl p-4 flex flex-col sm:flex-row items-center gap-6 group hover:shadow-md transition-shadow relative overflow-hidden`}>
                          {!p.isApproved && <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>}
                          <img src={p.image} className="w-24 h-24 object-cover rounded-2xl shadow-sm bg-gray-100" />
                          <div className="flex-grow text-center sm:text-left">
                            <h4 className="font-bold text-gray-900 text-lg">{p.name}</h4>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1">
                              <span className="text-teal-600 font-black">${p.price.toLocaleString()}</span>
                              <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase">{p.category}</span>
                              {getStatusBadge(p)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setEditingProduct(p)} className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center hover:bg-teal-600 hover:text-white transition-all"><i className="fa-solid fa-pencil"></i></button>
                            <button type="button" onClick={() => isAdmin ? onDeleteProduct(p.id) : onRejectProduct(p.id)} className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><i className="fa-solid fa-trash-can"></i></button>
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
                    <h3 className="text-3xl font-black text-orange-600">Admin Review Queue</h3>
                    <div className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-xs font-black uppercase tracking-widest">{pendingQueue.length} Awaiting Approval</div>
                  </div>
                  
                  {pendingQueue.length === 0 ? (
                    <div className="text-center py-24 bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100">
                      <i className="fa-solid fa-circle-check text-6xl text-green-200 mb-6"></i>
                      <p className="text-gray-400 font-bold">Excellent! The queue is completely empty.</p>
                    </div>
                  ) : (
                    <div className="space-y-12">
                      {pendingQueue.map(p => (
                        <div key={p.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden">
                          <div className="flex flex-col lg:flex-row">
                            <div className="w-full lg:w-1/3 p-6 bg-gray-50">
                               <img src={p.image} className="w-full h-full object-cover rounded-2xl bg-white shadow-sm" />
                            </div>
                            <div className="w-full lg:w-2/3 p-8 lg:p-10 flex flex-col justify-between">
                              <div>
                                <span className="px-3 py-1 bg-teal-50 text-teal-700 text-[10px] font-black rounded-full uppercase border border-teal-100 mb-4 inline-block">{p.category}</span>
                                <h4 className="text-3xl font-black text-gray-900 mb-4">{p.name}</h4>
                                <p className="text-gray-600 mb-8">{p.description}</p>
                              </div>
                              <div className="flex gap-4">
                                <button type="button" onClick={() => onToggleApproval(p.id)} className="bg-green-600 hover:bg-green-700 text-white font-black px-12 py-5 rounded-3xl shadow-xl transition-all flex items-center justify-center gap-3">
                                  Approve
                                </button>
                                <button type="button" onClick={() => onRejectProduct(p.id)} className="bg-red-50 text-red-600 font-black px-6 py-5 rounded-3xl hover:bg-red-600 hover:text-white transition-all">
                                  Reject
                                </button>
                              </div>
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
                  <h3 className="text-2xl font-black mb-8">Order History</h3>
                  {orders.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-gray-100">
                      <i className="fa-solid fa-receipt text-6xl text-gray-200 mb-4"></i>
                      <p className="text-gray-500 font-bold">No orders found.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map(order => (
                        <div key={order.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</p>
                              <h4 className="font-bold text-gray-900">{order.id}</h4>
                              <p className="text-xs text-gray-500">{order.date}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                              <select 
                                value={order.status} 
                                onChange={(e) => onUpdateOrder(order.id, e.target.value as Order['status'])}
                                disabled={!isAdmin}
                                className={`font-black text-xs px-4 py-2 rounded-full border-2 ${order.status === 'Delivered' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}
                              >
                                {['Pending', 'Confirmed', 'Shipped', 'Delivered'].map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                             <p className="text-xs text-gray-500 truncate max-w-[200px]"><i className="fa-solid fa-location-dot mr-2"></i>{order.address}</p>
                             <p className="font-black text-teal-700 text-xl">${order.total.toLocaleString()}</p>
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

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingProduct(null)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl p-8 animate-fadeInUp overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-black mb-8">Edit Product</h3>
            <form onSubmit={handleEditSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Title</label>
                    <input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Price</label>
                    <input type="number" value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Description</label>
                    <textarea rows={4} value={editingProduct.description} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all"></textarea>
                  </div>
                </div>
                <div>
                   <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50">
                      <img src={editingProduct.image} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <button type="button" onClick={() => editProductFileInputRef.current?.click()} className="bg-white text-gray-900 font-bold px-6 py-2 rounded-full shadow-lg hover:scale-105 transition-transform">Change Photo</button>
                      </div>
                      <input type="file" ref={editProductFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleProductImageUpload(e, 'edit')} />
                   </div>
                </div>
              </div>
              <div className="flex gap-4 pt-6 border-t border-gray-100">
                <button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-black py-4 rounded-2xl shadow-xl transition-all">Save Changes</button>
                <button type="button" onClick={() => setEditingProduct(null)} className="px-8 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-4 rounded-2xl transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
