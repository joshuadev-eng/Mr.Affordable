
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
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
import SuccessPage from './pages/SuccessPage.tsx';
import WishlistPage from './pages/WishlistPage.tsx';
import AuthPage from './pages/Auth.tsx';
import Dashboard from './pages/Dashboard.tsx';

const safeParse = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    return fallback;
  }
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => safeParse('current_user', null));
  const [cart, setCart] = useState<CartItem[]>(() => safeParse('cart', []));
  const [wishlist, setWishlist] = useState<Product[]>(() => safeParse('wishlist', []));
  const [localProducts, setLocalProducts] = useState<Product[]>(() => safeParse('local_products', []));
  const [orders, setOrders] = useState<Order[]>(() => safeParse('orders', []));
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => { localStorage.setItem('current_user', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('wishlist', JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { localStorage.setItem('orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('local_products', JSON.stringify(localProducts)); }, [localProducts]);

  const allProducts = useMemo(() => {
    const combined = [...STATIC_PRODUCTS, ...localProducts];
    return combined.filter(p => {
      // Always show original data
      if (/^[pehfka]\d+$/.test(p.id)) return true;
      // Show approved local data
      if (p.isApproved) return true;
      // Show owner their own pending data
      if (currentUser && p.userId === currentUser.id) return true;
      // Show admin all data
      if (currentUser?.role === 'admin') return true;
      return false;
    });
  }, [localProducts, currentUser]);

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

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(item => item.id !== productId));
  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };
  const clearCart = () => setCart([]);

  const toggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const exists = prev.find(item => item.id === product.id);
      return exists ? prev.filter(item => item.id !== product.id) : [...prev, product];
    });
  };

  const toggleProductApproval = (productId: string) => {
    setLocalProducts(prev => prev.map(p => p.id === productId ? { ...p, isApproved: !p.isApproved } : p));
  };

  const handleLogout = () => setCurrentUser(null);
  const addOrder = (newOrder: Order) => setOrders(prev => [newOrder, ...prev]);
  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };
  const handleAddLocalProduct = (newProduct: Product) => setLocalProducts(prev => [newProduct, ...prev]);

  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen relative">
        <Navbar cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} wishlistCount={wishlist.length} currentUser={currentUser} onLogout={handleLogout} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home products={allProducts} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlist={wishlist} onQuickView={setQuickViewProduct} currentUser={currentUser} />} />
            <Route path="/auth" element={<AuthPage onLogin={setCurrentUser} currentUser={currentUser} />} />
            <Route path="/dashboard" element={currentUser ? <Dashboard user={currentUser} onUpdateUser={setCurrentUser} userProducts={localProducts.filter(p => p.userId === currentUser.id)} orders={orders.filter(o => o.userId === currentUser.id)} onUpdateOrder={updateOrderStatus} onAddProduct={handleAddLocalProduct} onToggleApproval={toggleProductApproval} allLocalProducts={localProducts} /> : <Navigate to="/auth" />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/category/:categoryName" element={<ProductListing products={allProducts} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlist={wishlist} onQuickView={setQuickViewProduct} currentUser={currentUser} />} />
            <Route path="/product/:productId" element={<ProductDetail products={allProducts} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlist={wishlist} onQuickView={setQuickViewProduct} />} />
            <Route path="/cart" element={<CartPage cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />} />
            <Route path="/checkout" element={<CheckoutPage cart={cart} clearCart={clearCart} user={currentUser} addOrder={addOrder} />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/wishlist" element={<WishlistPage wishlist={wishlist} toggleWishlist={toggleWishlist} addToCart={addToCart} onQuickView={setQuickViewProduct} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
        <FloatingWhatsApp />
        {quickViewProduct && <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} addToCart={addToCart} />}
      </div>
    </Router>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

export default App;
