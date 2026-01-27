
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
  const [localProducts, setLocalProducts] = useState<Product[]>(() => JSON.parse(localStorage.getItem('local_products') || '[]'));
  const [orders, setOrders] = useState<Order[]>(() => JSON.parse(localStorage.getItem('orders') || '[]'));
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => localStorage.setItem('cart', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('wishlist', JSON.stringify(wishlist)), [wishlist]);
  useEffect(() => localStorage.setItem('current_user', JSON.stringify(currentUser)), [currentUser]);
  useEffect(() => localStorage.setItem('local_products', JSON.stringify(localProducts)), [localProducts]);
  useEffect(() => localStorage.setItem('orders', JSON.stringify(orders)), [orders]);

  const allProducts = useMemo(() => {
    const approvedLocal = localProducts.filter(p => p.isApproved);
    return [...STATIC_PRODUCTS, ...approvedLocal];
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

  const handleAddProduct = (product: Product) => setLocalProducts(prev => [...prev, product]);

  const handleUpdateProduct = (updatedProduct: Product) => {
    setLocalProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleDeleteProduct = (productId: string) => {
    setLocalProducts(prev => prev.filter(p => p.id !== productId));
    // Also remove from wishlist if present
    setWishlist(prev => prev.filter(p => p.id !== productId));
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
                  userProducts={localProducts.filter(p => p.userId === currentUser.id)} 
                  orders={orders.filter(o => o.userId === currentUser.id || currentUser.role === 'admin')}
                  onUpdateOrder={updateOrder}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
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
