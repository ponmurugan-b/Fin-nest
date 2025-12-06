
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, Receipt, Target, PieChart, LogOut, User as UserIcon } from 'lucide-react';
import { dbService } from './services/dbService';
import { User } from './types';
import { DataProvider } from './contexts/DataContext';

// Components
import Dashboard from './components/Dashboard';
import Wallets from './components/Wallets';
import Transactions from './components/Transactions';
import Savings from './components/Savings';
import Reports from './components/Reports';
import Auth from './components/Auth';
import Profile from './components/Profile';

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

  useEffect(() => {
    // Check local storage for session and verify user still exists
    const checkUser = async () => {
      const storedUser = localStorage.getItem('finnest_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Verify user exists in database
        const dbUser = await dbService.auth.getUser(parsedUser.id);
        if (dbUser) {
          setUser(dbUser);
        } else {
          // User doesn't exist in DB anymore, clear localStorage
          localStorage.removeItem('finnest_user');
          console.log('Session expired - user no longer exists in database');
        }
      }
      setLoading(false);
    };
    checkUser();
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
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/wallets" element={<Wallets user={user} />} />
              <Route path="/transactions" element={<Transactions user={user} />} />
              <Route path="/savings" element={<Savings user={user} />} />
              <Route path="/reports" element={<Reports user={user} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          
          {/* Profile Modal */}
          {showProfile && (
            <Profile 
              user={user} 
              onUserUpdate={handleUserUpdate} 
              onClose={() => setShowProfile(false)} 
            />
          )}
        </div>
      </DataProvider>
    </Router>
  );
}
