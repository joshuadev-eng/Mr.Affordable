
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartItem, Product, User, Order } from './types.ts';
import { supabase } from './supabaseClient.ts';

// Components
import Navbar from './components/Navbar.tsx';
import Footer from './components/Footer.tsx';
import FloatingWhatsApp from './components/FloatingWhatsApp.tsx';
import QuickViewModal from './components/QuickViewModal.tsx';

// Pages
import Home from './pages/Home.tsx';
import CategoriesPage from './pages/CategoriesPage.tsx';
import ProductListing from './pages/ProductListing.tsx';
import ProductDetail from './pages/ProductDetail.tsx';
import CartPage from './pages/CartPage.tsx';
import CheckoutPage from './pages/CheckoutPage.tsx';
import WishlistPage from './pages/WishlistPage.tsx';
import SuccessPage from './pages/SuccessPage.tsx';
import AuthPage from './pages/Auth.tsx';
import Dashboard from './pages/Dashboard.tsx';

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>(() => JSON.parse(localStorage.getItem('cart') || '[]'));
  const [wishlist, setWishlist] = useState<Product[]>(() => JSON.parse(localStorage.getItem('wishlist') || '[]'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>(() => JSON.parse(localStorage.getItem('orders') || '[]'));
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Auth State Listener
  useEffect(() => {
    const mapSupabaseUser = (sbUser: any): User => ({
      id: sbUser.id,
      name: sbUser.user_metadata?.full_name || 'User',
      email: sbUser.email || '',
      phone: sbUser.user_metadata?.phone || '',
      role: sbUser.email === 'admin@mraffordable.com' ? 'admin' : (sbUser.user_metadata?.role || 'user'),
      profilePic: sbUser.user_metadata?.profilePic || '',
      isVerified: sbUser.email_confirmed_at ? true : false
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(mapSupabaseUser(session.user));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(mapSupabaseUser(session.user));
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('createdAt', { ascending: false });

        if (error) throw error;
        if (data) setLocalProducts(data);
      } catch (err) {
        console.error("Error fetching products from Supabase:", err);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => localStorage.setItem('cart', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('wishlist', JSON.stringify(wishlist)), [wishlist]);
  useEffect(() => localStorage.setItem('orders', JSON.stringify(orders)), [orders]);

  const allProducts = useMemo(() => {
    return localProducts
      .filter(p => p.isApproved)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [localProducts]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity }];
    });
    setQuickViewProduct(null);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(item => item.id !== productId));
  const clearCart = () => setCart([]);

  const toggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) return prev.filter(item => item.id !== product.id);
      return [...prev, product];
    });
  };

  const handleLogin = (user: User) => setCurrentUser(user);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const handleAddProduct = async (product: Product) => {
    const { error } = await supabase.from('products').insert([product]);
    if (!error) setLocalProducts(prev => [product, ...prev]);
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    const { error } = await supabase.from('products').update(updatedProduct).eq('id', updatedProduct.id);
    if (!error) setLocalProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleDeleteProduct = async (productId: string) => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (!error) {
      setLocalProducts(prev => prev.filter(p => p.id !== productId));
      setWishlist(prev => prev.filter(p => p.id !== productId));
    }
  };

  const handleClearAllProducts = async () => {
    if (window.confirm("Delete everything?")) {
      const { error } = await supabase.from('products').delete().neq('id', '0');
      if (!error) setLocalProducts([]);
    }
  };

  const handleToggleApproval = async (productId: string) => {
    const product = localProducts.find(p => p.id === productId);
    if (!product) return;
    const newApprovalStatus = !product.isApproved;
    const { error } = await supabase.from('products').update({ isApproved: newApprovalStatus }).eq('id', productId);
    if (!error) {
      setLocalProducts(prev => prev.map(p => p.id === productId ? { ...p, isApproved: newApprovalStatus } : p));
    }
  };

  const addOrder = async (order: Order) => {
    const { error } = await supabase.from('orders').insert([order]);
    if (!error) setOrders(prev => [order, ...prev]);
  };

  const updateOrder = async (orderId: string, status: Order['status']) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (!error) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const handleUpdateUserProfile = async (updatedUser: User) => {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: updatedUser.name,
        phone: updatedUser.phone,
        profilePic: updatedUser.profilePic
      }
    });
    
    if (error) {
      console.error("Error updating user profile metadata:", error);
      return;
    }

    if (data.user) {
      setCurrentUser({
        ...updatedUser,
        profilePic: data.user.user_metadata.profilePic
      });
    }
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar 
          cartCount={cart.reduce((a, b) => a + b.quantity, 0)} 
          wishlistCount={wishlist.length} 
          currentUser={currentUser}
          onLogout={handleLogout}
        />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home products={allProducts} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlist={wishlist} onQuickView={setQuickViewProduct} currentUser={currentUser} isLoading={isLoadingProducts} />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/category/:categoryName" element={<ProductListing products={allProducts} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlist={wishlist} onQuickView={setQuickViewProduct} currentUser={currentUser} isLoading={isLoadingProducts} />} />
            <Route path="/product/:productId" element={<ProductDetail products={allProducts} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlist={wishlist} onQuickView={setQuickViewProduct} />} />
            <Route path="/cart" element={<CartPage cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />} />
            <Route path="/checkout" element={<CheckoutPage cart={cart} clearCart={clearCart} user={currentUser} addOrder={addOrder} />} />
            <Route path="/wishlist" element={<WishlistPage wishlist={wishlist} toggleWishlist={toggleWishlist} addToCart={addToCart} onQuickView={setQuickViewProduct} />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/auth" element={<AuthPage onLogin={handleLogin} currentUser={currentUser} />} />
            <Route path="/dashboard" element={
              currentUser ? (
                <Dashboard 
                  user={currentUser} 
                  onUpdateUser={handleUpdateUserProfile} 
                  userProducts={localProducts.filter(p => p.userId === currentUser.id).sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0))} 
                  orders={orders.filter(o => o.userId === currentUser.id || currentUser.role === 'admin')}
                  onUpdateOrder={updateOrder}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onClearAllProducts={handleClearAllProducts}
                  onToggleApproval={handleToggleApproval}
                  onRejectProduct={handleDeleteProduct}
                  allLocalProducts={localProducts}
                />
              ) : <Navigate to="/auth" />
            } />
          </Routes>
        </main>

        <Footer />
        <FloatingWhatsApp />
        
        {quickViewProduct && (
          <QuickViewModal 
            product={quickViewProduct} 
            onClose={() => setQuickViewProduct(null)} 
            addToCart={addToCart} 
          />
        )}
      </div>
    </Router>
  );
};

export default App;
