
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

  // Master Admin Credentials
  const ADMIN_EMAIL = 'admin@mraffordable.com';
  const ADMIN_PASSWORD = 'AdminAccess2024';

  if (currentUser) {
    return <Navigate to="/dashboard" />;
  }

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    const re = /^(\+231|0)(77|88|55)\d{7}$/;
    return re.test(phone.replace(/\s+/g, ''));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const email = formData.email.trim();
    const password = formData.password.trim();

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    // Special Master Admin Bypass Logic
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      onLogin({
        id: 'master-admin-001',
        name: 'Master Admin',
        email: ADMIN_EMAIL,
        phone: '+231 888 791 661',
        role: 'admin',
        isVerified: true
      });
      navigate('/dashboard');
      return;
    }

    try {
      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        
        if (data?.user) {
          onLogin({
            id: data.user.id,
            name: data.user.user_metadata?.full_name || 'User',
            email: data.user.email || '',
            phone: data.user.user_metadata?.phone || '',
            role: data.user.email === ADMIN_EMAIL ? 'admin' : (data.user.user_metadata?.role || 'user'),
            isVerified: true
          });
          navigate('/dashboard');
        }
      } else {
        if (!validatePhone(formData.phone)) {
          setError('Invalid Phone Format (e.g., +231 888 123 456)');
          setLoading(false);
          return;
        }

        if (password !== formData.confirmPassword.trim()) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { 
              full_name: formData.name.trim(), 
              phone: formData.phone,
              role: email === ADMIN_EMAIL ? 'admin' : 'user'
            } 
          }
        });

        if (signUpError) {
          // Fallback if Supabase triggers are missing
          if (signUpError.message.includes('Database error')) {
            setError('Account creation error. Please try logging in with the Master Admin details provided.');
          } else {
            throw signUpError;
          }
          return;
        }

        if (data.user) {
          if (data.session) {
            onLogin({
              id: data.user.id,
              name: data.user.user_metadata?.full_name || 'User',
              email: data.user.email || '',
              phone: data.user.user_metadata?.phone || formData.phone,
              role: email === ADMIN_EMAIL ? 'admin' : 'user',
              isVerified: true
            });
            navigate('/dashboard');
          } else {
            setAuthState('verification-sent');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
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
              <p className="text-gray-500 font-medium">Dashboard Access</p>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 md:p-10">
              <div className="flex bg-gray-100 p-1 rounded-2xl mb-8">
                <button 
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${isLogin ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Login
                </button>
                <button 
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${!isLogin ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Sign Up
                </button>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold mb-6 border border-red-100">
                  <i className="fa-solid fa-circle-exclamation mr-3"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-5">
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                      <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">WhatsApp Number</label>
                      <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" placeholder="+231..." />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Email</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
                  <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Confirm Password</label>
                    <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-teal-600 outline-none transition-all" />
                  </div>
                )}

                <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 disabled:bg-teal-400">
                  {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (isLogin ? 'Login' : 'Create Account')}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
