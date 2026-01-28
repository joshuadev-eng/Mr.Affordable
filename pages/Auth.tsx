
import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { supabase } from '../supabaseClient.ts';

interface AuthPageProps {
  onLogin: (user: User) => void;
  currentUser: User | null;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, currentUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [authState, setAuthState] = useState<'form' | 'verification-sent'>('form');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

    // Trim inputs to prevent hidden whitespace errors
    const email = formData.email.trim();
    const password = formData.password.trim();
    const name = formData.name.trim();
    const phone = formData.phone.trim();

    try {
      if (isLogin) {
        // Supabase Login
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          // Provide more specific feedback for common errors
          if (signInError.message === 'Invalid login credentials') {
            throw new Error('The email or password you entered is incorrect. Please check for typos and try again.');
          } else if (signInError.message.includes('Email not confirmed')) {
            throw new Error('Your email address has not been verified. Please check your inbox for the confirmation link.');
          }
          throw signInError;
        }

        if (data.user) {
          const mappedUser: User = {
            id: data.user.id,
            name: data.user.user_metadata?.full_name || 'User',
            email: data.user.email || '',
            phone: data.user.user_metadata?.phone || '',
            role: data.user.user_metadata?.role || 'user',
            profilePic: data.user.user_metadata?.profilePic || '',
            isVerified: true
          };
          onLogin(mappedUser);
          navigate('/dashboard');
        }
      } else {
        // Sign Up Logic
        if (password !== formData.confirmPassword.trim()) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              phone: phone,
              role: 'user', // Default role for new signups
              profilePic: ''
            }
          }
        });

        if (signUpError) {
          if (signUpError.message.includes('valid email')) {
            throw new Error('Please enter a valid email address (e.g. name@example.com).');
          }
          throw signUpError;
        }

        if (data.user) {
          if (data.session) {
             const mappedUser: User = {
                id: data.user.id,
                name: data.user.user_metadata?.full_name || 'User',
                email: data.user.email || '',
                phone: data.user.user_metadata?.phone || '',
                role: data.user.user_metadata?.role || 'user',
                isVerified: true
              };
              onLogin(mappedUser);
              navigate('/dashboard');
          } else {
            setAuthState('verification-sent');
          }
        }
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
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
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-6 flex items-start border border-red-100 animate-pulse">
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
              <h2 className="text-3xl font-black text-gray-900 mb-4">Check Your Email</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                We've sent a verification link to <span className="text-teal-600 font-bold">{formData.email}</span>. Please click the link in your email to activate your account.
              </p>
              
              <button 
                onClick={() => {
                  setAuthState('form');
                  setIsLogin(true);
                }}
                className="text-gray-400 hover:text-teal-600 text-sm font-bold transition-colors"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i> Back to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
