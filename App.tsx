
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

/**
 * DATA FLOW LOGIC (FIXED):
 * 1. VENDOR ADDS PRODUCT: INSERTED into Supabase with isApproved: false.
 * 2. VENDOR DASHBOARD: Displays products from Supabase filtered by userId.
 * 3. ADMIN DASHBOARD: Displays ALL products from Supabase where isApproved: false.
 * 4. ADMIN APPROVES: UPDATES isApproved: true in Supabase for the EXISTING record.
 * 5. PUBLIC SHOP: Fetches ONLY from Supabase where isApproved: true.
 */

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>(() => JSON.parse(localStorage.getItem('cart') || '[]'));
  const [wishlist, setWishlist] = useState<Product[]>(() => JSON.parse(localStorage.getItem('wishlist') || '[]'));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mraffordable_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [pendingProducts, setPendingProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('pendingProducts');
    return saved ? JSON.parse(saved) : [];
  });

  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    localStorage.setItem('pendingProducts', JSON.stringify(pendingProducts));
  }, [pendingProducts]);

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
        const user = mapSupabaseUser(session.user);
        setCurrentUser(user);
        localStorage.setItem('mraffordable_session', JSON.stringify(user));
      } else {
        const saved = localStorage.getItem('mraffordable_session');
        const parsed = saved ? JSON.parse(saved) : null;
        if (parsed?.id === 'master-admin-001') setCurrentUser(parsed);
        else setCurrentUser(null);
      }
      setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const user = mapSupabaseUser(session.user);
        setCurrentUser(user);
        localStorage.setItem('mraffordable_session', JSON.stringify(user));
      } else {
        const saved = localStorage.getItem('mraffordable_session');
        const parsed = saved ? JSON.parse(saved) : null;
        if (parsed?.id !== 'master-admin-001') {
          setCurrentUser(null);
          localStorage.removeItem('mraffordable_session');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchDbProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('createdAt', { ascending: false });

      if (productsData) {
        setDbProducts(productsData.filter(p => p.isApproved));
        setPendingProducts(productsData.filter(p => !p.isApproved));
      }

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .order('date', { ascending: false });

      if (ordersData) setOrders(ordersData);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchDbProducts();
  }, [currentUser]);

  useEffect(() => localStorage.setItem('cart', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('wishlist', JSON.stringify(wishlist)), [wishlist]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      return [...prev, { ...product, quantity }];
    });
    setQuickViewProduct(null);
  };

  const toggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) return prev.filter(item => item.id !== product.id);
      return [...prev, product];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const addOrder = async (order: Order) => {
    setOrders(prev => [order, ...prev]);
    const { error } = await supabase.from('orders').insert([order]);
    if (error) console.error("Order save error:", error);
  };

  const handleUpdateOrder = async (orderId: string, status: Order['status']) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } else {
      console.error("Order update error:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem('mraffordable_session');
  };

  const handleAddProduct = async (product: Product) => {
    const stagingProduct = { 
      ...product, 
      userId: currentUser?.id, 
      isApproved: false, 
      createdAt: Date.now()
    };
    
    const { error } = await supabase.from('products').insert([stagingProduct]);
    
    if (!error) {
      setPendingProducts(prev => [stagingProduct, ...prev]);
      alert("Listing submitted! Waiting for Admin review.");
    } else {
      console.error("Submission Error:", error);
      alert("Error submitting product: " + error.message);
    }
  };

  const handleToggleApproval = async (productId: string) => {
    // FIX: ONLY UPDATE the existing record, DO NOT insert.
    const { error } = await supabase
      .from('products')
      .update({ isApproved: true })
      .eq('id', productId);

    if (!error) {
      setPendingProducts(prev => prev.filter(p => p.id !== productId));
      fetchDbProducts(); // Refresh state from DB
      alert("Product is now LIVE!");
    } else {
      console.error("Approval error:", error);
      alert("Error approving product: " + error.message);
    }
  };

  const handleRejectProduct = async (productId: string) => {
    const reason = prompt("Enter rejection reason:") || "Guidelines not met.";
    const { error } = await supabase
      .from('products')
      .update({ isApproved: false }) 
      .eq('id', productId);
    
    if (!error) {
      setPendingProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, isDenied: true, rejectionReason: reason } : p
      ));
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (!error) {
      setPendingProducts(prev => prev.filter(p => p.id !== productId));
      setDbProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    const { isDenied, rejectionReason, ...cleanProduct } = updatedProduct;
    const { error } = await supabase.from('products').update(cleanProduct).eq('id', updatedProduct.id);
    if (!error) {
      fetchDbProducts();
    } else {
      console.error("DB Update Error:", error);
    }
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar 
          cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} 
          wishlistCount={wishlist.length}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={
              <Home 
                products={dbProducts}
                addToCart={addToCart} 
                toggleWishlist={toggleWishlist} 
                wishlist={wishlist}
                onQuickView={setQuickViewProduct}
                currentUser={currentUser}
                isLoading={isLoadingProducts}
              />
            } />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/category/:categoryName" element={
              <ProductListing 
                products={dbProducts} 
                addToCart={addToCart} 
                toggleWishlist={toggleWishlist} 
                wishlist={wishlist}
                onQuickView={setQuickViewProduct}
                currentUser={currentUser}
                isLoading={isLoadingProducts}
              />
            } />
            <Route path="/product/:productId" element={
              <ProductDetail 
                products={[...dbProducts, ...pendingProducts]} 
                addToCart={addToCart} 
                toggleWishlist={toggleWishlist} 
                wishlist={wishlist}
                onQuickView={setQuickViewProduct}
              />
            } />
            <Route path="/cart" element={<CartPage cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />} />
            <Route path="/checkout" element={<CheckoutPage cart={cart} clearCart={() => setCart([])} user={currentUser} addOrder={addOrder} />} />
            <Route path="/wishlist" element={<WishlistPage wishlist={wishlist} toggleWishlist={toggleWishlist} addToCart={addToCart} onQuickView={setQuickViewProduct} />} />
            <Route path="/auth" element={<AuthPage onLogin={u => setCurrentUser(u)} currentUser={currentUser} />} />
            <Route path="/dashboard" element={
              currentUser ? (
                <Dashboard 
                  user={currentUser} 
                  onUpdateUser={(u) => { 
                    setCurrentUser(u); 
                    localStorage.setItem('mraffordable_session', JSON.stringify(u));
                  }}
                  userProducts={currentUser.role === 'admin' 
                    ? [...dbProducts, ...pendingProducts] 
                    : [...dbProducts, ...pendingProducts].filter(p => p.userId === currentUser.id)
                  }
                  orders={orders}
                  onUpdateOrder={handleUpdateOrder}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onToggleApproval={handleToggleApproval}
                  onRejectProduct={handleRejectProduct}
                  allLocalProducts={pendingProducts}
                  onAddOrder={addOrder}
                />
              ) : <Navigate to="/auth" />
            } />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
        <FloatingWhatsApp />
        {quickViewProduct && (
          <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} addToCart={addToCart} />
        )}
      </div>
    </Router>
  );
};

export default App;
