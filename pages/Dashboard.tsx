
import React, { useState, useRef } from 'react';
import { User, Product, Category } from '../types';

interface DashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onAddProduct: (product: Product) => void;
  userProducts: Product[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, onUpdateUser, onAddProduct, userProducts }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'sell' | 'my-products'>('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: user.name,
    phone: user.phone,
    profilePic: user.profilePic || ''
  });

  // Product Sell State
  const [productData, setProductData] = useState({
    name: '',
    price: '',
    category: Category.Phones,
    description: '',
    image: ''
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setTimeout(() => {
      onUpdateUser({ ...user, ...profileData });
      setIsUpdating(false);
      alert('Profile updated successfully!');
    }, 600);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'profile' | 'product') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (target === 'profile') {
          setProfileData({ ...profileData, profilePic: base64 });
        } else {
          setProductData({ ...productData, image: base64 });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productData.image) {
      alert('Please upload a product image.');
      return;
    }

    const newProduct: Product = {
      id: `up-${Date.now()}`,
      name: productData.name,
      price: parseFloat(productData.price),
      category: productData.category,
      description: productData.description,
      image: productData.image,
      userId: user.id,
      isApproved: false, // Default to pending
      createdAt: Date.now()
    };

    onAddProduct(newProduct);
    alert('Product submitted! It will appear after admin review.');
    setProductData({ name: '', price: '', category: Category.Phones, description: '', image: '' });
    setActiveTab('my-products');
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
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-teal-600 text-white p-2 rounded-full shadow-lg hover:bg-teal-700 transition-all border-2 border-white"
                >
                  <i className="fa-solid fa-camera text-xs"></i>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
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
                            <img src={productData.image} alt="Preview" className="h-48 rounded-xl" />
                            <button 
                              type="button" 
                              onClick={() => setProductData({...productData, image: ''})}
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
                      className="bg-teal-600 hover:bg-teal-700 text-white font-black px-12 py-5 rounded-2xl shadow-xl transition-all active:scale-95"
                    >
                      Submit for Approval
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
                          <button className="text-gray-400 hover:text-red-500 p-2"><i className="fa-solid fa-trash-can"></i></button>
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
