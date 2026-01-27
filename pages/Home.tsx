import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PRODUCTS, CATEGORIES } from '../data';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

interface HomeProps {
  addToCart: (product: Product) => void;
  toggleWishlist: (product: Product) => void;
  wishlist: Product[];
  onQuickView: (product: Product) => void;
}

const Home: React.FC<HomeProps> = ({ addToCart, toggleWishlist, wishlist, onQuickView }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const featuredProducts = PRODUCTS.slice(0, 12);

  const slides = [
    {
      url: "https://images.unsplash.com/photo-1585298723682-7115561c51b7?w=1600&auto=format&fit=crop&q=80",
      title: "Mr.Affordable",
      subtitle: "Quality Phones, Electronics & Home Appliances"
    },
    {
      url: "https://images.unsplash.com/photo-1701680848891-89a6a4e9e31a?w=1600&auto=format&fit=crop&q=80",
      title: "Mr.Affordable",
      subtitle: "Quality Phones, Electronics & Home Appliances"
    },
    {
      url: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=1600&auto=format&fit=crop&q=80",
      title: "Mr.Affordable",
      subtitle: "Quality Phones, Electronics & Home Appliances"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      await fetch('https://formspree.io/f/mrbrownliberia@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'New Newsletter Subscription',
          email: email,
          message: `Someone just subscribed to the Mr.Affordable newsletter with email: ${email}`
        })
      });
      setIsSuccess(true);
      setEmail('');
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (err) {
      console.error("Subscription failed", err);
      alert("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white overflow-hidden">
      {/* Hero Slider Section */}
      <section className="relative w-full h-[55vh] md:h-[80vh] bg-gray-900 overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 bg-black/50 z-10"></div>
            <img
              src={slide.url}
              alt={`Slide ${index + 1}`}
              className="w-full h-full object-cover transform scale-105"
            />
            
            {/* Overlay Content */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6">
              <div className="max-w-4xl space-y-3 md:space-y-6">
                <h1 className="text-white text-3xl sm:text-5xl md:text-8xl font-black tracking-tight drop-shadow-2xl animate-fadeInUp">
                  {slide.title}
                </h1>
                <p className="text-gray-100 text-sm sm:text-lg md:text-2xl font-medium tracking-wide drop-shadow-md animate-fadeInUp delay-100 max-w-lg mx-auto">
                  {slide.subtitle}
                </p>
                <div className="pt-2 md:pt-8 animate-fadeInUp delay-200">
                  <Link
                    to="/categories"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 md:px-14 md:py-5 rounded-full text-sm md:text-xl font-bold shadow-2xl transition-all hover:scale-105 active:scale-95"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Slide Indicators */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex space-x-2 md:space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'w-8 md:w-10 bg-blue-600' : 'w-1.5 md:w-2 bg-white/50'
              }`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Category Ribbon */}
      <section className="bg-gray-100 py-4 md:py-10 border-b border-gray-200">
        <div className="container mx-auto px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <div className="flex items-center space-x-6 md:space-x-8">
            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px] md:text-xs flex-shrink-0">Shop By:</span>
            {CATEGORIES.map(cat => (
              <Link 
                key={cat} 
                to={`/category/${encodeURIComponent(cat)}`}
                className="text-gray-600 hover:text-blue-600 font-bold transition-colors text-sm md:text-base"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section id="featured" className="py-12 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-16 gap-4">
            <div>
              <h2 className="text-2xl md:text-5xl font-black text-gray-900 mb-2 md:mb-4">New Arrivals</h2>
              <div className="w-12 md:w-24 h-1.5 md:h-2 bg-blue-600 rounded-full"></div>
            </div>
            <p className="text-gray-500 max-w-md text-xs md:text-base">
              Fresh stock just arrived! Explore our latest collection of premium gadgets and home essentials.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10">
            {featuredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                addToCart={addToCart} 
                toggleWishlist={toggleWishlist}
                onQuickView={onQuickView}
                isWishlisted={wishlist.some(item => item.id === product.id)}
              />
            ))}
          </div>

          <div className="mt-8 md:mt-20 text-center">
            <Link 
              to="/categories" 
              className="inline-flex items-center space-x-3 bg-gray-900 text-white px-6 py-4 md:px-12 md:py-5 rounded-xl md:rounded-2xl font-black hover:bg-black transition-all hover:scale-105 shadow-xl text-sm md:text-base"
            >
              <span>Explore All Products</span>
              <i className="fa-solid fa-plus text-xs md:text-sm"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 md:py-24 bg-blue-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 md:w-96 md:h-96 bg-blue-800 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 md:w-96 md:h-96 bg-blue-700 rounded-full opacity-50 blur-3xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-10 md:mb-20">
            <h2 className="text-2xl md:text-5xl font-black mb-4 md:mb-6">Why Mr.Affordable?</h2>
            <p className="text-blue-200 max-w-2xl mx-auto text-sm md:text-lg">We are committed to delivering the best value for your money with exceptional service.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
            <div className="bg-white/5 backdrop-blur-md p-6 md:p-10 rounded-2xl md:rounded-3xl border border-white/10 hover:border-blue-400 transition-colors group">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-8 group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-truck-fast text-lg md:text-2xl"></i>
              </div>
              <h3 className="text-lg md:text-2xl font-bold mb-2 md:mb-4">Fastest Delivery</h3>
              <p className="text-blue-100 leading-relaxed text-xs md:text-base">We deliver to your doorstep anywhere in Monrovia.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-6 md:p-10 rounded-2xl md:rounded-3xl border border-white/10 hover:border-blue-400 transition-colors group">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-8 group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-shield-check text-lg md:text-2xl"></i>
              </div>
              <h3 className="text-lg md:text-2xl font-bold mb-2 md:mb-4">Guaranteed Quality</h3>
              <p className="text-blue-100 leading-relaxed text-xs md:text-base">Every product is tested and verified for quality before it leaves our warehouse.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-6 md:p-10 rounded-2xl md:rounded-3xl border border-white/10 hover:border-blue-400 transition-colors group">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-8 group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-hand-holding-dollar text-lg md:text-2xl"></i>
              </div>
              <h3 className="text-lg md:text-2xl font-bold mb-2 md:mb-4">Best Pricing</h3>
              <p className="text-blue-100 leading-relaxed text-xs md:text-base">Our name says it all. We offer the most competitive prices on the market.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12 md:py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="bg-blue-50 rounded-3xl md:rounded-[3rem] p-8 md:p-20 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl md:text-5xl font-black text-gray-900 mb-2 md:mb-6">Stay Updated</h2>
              <p className="text-gray-600 text-sm md:text-lg mb-6 md:mb-12 max-w-xl mx-auto">Subscribe to our weekly updates and never miss out on our limited-time affordable deals.</p>
              
              {isSuccess ? (
                <div className="bg-green-100 text-green-700 p-4 md:p-6 rounded-2xl animate-fadeInUp max-w-lg mx-auto">
                  <i className="fa-solid fa-circle-check text-xl md:text-2xl mb-2"></i>
                  <p className="font-bold text-sm md:text-base">Thank you for subscribing!</p>
                  <p className="text-xs md:text-sm">We've added your email to our list for exclusive offers.</p>
                </div>
              ) : (
                <form className="flex flex-col sm:flex-row gap-3 md:gap-4 max-w-lg mx-auto" onSubmit={handleSubscribe}>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email" 
                    className="flex-grow px-5 md:px-8 py-3.5 md:py-5 rounded-xl md:rounded-2xl bg-white border-none shadow-sm focus:ring-2 focus:ring-blue-600 outline-none text-sm md:text-lg"
                    disabled={isSubmitting}
                  />
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 md:px-10 py-3.5 md:py-5 rounded-xl md:rounded-2xl transition-all shadow-xl flex items-center justify-center disabled:bg-gray-400 text-sm md:text-base"
                  >
                    {isSubmitting ? <i className="fa-solid fa-circle-notch fa-spin text-xl"></i> : 'Subscribe'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;