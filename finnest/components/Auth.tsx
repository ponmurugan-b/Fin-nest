import React, { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { dbService } from '../services/dbService';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    try {
      const result = await dbService.auth.signIn(email, password);
      if (result.error) {
        throw result.error;
      }
      if (result.user) onLogin(result.user);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    try {
      const result = await dbService.auth.signUp(email, password, name);
      if (result.error) throw result.error;
      
      // Auto-login after signup (no email verification)
      if (result.user) {
        onLogin(result.user);
      }
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-emerald-600 flex flex-col justify-center items-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 md:p-10">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
             <span className="text-emerald-600 font-bold text-3xl">F</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">FinNest</h1>
          <p className="text-slate-500 mt-2 text-sm">Your personal finance sanctuary.</p>
        </div>

        <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-5">
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-600 text-sm text-center font-medium border border-rose-100">
              {error}
            </div>
          )}
          
          {/* Name Field (Sign Up only) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full py-2.5 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                placeholder="John Doe"
              />
            </div>
          )}
          
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-2.5 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              placeholder="you@example.com"
              required
            />
          </div>
          
          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-2.5 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <>
                {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                <span>{isLogin ? 'Enter Nest' : 'Create Account'}</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle Sign In / Sign Up */}
        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-slate-500 hover:text-emerald-600 text-sm font-medium transition-colors focus:outline-none focus:underline"
          >
            {isLogin ? "Need an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
      
      {/* Footer */}
      <p className="mt-6 text-emerald-100 text-xs">© 2025 FinNest. All rights reserved.</p>
    </div>
  );
};

export default Auth;
