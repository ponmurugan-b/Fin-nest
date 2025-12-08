
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, Receipt, Target, PieChart, LogOut, User as UserIcon } from 'lucide-react';
import { dbService } from './services/dbService';
import { User } from './types';
import { DataProvider } from './contexts/DataContext';
import { initializeCacheManager, clearAllAppData, setAppVersion } from './utils/cacheManager';

// Lazy load components for better performance
const Dashboard = lazy(() => import('./components/Dashboard'));
const Wallets = lazy(() => import('./components/Wallets'));
const Transactions = lazy(() => import('./components/Transactions'));
const Savings = lazy(() => import('./components/Savings'));
const Reports = lazy(() => import('./components/Reports'));
const Profile = lazy(() => import('./components/Profile'));

// Auth loads immediately (first screen)
import Auth from './components/Auth';

// Loading spinner component
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
  </div>
);

const Navigation: React.FC<{ onLogout: () => void; user: User; onProfileClick: () => void }> = ({ onLogout, user, onProfileClick }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50';
  const isMobileActive = (path: string) => location.pathname === path ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600';

  const links = [
    { path: '/', label: 'Home', icon: LayoutDashboard },
    { path: '/wallets', label: 'Wallets', icon: Wallet },
    { path: '/transactions', label: 'Activity', icon: Receipt },
    { path: '/savings', label: 'Savings', icon: Target },
    { path: '/reports', label: 'Reports', icon: PieChart },
  ];

  const getInitials = () => {
    if (user.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.email[0].toUpperCase();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-slate-200 fixed left-0 top-0 z-20">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">FinNest</h1>
        </div>
        
        {/* User Profile Section */}
        <div className="p-4 border-b border-slate-100">
          <button 
            onClick={onProfileClick}
            className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            {user.profile_pic ? (
              <img src={user.profile_pic} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                {getInitials()}
              </div>
            )}
            <div className="text-left flex-1 min-w-0">
              <p className="font-medium text-slate-800 truncate">{user.name || 'Set your name'}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {links.map((link) => (
            <Link 
              key={link.path} 
              to={link.path} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive(link.path)}`}
            >
              <link.icon size={20} />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-rose-50 hover:text-rose-600 w-full transition-all font-medium"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 pb-safe">
        <div className="flex justify-around items-center h-16">
          {links.map((link) => (
            <Link 
              key={link.path} 
              to={link.path} 
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isMobileActive(link.path)}`}
            >
              <link.icon size={20} />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-30 px-4 py-3 flex items-center justify-between">
         <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <h1 className="text-lg font-bold text-slate-800">FinNest</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onProfileClick} className="p-2 text-slate-500 hover:text-emerald-600">
            {user.profile_pic ? (
              <img src={user.profile_pic} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <UserIcon size={20} />
            )}
          </button>
          <button onClick={onLogout} className="p-2 text-slate-400 hover:text-rose-500">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize app with timeout protection
    const initializeApp = async () => {
      // First, run synchronous cache check
      initializeCacheManager();
      
      try {
        const storedUser = localStorage.getItem('finnest_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          
          // Add timeout to database check (5 seconds)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 5000)
          );
          
          try {
            const dbUser = await Promise.race([
              dbService.auth.getUser(parsedUser.id),
              timeoutPromise
            ]) as User | null;
            
            if (dbUser) {
              setUser(dbUser);
              setAppVersion();
            } else {
              // User doesn't exist in DB, clear localStorage
              clearAllAppData();
              console.log('[App] Session expired - user not found');
            }
          } catch (dbError: any) {
            console.warn('[App] DB check failed, using cached user:', dbError.message);
            // On timeout/error, still use cached user to allow offline-ish usage
            setUser(parsedUser);
            setAppVersion();
          }
        } else {
          setAppVersion();
        }
      } catch (error: any) {
        console.error('[App] Initialization error:', error);
        setInitError(error.message || 'Failed to initialize app');
        clearAllAppData();
      } finally {
        setLoading(false);
      }
    };
    
    initializeApp();
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('finnest_user', JSON.stringify(userData));
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('finnest_user', JSON.stringify(updatedUser));
  };

  const handleLogout = async () => {
    await dbService.auth.signOut();
    localStorage.removeItem('finnest_user');
    setUser(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-emerald-600 font-bold animate-pulse">Connecting to Nest...</div>;

  // Show error screen if initialization failed
  if (initError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-rose-500 text-2xl">!</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Connection Error</h2>
          <p className="text-slate-500 mb-6 text-sm">{initError}</p>
          <button
            onClick={() => {
              clearAllAppData();
              window.location.reload();
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition-all"
          >
            Clear Cache & Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <Router>
      <DataProvider user={user}>
        <div className="min-h-screen bg-gray-50 flex">
          <Navigation onLogout={handleLogout} user={user} onProfileClick={() => setShowProfile(true)} />
          {/* Added pb-20 to allow space for bottom nav on mobile */}
          <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8 overflow-y-auto min-h-screen">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Dashboard user={user} />} />
                <Route path="/wallets" element={<Wallets user={user} />} />
                <Route path="/transactions" element={<Transactions user={user} />} />
                <Route path="/savings" element={<Savings user={user} />} />
                <Route path="/reports" element={<Reports user={user} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
          
          {/* Profile Modal */}
          {showProfile && (
            <Suspense fallback={<PageLoader />}>
              <Profile 
                user={user} 
                onUserUpdate={handleUserUpdate} 
                onClose={() => setShowProfile(false)} 
              />
            </Suspense>
          )}
        </div>
      </DataProvider>
    </Router>
  );
}
