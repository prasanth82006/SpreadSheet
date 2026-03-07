import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useStore } from '../store';
import { FileSpreadsheet, Chrome } from 'lucide-react';
import { auth, googleProvider } from '../firebase.config';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
const API_URL = 'http://localhost:5000/api';
export default function Login() {
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [error, setError] = useState('');
     const [loading, setLoading] = useState(false);
     const { setAuth, syncGoogleUser } = useStore();
     const navigate = useNavigate();


     useEffect(() => {
          const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
               if (firebaseUser) {
                    console.log('Firebase user detected:', firebaseUser.email);
                    try {
                         await syncGoogleUser(firebaseUser);
                         console.log('Backend sync successful, navigating to home...');
                         navigate('/');
                    } catch (err: any) {
                         console.error('Google backend sync error:', err);
                         setError('Google sync failed. Please try again.');
                    }
               } else {
                    console.log('No active auth session.');
               }
          });

          return () => unsubscribe();
     }, [navigate, syncGoogleUser]);

     const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setLoading(true);
          setError('');
          try {
               const { data } = await axios.post(`${API_URL}/auth/login`, { email, password });
               setAuth(data, data.token);
               navigate('/');
          } catch (err: any) {
               setError(err.response?.data?.message || 'Login failed');
          } finally {
               setLoading(false);
          }
     };

     const handleGoogleSignIn = async () => {
          console.log('Starting Google Sign-In...');
          setLoading(true);
          setError('');
          try {
               await signInWithPopup(auth, googleProvider);
               console.log('Popup closed, waiting for auth state change...');
          } catch (err: any) {
               console.error('Google Sign-In Error:', err);
               setError('Google Sign-In failed: ' + err.message);
               setLoading(false);
          }
     };


     return (
          <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
               <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-zinc-200">
                    <div className="flex flex-col items-center mb-8">
                         <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                              <FileSpreadsheet className="text-blue-600" size={32} />
                         </div>
                         <h2 className="text-2xl font-bold text-zinc-900">Welcome Back</h2>
                         <p className="text-zinc-500 mt-2 text-center">Login to access your collaborative spreadsheets</p>
                    </div>

                    {error && (
                         <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                              {error}
                         </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                         <div>
                              <label htmlFor="email-input" className="block text-sm font-medium text-zinc-700 mb-2">Email Address</label>
                              <input
                                   id="email-input"
                                   type="email"
                                   required
                                   className="w-full px-4 py-3 rounded-xl border border-zinc-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                   placeholder="name@example.com"
                                   value={email}
                                   onChange={(e) => setEmail(e.target.value)}
                              />
                         </div>
                         <div>
                              <label htmlFor="password-input" className="block text-sm font-medium text-zinc-700 mb-2">Password</label>
                              <input
                                   id="password-input"
                                   type="password"
                                   required
                                   className="w-full px-4 py-3 rounded-xl border border-zinc-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                   placeholder="••••••••"
                                   value={password}
                                   onChange={(e) => setPassword(e.target.value)}
                              />
                         </div>
                         <button
                              type="submit"
                              disabled={loading}
                              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 active:transform active:scale-[0.98] transition-all disabled:opacity-50"
                         >
                              {loading ? 'Logging in...' : 'Sign In'}
                         </button>
                    </form>

                    <div className="relative my-8">
                         <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-zinc-200"></div>
                         </div>
                         <div className="relative flex justify-center text-sm">
                              <span className="px-2 bg-white text-zinc-500">Or continue with</span>
                         </div>
                    </div>

                    <button
                         onClick={handleGoogleSignIn}
                         disabled={loading}
                         className="w-full flex items-center justify-center gap-3 bg-white border border-zinc-300 text-zinc-700 py-3 rounded-xl font-semibold hover:bg-zinc-50 active:transform active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                         <Chrome size={20} className="text-blue-600" />
                         Sign in with Google
                    </button>

                    <p className="mt-8 text-center text-sm text-zinc-600">
                         Don't have an account?{' '}
                         <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                              Create one
                         </Link>
                    </p>
               </div>
          </div>
     );
}
