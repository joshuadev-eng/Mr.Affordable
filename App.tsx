
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import PocketBase from 'pocketbase';
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

// Initialize PocketBase with a persistent instance
export const pb = new PocketBase('http://127.0.0.1:8090');

const safeParse = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    return fallback;
  }
};

const App: React.FC = () => {
  // --- USER AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (pb.authStore.model) {
      return {
        id: pb.authStore.model.id,
        name: pb.authStore.model.name || pb.authStore.model.username,
        email: pb.authStore.model.email,
        phone: pb.authStore.model.phone || '',
        profilePic: pb.authStore.model.avatar ? pb.getFileUrl(pb.authStore.model, pb.authStore.model.avatar) : '',
        role: pb.authStore.model.role || 'user'
      };
    }
    return null;
  });

  // --- CART & WISHLIST STATE ---
  const [cart, setCart] = useState<CartItem[]>(() => safeParse('cart', []));
  const [wishlist, setWishlist] = useState<Product[]>(() => safeParse('wishlist', []));

  // --- DYNAMIC PRODUCTS STATE ---
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>(() => safeParse('orders', []));
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // --- FETCH PRODUCTS FROM POCKETBASE ---
  const fetchProducts = useCallback(async () => {
    try {
      const records = await pb.collection('products').getFullList({
        sort: '-created',
        requestKey: 'fetch_products_list' // prevent cancellation errors during fast navigation
      });
      
      const mappedProducts: Product[] = records.map(record => ({
        id: record.id,
        name: record.name,
        price: record.price,
        description: record.description,
        category: record.category,
        image: record.image ? (record.image.startsWith('http') ? record.image : pb.getFileUrl(record, record.image)) : '',
        userId: record.user,
        isApproved: record.isApproved,
        createdAt: new Date(record.created).getTime()
      }));
      
      setDbProducts(mappedProducts);
    } catch (err: any) {
      if (err.isAbort) return; // ignore intentional aborts
      
      console.warn("PocketBase Sync: Database products unavailable.", err.message);
      // Helpful diagnostics for the developer
      if (err.status === 404) {
        console.error("PocketBase Error: 'products' collection not found. Create it in the Admin UI.");
      } else if (err.status === 403) {
        console.error("PocketBase Error: Access denied. Set 'List' and 'View' API Rules to public.");
      }
    }
  }, []);

  useEffect(() => {
    fetchProducts();

    let unsubscribe: () => void;
    
    // Attempt real-time subscription
    const initSubscription = async () => {
      try {
        // Only attempt if the browser supports EventSource (SSE)
        if (typeof window.EventSource === 'undefined') {
          console.warn("Real-time updates not supported by this browser.");
          return;
        }

        unsubscribe = await pb.collection('products').subscribe('*', (e) => {
          console.log('Real-time action:', e.action);
          fetchProducts();
        });
      } catch (err: any) {
        // If subscription fails, it's often due to CORS or the collection not existing
        console.warn("PocketBase Subscription Warning: Real-time updates currently disabled.", err.message);
      }
    };

    initSubscription();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchProducts]);

  // --- COMBINED PRODUCTS LIST ---
  const allProducts = useMemo(() => {
    const combined = [...STATIC_PRODUCTS, ...dbProducts];
    return combined.filter(p => {
      // 1. Show static products (IDs starting with p, e, h, f, k, a)
      const isStatic = /^[pehfka]\d+$/.test(p.id);
      if (isStatic) return true;
      
      // 2. Show approved dynamic products
      if (p.isApproved) return true;
      
      // 3. Show unapproved products ONLY to the user who uploaded them
      if (currentUser && p.userId === currentUser.id) return true;
      
      return false;
    });
  }, [dbProducts, currentUser]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

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
    pb.authStore.clear();
    setCurrentUser(null);
  };

  const addOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
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
                  userProducts={dbProducts.filter(p => p.userId === currentUser.id)}
                  orders={orders.filter(o => o.userId === currentUser.id)}
                  onUpdateOrder={updateOrderStatus}
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
            <Route path="/checkout" element={<CheckoutPage cart={cart} clearCart={clearCart} user={currentUser} addOrder={addOrder} />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/wishlist" element={<WishlistPage wishlist={wishlist} toggleWishlist={toggleWishlist} addToCart={addToCart} onQuickView={setQuickViewProduct} />} />
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

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export default App;
