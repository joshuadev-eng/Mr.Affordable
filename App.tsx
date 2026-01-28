
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
 * DATA FLOW EXPLAINED:
 * 1. Vendor/User adds product -> Saved to localStorage ['pendingProducts'].
 * 2. Admin opens Dashboard -> Reads from localStorage ['pendingProducts'] to show Review Queue.
 * 3. Admin clicks Approve -> Item moves from localStorage to Supabase ['products' table].
 * 4. Public Shop -> Fetches ONLY from Supabase.
 */

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>(() => JSON.parse(localStorage.getItem('cart') || '[]'));
  const [wishlist, setWishlist] = useState<Product[]>(() => JSON.parse(localStorage.getItem('wishlist') || '[]'));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mraffordable_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Staging area for products awaiting approval (Stage 1)
  const [pendingProducts, setPendingProducts] = useState<Product[]>(() => 
    JSON.parse(localStorage.getItem('pendingProducts') || '[]')
  );

  // Database products (Stage 2 - Approved)
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Sync pending products to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pendingProducts', JSON.stringify(pendingProducts));
  }, [pendingProducts]);

  // Auth Management
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

  // Fetch Approved Products (ONLY from Supabase)
  useEffect(() => {
    const fetchDbData = async () => {
      setIsLoadingProducts(true);
      try {
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .order('createdAt', { ascending: false });

        if (productsData) setDbProducts(productsData);

        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .order('date', { ascending: false });

        if (ordersData) setOrders(ordersData);
      } catch (err) {
        console.error("DB Fetch Error:", err);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchDbData();
  }, [currentUser]);

  useEffect(() => localStorage.setItem('cart', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('wishlist', JSON.stringify(wishlist)), [wishlist]);

  // Combined product view for Dashboards (Pending from Local + Approved from DB)
  const allContextProducts = useMemo(() => {
    return [...pendingProducts, ...dbProducts].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [pendingProducts, dbProducts]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      return [...prev, { ...product, quantity }];
    });
    setQuickViewProduct(null);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem('mraffordable_session');
  };

  /**
   * HANDLERS FOR VENDOR WORKFLOW
   */
  const handleAddProduct = (product: Product) => {
    // Stage the product in localStorage immediately
    setPendingProducts(prev => [product, ...prev]);
    alert("Product saved locally and submitted for review!");
  };

  const handleToggleApproval = async (productId: string) => {
    const productToApprove = pendingProducts.find(p => p.id === productId);
    if (!productToApprove) return;

    // 1. Save to Supabase
    const { id, ...cleanProduct } = productToApprove;
    const { data, error } = await supabase
      .from('products')
      .insert([{ ...cleanProduct, isApproved: true, isDenied: false }])
      .select();

    if (!error && data) {
      // 2. Remove from localStorage staging
      setPendingProducts(prev => prev.filter(p => p.id !== productId));
      // 3. Update DB list for immediate UI sync
      setDbProducts(prev => [data[0], ...prev]);
      alert("Product approved and moved to live store!");
    } else {
      alert("Error approving product: " + error?.message);
    }
  };

  const handleRejectProduct = (productId: string) => {
    const reason = prompt("Enter rejection reason:") || "Incomplete details";
    setPendingProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, isDenied: true, isApproved: false, rejectionReason: reason } : p
    ));
  };

  const handleDeleteProduct = async (productId: string) => {
    // Check if it's in staging
    if (pendingProducts.some(p => p.id === productId)) {
      setPendingProducts(prev => prev.filter(p => p.id !== productId));
    } else {
      // Delete from DB
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (!error) setDbProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    if (pendingProducts.some(p => p.id === updatedProduct.id)) {
      setPendingProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    } else {
      const { error } = await supabase.from('products').update(updatedProduct).eq('id', updatedProduct.id);
      if (!error) setDbProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    }
  };

  const addOrder = async (order: Order) => {
    const { error } = await supabase.from('orders').insert([order]);
    if (!error) setOrders(prev => [order, ...prev]);
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-teal-600"></div>
      </div>
    );
  }

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
                products={dbProducts} // ONLY APPROVED/DB PRODUCTS
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
            <Route path="/checkout" element={<CheckoutPage cart={cart} clearCart={clearCart} user={currentUser} addOrder={addOrder} />} />
            <Route path="/wishlist" element={<WishlistPage wishlist={wishlist} toggleWishlist={toggleWishlist} addToCart={addToCart} onQuickView={setQuickViewProduct} />} />
            <Route path="/auth" element={<AuthPage onLogin={(u) => { setCurrentUser(u); localStorage.setItem('mraffordable_session', JSON.stringify(u)); }} currentUser={currentUser} />} />
            <Route path="/dashboard" element={
              currentUser ? (
                <Dashboard 
                  user={currentUser} 
                  onUpdateUser={(u) => { setCurrentUser(u); localStorage.setItem('mraffordable_session', JSON.stringify(u)); }}
                  userProducts={allContextProducts.filter(p => p.userId === currentUser.id)}
                  orders={currentUser.role === 'admin' ? orders : orders.filter(o => o.userId === currentUser.id)}
                  onUpdateOrder={(id, s) => { /* logic */ }}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onToggleApproval={handleToggleApproval}
                  onRejectProduct={handleRejectProduct}
                  allLocalProducts={allContextProducts}
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
