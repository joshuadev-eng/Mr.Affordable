
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { CartItem, Product, User } from './types';
import { PRODUCTS } from './data';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import QuickViewModal from './components/QuickViewModal';

// Pages
import Home from './pages/Home';
import CategoriesPage from './pages/CategoriesPage';
import ProductListing from './pages/ProductListing';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import SuccessPage from './pages/SuccessPage';
import WishlistPage from './pages/WishlistPage';
import AuthPage from './pages/Auth';
import Dashboard from './pages/Dashboard';

const App: React.FC = () => {
  // --- USER AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  // --- CART & WISHLIST STATE ---
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const saved = localStorage.getItem('wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  // --- USER UPLOADED PRODUCTS STATE ---
  const [customProducts, setCustomProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('customProducts');
    return saved ? JSON.parse(saved) : [];
  });

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // --- COMBINED PRODUCTS LIST ---
  // We filter to show only approved products or products the current user uploaded
  const allProducts = useMemo(() => {
    return [...PRODUCTS, ...customProducts].filter(p => 
      p.isApproved !== false || p.userId === currentUser?.id
    );
  }, [customProducts, currentUser]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('customProducts', JSON.stringify(customProducts));
  }, [customProducts]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      // Also update the users list in storage
      const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
      const index = users.findIndex(u => u.id === currentUser.id);
      if (index > -1) {
        users[index] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
      }
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    setQuickViewProduct(null);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.filter(item => item.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleAddProduct = (newProduct: Product) => {
    setCustomProducts(prev => [newProduct, ...prev]);
  };

  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
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
                products={allProducts}
                addToCart={addToCart} 
                toggleWishlist={toggleWishlist} 
                wishlist={wishlist} 
                onQuickView={setQuickViewProduct} 
              />
            } />
            <Route path="/auth" element={<AuthPage onLogin={setCurrentUser} currentUser={currentUser} />} />
            <Route path="/dashboard" element={
              currentUser ? (
                <Dashboard 
                  user={currentUser} 
                  onUpdateUser={setCurrentUser} 
                  onAddProduct={handleAddProduct}
                  userProducts={customProducts.filter(p => p.userId === currentUser.id)}
                />
              ) : (
                <Navigate to="/auth" />
              )
            } />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/category/:categoryName" element={
              <ProductListing 
                products={allProducts}
                addToCart={addToCart} 
                toggleWishlist={toggleWishlist} 
                wishlist={wishlist} 
                onQuickView={setQuickViewProduct} 
              />
            } />
            <Route path="/product/:productId" element={
              <ProductDetail 
                products={allProducts}
                addToCart={addToCart} 
                toggleWishlist={toggleWishlist} 
                wishlist={wishlist} 
                onQuickView={setQuickViewProduct} 
              />
            } />
            <Route path="/cart" element={<CartPage cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />} />
            <Route path="/checkout" element={<CheckoutPage cart={cart} clearCart={clearCart} user={currentUser} />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/wishlist" element={<WishlistPage wishlist={wishlist} toggleWishlist={toggleWishlist} addToCart={addToCart} onQuickView={setQuickViewProduct} />} />
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

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export default App;
