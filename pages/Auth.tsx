
import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { User } from '../types';

interface AuthPageProps {
  onLogin: (user: User) => void;
  currentUser: User | null;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, currentUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [authState, setAuthState] = useState<'form' | 'verification-sent' | 'verified'>('form');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Initialize Admin Account if not exists in LocalStorage
  useEffect(() => {
    const storedUsers: User[] = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const adminExists = storedUsers.some(u => u.email === 'admin@mraffordable.com');
    if (!adminExists) {
      const adminUser: User = {
        id: 'admin-001',
        name: 'System Admin',
        email: 'admin@mraffordable.com',
        phone: '+231 000 000 000',
        password: 'admin123',
        role: 'admin',
        profilePic: '',
        isVerified: true
      };
      storedUsers.push(adminUser);
      localStorage.setItem('registered_users', JSON.stringify(storedUsers));
    }
  }, []);

  if (currentUser) {
    return <Navigate to="/dashboard" />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const storedUsers: User[] = JSON.parse(localStorage.getItem('registered_users') || '[]');

      if (isLogin) {
        const user = storedUsers.find(u => u.email === formData.email && u.password === formData.password);
        if (user) {
          if (!user.isVerified) {
            setError('Please verify your email before logging in.');
            setPendingUser(user);
            setAuthState('verification-sent');
          } else {
            onLogin(user);
            navigate('/dashboard');
          }
        } else {
          setError('Invalid email or password.');
        }
      } else {
        // Sign Up Logic
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }

        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters.');
          setLoading(false);
          return;
        }

        if (storedUsers.some(u => u.email === formData.email)) {
          setError('Email already registered.');
          setLoading(false);
          return;
        }

        const newUser: User = {
          id: `user-${Date.now()}`,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: 'user',
          profilePic: '',
          isVerified: false // Needs verification
        };

        // Save to temporary state for verification flow
        setPendingUser(newUser);
        
        // Save to actual storage immediately but with isVerified: false
        storedUsers.push(newUser);
        localStorage.setItem('registered_users', JSON.stringify(storedUsers));
        
        setAuthState('verification-sent');
      }
    } catch (err) {
      setError('An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateVerify = async () => {
    if (!pendingUser) return;
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const storedUsers: User[] = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const updatedUsers = storedUsers.map(u => u.email === pendingUser.email ? { ...u, isVerified: true } : u);
    localStorage.setItem('registered_users', JSON.stringify(updatedUsers));
    
    setAuthState('verified');
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gray-50">
      <div className="max-w-md w-full">
        {authState === 'form' && (
          <div className="animate-fadeInUp">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-black text-teal-600 mb-2">Mr.Affordable</h1>
              <p className="text-gray-500 font-medium px-4">
                {isLogin ? 'Welcome back! Please login to your account.' : 'Create an account to start selling and shopping.'}
              </p>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 md:p-10">
              <div className="flex bg-gray-100 p-1 rounded-2xl mb-8">
                <button 
                  onClick={() => { setIsLogin(true); setError(''); }}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${isLogin ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Login
                </button>
                <button 
                  onClick={() => { setIsLogin(false); setError(''); }}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${!isLogin ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Sign Up
                </button>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-6 flex items-start border border-red-100">
                  <i className="fa-solid fa-circle-exclamation mt-0.5 mr-3"></i>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-5">
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                      <input 
                        type="text" 
                        name="name" 
                        required 
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all"
                        placeholder="Samuel K. Brown"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Phone Number</label>
                      <input 
                        type="tel" 
                        name="phone" 
                        required 
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all"
                        placeholder="+231 ..."
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    required 
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all"
                    placeholder="mrbrown@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
                  <input 
                    type="password" 
                    name="password" 
                    required 
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all"
                    placeholder="Enter your password"
                  />
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Confirm Password</label>
                    <input 
                      type="password" 
                      name="confirmPassword" 
                      required 
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all"
                      placeholder="Repeat password"
                    />
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center disabled:bg-teal-400"
                >
                  {loading ? <i className="fa-solid fa-circle-notch fa-spin text-xl"></i> : (isLogin ? 'Login Now' : 'Create Account')}
                </button>
              </form>

              <p className="mt-8 text-center text-gray-500 text-sm">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button 
                  onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  className="ml-2 text-teal-600 font-bold hover:underline"
                >
                  {isLogin ? 'Sign Up' : 'Login'}
                </button>
              </p>
            </div>
          </div>
        )}

        {authState === 'verification-sent' && (
          <div className="animate-fadeInUp text-center">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-teal-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-teal-600"></div>
              <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <i className="fa-solid fa-envelope-circle-check text-5xl text-teal-600"></i>
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-4">Verify Your Email</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                We've sent a verification link to <span className="text-teal-600 font-bold">{pendingUser?.email}</span>. Please click the link in your email to activate your account.
              </p>
              
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Developer Simulation</p>
                <button 
                  onClick={handleSimulateVerify}
                  disabled={loading}
                  className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:bg-gray-400"
                >
                  {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                  <span>Open Email & Verify</span>
                </button>
              </div>

              <button 
                onClick={() => setAuthState('form')}
                className="text-gray-400 hover:text-teal-600 text-sm font-bold transition-colors"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i> Back to Login
              </button>
            </div>
          </div>
        )}

        {authState === 'verified' && (
          <div className="animate-fadeInUp text-center">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-green-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <i className="fa-solid fa-circle-check text-5xl text-green-500"></i>
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-4">Account Verified!</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Your email has been successfully verified. You can now log in to your account and start using Mr.Affordable.
              </p>
              <button 
                onClick={() => { setIsLogin(true); setAuthState('form'); }}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all"
              >
                Go to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
