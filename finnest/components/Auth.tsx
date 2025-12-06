
import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import { dbService } from '../services/dbService';
import { generateVerificationUrl, getVerificationEmailContent } from '../services/emailService';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

type AuthView = 'login' | 'signup' | 'verification-sent' | 'verify-success';

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string>('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    try {
      const result = await dbService.auth.signIn(email, password);
      if (result.error) {
        if ((result as any).needsVerification) {
          setError("Please verify your email before signing in. Check your inbox.");
        } else {
          throw result.error;
        }
        return;
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
      
      if (result.verificationToken) {
        const url = generateVerificationUrl(result.verificationToken);
        setVerificationUrl(url);
        
        // Log verification info for demo (in production, send email via backend)
        const emailContent = getVerificationEmailContent(name, url);
        console.log('📧 Verification Email:', emailContent);
        console.log('🔗 Verification URL:', url);
        
        setView('verification-sent');
      }
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await dbService.auth.resendVerification(email);
      if (result.error) throw result.error;
      
      if (result.verificationToken) {
        const url = generateVerificationUrl(result.verificationToken);
        setVerificationUrl(url);
        console.log('🔗 New Verification URL:', url);
      }
    } catch (err: any) {
      setError(err.message || "Failed to resend verification");
    } finally {
      setLoading(false);
    }
  };

  // Check for verification token in URL
  React.useEffect(() => {
    const hash = window.location.hash;
    // Match pattern #/verify/TOKEN
    const verifyMatch = hash.match(/#\/verify\/([^/]+)/);
    
    if (verifyMatch && verifyMatch[1]) {
      verifyToken(verifyMatch[1]);
    }
  }, []);

  const verifyToken = async (token: string) => {
    setLoading(true);
    try {
      const result = await dbService.auth.verifyEmail(token);
      if (result.error) {
        setError(result.error.message);
        return;
      }
      
      if (result.success && result.user) {
        setView('verify-success');
        // Clear token from URL
        window.location.hash = '/';
        // Auto-login after verification
        setTimeout(() => {
          onLogin(result.user!);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // Verification sent view
  if (view === 'verification-sent') {
    return (
      <div className="min-h-screen bg-emerald-500 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 md:p-12">
          <div className="text-center">
            <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="text-emerald-600" size={40} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h1>
            <p className="text-slate-500 mb-6">
              We've sent a verification link to<br />
              <span className="font-medium text-slate-700">{email}</span>
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-amber-800 text-sm">
                <strong>Demo Mode:</strong> Check the browser console for the verification link, 
                or click the link below:
              </p>
              {verificationUrl && (
                <a 
                  href={verificationUrl}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium break-all mt-2 block"
                >
                  Click to verify →
                </a>
              )}
            </div>

            <button
              onClick={handleResendVerification}
              disabled={loading}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium mb-4"
            >
              {loading ? 'Sending...' : "Didn't receive? Resend email"}
            </button>
            
            <div className="border-t border-slate-100 pt-4 mt-4">
              <button
                onClick={() => { setView('login'); setError(null); }}
                className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium mx-auto"
              >
                <ArrowLeft size={16} />
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Verification success view
  if (view === 'verify-success') {
    return (
      <div className="min-h-screen bg-emerald-500 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 md:p-12">
          <div className="text-center">
            <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-emerald-600" size={40} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Email Verified!</h1>
            <p className="text-slate-500 mb-6">
              Your account has been verified successfully.<br />
              Redirecting you to your dashboard...
            </p>
            <div className="animate-pulse text-emerald-600">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isLogin = view === 'login';

  return (
    <div className="min-h-screen bg-emerald-500 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transform rotate-3">
             <span className="text-emerald-600 font-bold text-3xl">F</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">FinNest</h1>
          <p className="text-slate-500 mt-2">Your personal finance sanctuary.</p>
        </div>

        <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-sm text-center font-medium">
              {error}
            </div>
          )}
          
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Your Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 outline-none transition-all"
                placeholder="John Doe"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 outline-none transition-all"
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 outline-none transition-all"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                <span>{isLogin ? 'Enter Nest' : 'Create Account'}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setView(isLogin ? 'signup' : 'login'); setError(null); }}
            className="text-slate-500 hover:text-emerald-600 text-sm font-medium transition-colors"
          >
            {isLogin ? "Need an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
