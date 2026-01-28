
import React, { useState, useEffect } from 'react';
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
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mraffordable_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Helper to map Supabase user metadata to User type
  const mapSupabaseUser = (sbUser: any): User => ({
    id: sbUser.id,
    name: sbUser.user_metadata?.full_name || 'User',
    email: sbUser.email || '',
    phone: sbUser.user_metadata?.phone || '',
    whatsappNumber: sbUser.user_metadata?.whatsappNumber || sbUser.user_metadata?.phone || '',
    phoneNumber: sbUser.user_metadata?.phoneNumber || sbUser.user_metadata?.phone || '',
    role: sbUser.email === 'admin@mraffordable.com' ? 'admin' : (sbUser.user_metadata?.role || 'user'),
    profilePic: sbUser.user_metadata?.profilePic || '',
    isVerified: sbUser.email_confirmed_at ? true : false
  });

  useEffect(() => {
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
        setPendingProducts(productsData.filter(p => !p.isApproved && !p.isDenied));
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
    if (!currentUser) return;

    const stagingProduct = { 
      ...product, 
      userId: currentUser.id, 
      isApproved: currentUser.role === 'admin', 
      createdAt: Date.now()
    };
    
    const { error } = await supabase.from('products').insert([stagingProduct]);
    
    if (!error) {
      fetchDbProducts();
      alert(currentUser.role === 'admin' ? "Listing published!" : "Listing submitted for review!");
    } else {
      console.error("Submission Error:", error);
      alert("Error submitting product: " + error.message);
    }
  };

  const handleToggleApproval = async (productId: string) => {
    const { error } = await supabase
      .from('products')
      .update({ isApproved: true, isDenied: false })
      .eq('id', productId);
    
    if (!error) {
      fetchDbProducts();
      alert("Product approved!");
    } else {
      console.error("Approval Error:", error);
    }
  };

  const handleRejectProduct = async (productId: string) => {
    const { error } = await supabase
      .from('products')
      .update({ isDenied: true, isApproved: false })
      .eq('id', productId);
    
    if (!error) {
      fetchDbProducts();
      alert("Product rejected.");
    } else {
      console.error("Rejection Error:", error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (!error) {
      fetchDbProducts();
    } else {
      console.error("Deletion Error:", error);
    }
  };

  const handleUpdateProduct = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update(product)
      .eq('id', product.id);
    
    if (!error) {
      fetchDbProducts();
    } else {
      console.error("Update Error:", error);
    }
  };

  if (isLoadingAuth) {
    return <div className="h-screen flex items-center justify-center"><i className="fa-solid fa-circle-notch fa-spin text-4xl text-teal-600"></i></div>;
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans">
        <Navbar 
          cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} 
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
                products={dbProducts} 
                addToCart={addToCart} 
                toggleWishlist={toggleWishlist} 
                wishlist={wishlist} 
                onQuickView={setQuickViewProduct}
              />
            } />
            <Route path="/cart" element={
              <CartPage 
                cart={cart} 
                updateQuantity={updateQuantity} 
                removeFromCart={removeFromCart} 
              />
            } />
            <Route path="/checkout" element={
              <CheckoutPage 
                cart={cart} 
                clearCart={() => setCart([])} 
                user={currentUser} 
                addOrder={addOrder}
              />
            } />
            <Route path="/wishlist" element={
              <WishlistPage 
                wishlist={wishlist} 
                toggleWishlist={toggleWishlist} 
                addToCart={addToCart} 
                onQuickView={setQuickViewProduct} 
              />
            } />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/auth" element={
              <AuthPage onLogin={setCurrentUser} currentUser={currentUser} />
            } />
            <Route path="/dashboard" element={
              currentUser ? (
                <Dashboard 
                  user={currentUser} 
                  onUpdateUser={setCurrentUser} 
                  userProducts={currentUser.role === 'admin' 
                    ? dbProducts 
                    : [...dbProducts, ...pendingProducts].filter(p => p.userId === currentUser.id)
                  } 
                  orders={orders} 
                  onUpdateOrder={handleUpdateOrder} 
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onToggleApproval={handleToggleApproval}
                  onRejectProduct={handleRejectProduct}
                  allLocalProducts={[...dbProducts, ...pendingProducts]}
                  onAddOrder={addOrder}
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
