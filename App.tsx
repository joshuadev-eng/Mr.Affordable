
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartItem, Product, User, Order } from './types.ts';
import { PRODUCTS as STATIC_PRODUCTS } from './data.ts';

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

  // Initialize localProducts with STATIC_PRODUCTS if empty
  const [localProducts, setLocalProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('local_products');
    if (saved) return JSON.parse(saved);
    // On first load, inject static products as 'approved' products owned by admin
    // We spread them slightly in time so they have a deterministic order
    return STATIC_PRODUCTS.map((p, index) => ({
      ...p,
      isApproved: true,
      userId: 'admin-001', 
      createdAt: Date.now() - (index * 1000) // Slightly older as we go down the list
    }));
  });

  // Persist state to localStorage
  useEffect(() => localStorage.setItem('cart', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('wishlist', JSON.stringify(wishlist)), [wishlist]);
  useEffect(() => localStorage.setItem('current_user', JSON.stringify(currentUser)), [currentUser]);
  useEffect(() => localStorage.setItem('local_products', JSON.stringify(localProducts)), [localProducts]);
  useEffect(() => localStorage.setItem('orders', JSON.stringify(orders)), [orders]);

  // Sync state across multiple open tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'local_products' && e.newValue) {
        setLocalProducts(JSON.parse(e.newValue));
      }
      if (e.key === 'cart' && e.newValue) {
        setCart(JSON.parse(e.newValue));
      }
      if (e.key === 'wishlist' && e.newValue) {
        setWishlist(JSON.parse(e.newValue));
      }
      if (e.key === 'current_user' && e.newValue) {
        setCurrentUser(JSON.parse(e.newValue));
      }
      if (e.key === 'orders' && e.newValue) {
        setOrders(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

  const handleAddProduct = (product: Product) => {
    setLocalProducts(prev => {
      // Prepend to show at the top immediately
      const updated = [product, ...prev];
      localStorage.setItem('local_products', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setLocalProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleDeleteProduct = (productId: string) => {
    setLocalProducts(prev => prev.filter(p => p.id !== productId));
    setWishlist(prev => prev.filter(p => p.id !== productId));
  };

  const handleClearAllProducts = () => {
    if (window.confirm("ARE YOU SURE? This will delete EVERYTHING in the product catalog permanently.")) {
      setLocalProducts([]);
      setWishlist([]);
      localStorage.setItem('local_products', JSON.stringify([]));
    }
  };

  const handleToggleApproval = (productId: string) => {
    setLocalProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, isApproved: !p.isApproved } : p
    ));
  };

  const addOrder = (order: Order) => setOrders(prev => [order, ...prev]);
  const updateOrder = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
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
