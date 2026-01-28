
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
  const [showBypass, setShowBypass] = useState(false);
  const navigate = useNavigate();

  // Admin Master Credentials
  const ADMIN_EMAIL = 'admin@mraffordable.com';
  const ADMIN_PASSWORD = 'AdminAccess';

  if (currentUser) {
    return <Navigate to="/dashboard" />;
  }

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    // Liberian Format: +231 (77/88/55) XXXXXXX or 0 (77/88/55) XXXXXXX
    const re = /^(\+231|0)(77|88|55)\d{7}$/;
    return re.test(phone.replace(/\s+/g, ''));
  };

  const formatPhone = (phone: string) => {
    let cleaned = phone.replace(/\s+/g, '');
    if (cleaned.startsWith('0')) {
      return '+231' + cleaned.substring(1);
    }
    return cleaned;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setShowBypass(false);
  };

  const handleBypass = () => {
    onLogin({
      id: 'admin-bypass-session-' + Date.now(),
      name: 'System Admin (Bypass Mode)',
      email: ADMIN_EMAIL,
      phone: '+231 888 791 661',
      role: 'admin',
      isVerified: true
    });
    navigate('/dashboard');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowBypass(false);

    const email = formData.email.trim();
    const password = formData.password.trim();

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    if (!isLogin) {
      if (!validatePhone(formData.phone)) {
        setError('Invalid Phone Format. Please use +231 or 0 (e.g., +231 888 123 456)');
        setLoading(false);
        return;
      }
    }

    const finalPhone = !isLogin ? formatPhone(formData.phone) : '';

    try {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: 'System Admin' } }
          });

          if (signUpError) {
            if (signUpError.message.includes('Database error') || signUpError.status === 500) {
              setError('Database Error: Your Supabase Triggers are failing. Use "Bypass Auth" to proceed.');
              setShowBypass(true);
              return;
            }
            throw signUpError;
          }

          if (signUpData.user) {
            if (signUpData.session) {
              onLogin({
                id: signUpData.user.id,
                name: 'System Admin',
                email: ADMIN_EMAIL,
                phone: '+231 888 791 661',
                role: 'admin',
                isVerified: true
              });
              navigate('/dashboard');
              return;
            } else {
              setAuthState('verification-sent');
              return;
            }
          }
        }

        if (signInData.user) {
          onLogin({
            id: signInData.user.id,
            name: signInData.user.user_metadata?.full_name || 'System Admin',
            email: signInData.user.email || '',
            phone: signInData.user.user_metadata?.phone || '+231 888 791 661',
            role: 'admin',
            isVerified: true
          });
          navigate('/dashboard');
          return;
        }
      }

      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        if (data.user) {
          onLogin({
            id: data.user.id,
            name: data.user.user_metadata?.full_name || 'User',
            email: data.user.email || '',
            phone: data.user.user_metadata?.phone || '',
            role: data.user.email === ADMIN_EMAIL ? 'admin' : 'user',
            isVerified: true
          });
          navigate('/dashboard');
        }
      } else {
        if (password !== formData.confirmPassword.trim()) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: formData.name.trim(), phone: finalPhone } }
        });

        if (signUpError) {
          if (signUpError.message.includes('Database error') || signUpError.status === 500) {
            setError('Database Error: The server could not save your user record.');
            return;
          }
          throw signUpError;
        }

        if (data.user) {
          if (data.session) {
             onLogin({
                id: data.user.id,
                name: data.user.user_metadata?.full_name || 'User',
                email: data.user.email || '',
                phone: data.user.user_metadata?.phone || finalPhone,
                role: 'user',
                isVerified: true
              });
              navigate('/dashboard');
          } else {
            setAuthState('verification-sent');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'An authentication error occurred.');
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
                {isLogin ? 'Login to your dashboard' : 'Create an account to start shopping.'}
              </p>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 md:p-10">
              <div className="flex bg-gray-100 p-1 rounded-2xl mb-8">
                <button 
                  onClick={() => { setIsLogin(true); setError(''); setShowBypass(false); }}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${isLogin ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Login
                </button>
                <button 
                  onClick={() => { setIsLogin(false); setError(''); setShowBypass(false); }}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${!isLogin ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Sign Up
                </button>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold mb-6 border border-red-100 flex flex-col items-center">
                  <div className="flex items-start w-full">
                    <i className="fa-solid fa-circle-exclamation mt-0.5 mr-3"></i>
                    <span className="leading-relaxed">{error}</span>
                  </div>
                  {showBypass && (
                    <button 
                      onClick={handleBypass}
                      className="mt-4 w-full py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-black uppercase tracking-widest text-[10px]"
                    >
                      Bypass & Login as Admin
                    </button>
                  )}
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
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-sm font-bold text-gray-700">WhatsApp Number</label>
                        {!isLogin && formData.phone && !validatePhone(formData.phone) && (
                          <span className="text-[10px] text-red-500 font-bold uppercase">Invalid Format</span>
                        )}
                      </div>
                      <input 
                        type="tel" 
                        name="phone" 
                        required 
                        value={formData.phone}
                        onChange={handleChange}
                        className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl focus:bg-white outline-none transition-all ${!isLogin && formData.phone && !validatePhone(formData.phone) ? 'border-red-300' : 'border-transparent focus:border-teal-600'}`}
                        placeholder="+231 777 000 000"
                      />
                      <p className="text-[9px] text-gray-400 ml-1 font-bold">Use +231 or 0 prefix (e.g., 0777 123 456)</p>
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
                    placeholder="Enter password"
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

              {isLogin && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <button 
                    onClick={() => setFormData({ ...formData, email: ADMIN_EMAIL, password: ADMIN_PASSWORD })}
                    className="w-full py-3 bg-gray-50 text-gray-400 hover:text-teal-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-transparent hover:border-teal-100 hover:bg-teal-50"
                  >
                    Quick Load Admin Master
                  </button>
                </div>
              )}

              <p className="mt-6 text-center text-gray-500 text-sm">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button 
                  onClick={() => { setIsLogin(!isLogin); setError(''); setShowBypass(false); }}
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
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-teal-100">
              <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fa-solid fa-envelope-circle-check text-4xl text-teal-600"></i>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-4">Verification Sent</h2>
              <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                Check <span className="text-teal-600 font-bold">{formData.email}</span> for an activation link.
              </p>
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => { setAuthState('form'); setIsLogin(true); }}
                  className="text-teal-600 text-sm font-bold hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
