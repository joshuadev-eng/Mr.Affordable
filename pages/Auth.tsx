
import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { pb } from '../App.tsx';

interface AuthPageProps {
  onLogin: (user: User) => void;
  currentUser: User | null;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, currentUser }) => {
  const [isLogin, setIsLogin] = useState(true);
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

    try {
      if (isLogin) {
        // Login with PocketBase
        const authData = await pb.collection('users').authWithPassword(formData.email, formData.password);
        const user: User = {
          id: authData.model.id,
          name: authData.model.name || authData.model.username,
          email: authData.model.email,
          phone: authData.model.phone || '',
          profilePic: authData.model.avatar ? pb.getFileUrl(authData.model, authData.model.avatar) : '',
          role: authData.model.role || 'user'
        };
        onLogin(user);
        navigate('/dashboard');
      } else {
        // Signup with PocketBase
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        const data = {
          username: formData.email.split('@')[0] + Math.floor(Math.random() * 1000),
          email: formData.email,
          password: formData.password,
          passwordConfirm: formData.confirmPassword,
          name: formData.name,
          phone: formData.phone,
          role: 'user'
        };

        await pb.collection('users').create(data);
        
        // Auto-login after signup
        const authData = await pb.collection('users').authWithPassword(formData.email, formData.password);
        const user: User = {
          id: authData.model.id,
          name: authData.model.name || authData.model.username,
          email: authData.model.email,
          phone: authData.model.phone || '',
          profilePic: authData.model.avatar ? pb.getFileUrl(authData.model, authData.model.avatar) : '',
          role: authData.model.role || 'user'
        };
        onLogin(user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gray-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-teal-600 mb-2">Mr.Affordable</h1>
          <p className="text-gray-500 font-medium">
            {isLogin ? 'Welcome back! Please login to your account.' : 'Create an account to start selling and shopping.'}
          </p>
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
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-6 flex items-center">
              <i className="fa-solid fa-circle-exclamation mr-3"></i>
              {error}
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
                placeholder="••••••••"
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
                  placeholder="••••••••"
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center"
            >
              {loading ? <i className="fa-solid fa-circle-notch fa-spin text-xl"></i> : (isLogin ? 'Login Now' : 'Create Account')}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-500 text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-teal-600 font-bold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
