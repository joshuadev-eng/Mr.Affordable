
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartItem, Product, User, Order } from './types.ts';
import { PRODUCTS as STATIC_PRODUCTS } from './data.ts';
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
  const [currentUser, setCurrentUser] = useState<User | null>(() => JSON.parse(localStorage.getItem('current_user') || 'null'));
  const [orders, setOrders] = useState<Order[]>(() => JSON.parse(localStorage.getItem('orders') || '[]'));
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch products from Supabase on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('createdAt', { ascending: false });

        if (error) throw error;
        if (data) setLocalProducts(data);
      } catch (err) {
        console.error("Error fetching products from Supabase:", err);
        // Fallback to local storage if supabase fails or is empty
        const saved = localStorage.getItem('local_products');
        if (saved) setLocalProducts(JSON.parse(saved));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Persist state to localStorage (for non-database critical items)
  useEffect(() => localStorage.setItem('cart', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('wishlist', JSON.stringify(wishlist)), [wishlist]);
  useEffect(() => localStorage.setItem('current_user', JSON.stringify(currentUser)), [currentUser]);
  useEffect(() => localStorage.setItem('orders', JSON.stringify(orders)), [orders]);

  // Public products are approved and sorted by newest first
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
  const handleLogout = () => setCurrentUser(null);

  const handleAddProduct = async (product: Product) => {
    try {
      const { error } = await supabase.from('products').insert([product]);
      if (error) throw error;
      setLocalProducts(prev => [product, ...prev]);
    } catch (err) {
      console.error("Error adding product to Supabase:", err);
      // Fallback
      setLocalProducts(prev => [product, ...prev]);
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    try {
      const { error } = await supabase.from('products').update(updatedProduct).eq('id', updatedProduct.id);
      if (error) throw error;
      setLocalProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    } catch (err) {
      console.error("Error updating product in Supabase:", err);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      setLocalProducts(prev => prev.filter(p => p.id !== productId));
      setWishlist(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error("Error deleting product from Supabase:", err);
    }
  };

  const handleClearAllProducts = async () => {
    if (window.confirm("ARE YOU SURE? This will delete EVERYTHING in the product catalog from the database permanently.")) {
      try {
        const { error } = await supabase.from('products').delete().neq('id', '0'); // Dangerous wipe
        if (error) throw error;
        setLocalProducts([]);
        setWishlist([]);
      } catch (err) {
        console.error("Error wiping database:", err);
      }
    }
  };

  const handleToggleApproval = async (productId: string) => {
    const product = localProducts.find(p => p.id === productId);
    if (!product) return;
    
    const newApprovalStatus = !product.isApproved;
    try {
      const { error } = await supabase.from('products').update({ isApproved: newApprovalStatus }).eq('id', productId);
      if (error) throw error;
      setLocalProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, isApproved: newApprovalStatus } : p
      ));
    } catch (err) {
      console.error("Error toggling approval in Supabase:", err);
    }
  };

  const addOrder = async (order: Order) => {
    try {
      const { error } = await supabase.from('orders').insert([order]);
      if (error) throw error;
      setOrders(prev => [order, ...prev]);
    } catch (err) {
      console.error("Error saving order to Supabase:", err);
      setOrders(prev => [order, ...prev]);
    }
  };

  const updateOrder = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (err) {
      console.error("Error updating order in Supabase:", err);
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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-teal-600 font-bold uppercase tracking-widest text-xs">Connecting to Mr.Affordable Database...</p>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<Home products={allProducts} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlist={wishlist} onQuickView={setQuickViewProduct} currentUser={currentUser} />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/category/:categoryName" element={<ProductListing products={allProducts} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlist={wishlist} onQuickView={setQuickViewProduct} currentUser={currentUser} />} />
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
                    onUpdateUser={setCurrentUser} 
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
          )}
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
