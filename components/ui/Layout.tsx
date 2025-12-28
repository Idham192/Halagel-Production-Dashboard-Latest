
import React, { ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { Category, ProductionEntry } from '../../types';
import { CATEGORIES } from '../../constants';
import { LoginModal } from '../modals/LoginModal';
import { InputModal } from '../modals/InputModal';
import { UserModal } from '../modals/UserModal';
import { OffDayModal } from '../modals/OffDayModal';
import { ChangePasswordModal } from '../modals/ChangePasswordModal';
import { GoogleSheetsService } from '../../services/googleSheetsService';
import { StorageService } from '../../services/storageService';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, Moon, Sun, Plus, LogOut, Database,
  CalendarX, LayoutDashboard, RefreshCw, LogIn, CheckCircle, Info, Bell,
  ClipboardList, Users, History, Key, Settings
} from 'lucide-react';

export const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, logout, hasPermission } = useAuth();
  const { category, setCategory, isDarkMode, toggleDarkMode, triggerRefresh } = useDashboard();
  const location = useLocation();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showOffDays, setShowOffDays] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<ProductionEntry | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const timeoutRef = useRef<number | null>(null);

  const handleNotify = useCallback((e: any) => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setNotification({ message: e.detail.message, type: e.detail.type || 'success' });
    timeoutRef.current = window.setTimeout(() => {
      setNotification(null);
      timeoutRef.current = null;
    }, 5000);
  }, []);

  const handleEditEntry = useCallback((e: any) => {
    setEntryToEdit(e.detail);
    setShowInput(true);
  }, []);

  const handleLogout = () => {
    const userName = user?.name || 'User';
    logout();
    window.dispatchEvent(new CustomEvent('app-notification', { 
      detail: { message: `LOGOUT SUCCESSFUL: GOODBYE ${userName.toUpperCase()}`, type: 'success' } 
    }));
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    window.addEventListener('app-notification', handleNotify);
    window.addEventListener('edit-production-entry', handleEditEntry);
    return () => {
      window.removeEventListener('app-notification', handleNotify);
      window.removeEventListener('edit-production-entry', handleEditEntry);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [handleNotify, handleEditEntry]);

  const handleSync = async () => {
    if (!GoogleSheetsService.isEnabled()) {
      window.dispatchEvent(new CustomEvent('app-notification', { 
        detail: { message: 'DB ERROR: PLEASE CONFIGURE GOOGLE SHEETS IN USER MGMT', type: 'info' } 
      }));
      return;
    }
    setIsSyncing(true);
    try {
      await StorageService.syncWithSheets();
      triggerRefresh();
      window.dispatchEvent(new CustomEvent('app-notification', { 
        detail: { message: 'CLOUD DATA SYNCHRONIZED', type: 'success' } 
      }));
    } catch (e) {
      window.dispatchEvent(new CustomEvent('app-notification', { 
        detail: { message: 'SYNC FAILED - CHECK CONNECTION', type: 'info' } 
      }));
    } finally {
      setIsSyncing(false);
    }
  };

  const navItemClass = (path: string) => `
    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
    ${location.pathname === path 
      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800' 
      : 'text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800'}
  `;

  const logoBase64 = "data:image/png;base64,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P0I6X/p9Y7U1D7Wz6tD568XF4j6/pI48UfGofA9NntI8H5Pvp8uD4UvS/D8r7377+G49VvV5tP3Gz2rSp8N67O7e98uD6uX/f3blv999sXvD8A+tmfWfOhrlfX7d69s67VhzZe/uKQ/vuvXHO7r/ZfMeue75w+5InHlqz7OnvrV344K618360fO2shz91/czfPHj70ifuvunah++4cdGjX1o955Hf/663f9mK+U9dcc0T59xw0yUP/uVlq+Z99uKVK0+/atWKHx+7avG7PnjVyv88e960205eNvXvPnDOnFv/9rx5X7/i8iW/dfay6f//N69Y+M7/eMaM2T8/7fLDf3PK8on3n7B03n++88p57zxh+fxvXrx87m1nz5r1tT9f2P/v7501e+atXv6Y+mNl9W+rV6f6G3n9CclHh7zG/0vM6/w/oTntgjSjX6N5U1Xn+P3O+mUvYf9PjD73/9Xv8/rXv7L8W89Vv3u9Vvz/17u8K8pCea3P/3+N2/kO7f8V5vX+305e54uL6j6/Pqj/L3uYv77/jY8f86W1p39rbeHz+tL18O6/m9X6vjT0P62P/F/m78lHzP0/MPrv9tF//7+v+3L+uF5tU/W1P49U/Xh5U7V7/Xp5I59T9fWj8mbf96vT/U39P6He/y/v6m8/989o1Y8fI9dfO+8v3P9m8Xz9G7fN2fN3K3v3PbV+7pGrNz9y+7rO58+/9cZtB/7pA7PP+97Z58z58VlnTL3v/DPnfmD97LN2vHPe/qO/ef6yD/zW7EVP3vW1a6Y9ccYl808569KZJ04797xTpt9807SpN9805ZwZk98x78m5v3XenCnvPnvWpH+YdfmUX5x5yfTp//786ZPfcdacqdPPuWzqOedfvXDS9KszUydOnXry9MtmTP76ZbMmfeOymZPOfvG8uS8+P336j89Pn/njmTPnP3X+OfMnTj9/waR/mLHojEnT/+K8ORf8v8+d886P/9uMv9p5z6pP3n7fLVs29v289pE9D7VvXv3YV1dtffKvrnzmSzeu3Prp65f88sYvLHr115ZvefKqS0fWfG3lyNpvrBhZ940VI+u/vWJkw3fOunrDpsvOX7/psgtHzl//87MuX3/GZbPG3z5r+rg/O++Uce++8ORxk9997rSJD116/vh3XzB9wnsvPGf8uy+YfsF7p006e8KUKVOfnjLpyUvOn/bEpUv7N1163vSzLr586tmXXD7trO/uP++6Vf9w7YqZf3XV8v4rVy5478pLFp688i/PP2vF0hNWrFpwyvI/fHhZ82kvLmv6vV7pYF600m97nN6+vP7E7L2p+z71u7Wp6/XnC+X/Z9H+vP4N+5nN669K/rG+NHT+n48W1v7v827Tj8bV1pXm1dbV9pXW1faV9tX2VfaV9lWNVfXV9lWNVQ1vK+rG7uXNVY1VDU2NfU36V9vXNFY19v2XvX7/t9f6S+9Tf7mY/1+H9uXjV4/+GfLzGq7/v4f25/v717+p/n718/q8Uu+5/p317/X9P90Y/v+v979R/78O9f/oB83+f7/xWNX/m6+eH88U/O5/Xv3z8/9/0z789X+1P9qf7Y+uH8P0o5r2U/u/99R7bH02uH+9x/75/f0n/9//79G8P7E/up/v03j/j/v//n8v/9///9D+uN4v7L9f7/Iu7/Lu/x3O/f+fU//f9P7/2/T6/1vX+/87X/l/WzH8N0v/f63K/e//v4f+5/sY+z9fX/v/D+3PD65f7/Eu7//R9X//Y/h/9O+v/f/F9e7vXz8W//H3/7685D//H9df6//vWf/9f783f/37/wF6EInK5nS3rQAAAABJRU5ErkJggg==";

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'dark' : ''} bg-slate-50 dark:bg-slate-900 transition-colors duration-300 font-sans`}>
      {/* GLOBAL SYSTEM MESSAGE BANNER */}
      {notification && (
        <div className="fixed top-8 right-8 z-[10000] pointer-events-none">
          <div className="notification-animate pointer-events-auto">
            <div className={`flex items-center gap-5 px-8 py-5 rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.35)] border-2 bg-white dark:bg-slate-800 ${
              notification.type === 'success' ? 'border-emerald-500' : 'border-indigo-500'
            }`}>
              <div className={`p-3 rounded-2xl shadow-inner ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {notification.type === 'success' ? <CheckCircle className="w-7 h-7" /> : <Info className="w-7 h-7" />}
              </div>
              <div className="min-w-[220px]">
                <p className={`text-[11px] font-black uppercase tracking-[0.3em] leading-none mb-1.5 flex items-center gap-1.5 ${
                  notification.type === 'success' ? 'text-emerald-500' : 'text-indigo-500'
                }`}>
                  <Bell className="w-3 h-3" /> System Message
                </p>
                <p className="text-base font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">{notification.message}</p>
              </div>
              <button onClick={() => setNotification(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-850 border-r border-gray-200 dark:border-slate-700 z-50 transform transition-transform duration-300 md:translate-x-0 md:static md:block ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex flex-col items-center justify-center border-b border-gray-100 dark:border-slate-800">
           {/* BRAND LOGO AREA */}
           <div className="w-48 mb-2">
             <img 
               src={logoBase64} 
               alt="Halagel Logo" 
               className="w-full h-auto object-contain" 
             />
           </div>
           <div className="text-center mt-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Production Control</p>
           </div>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={navItemClass('/')}>
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
          <Link to="/reports" onClick={() => setIsMobileMenuOpen(false)} className={navItemClass('/reports')}>
            <ClipboardList className="w-4 h-4" /> Production Reports
          </Link>

          <div className="pt-6 px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Departments</div>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => { setCategory(cat as Category); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                category === cat ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}>
              {cat}
            </button>
          ))}

          {user && (
            <>
              <div className="pt-6 px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operations</div>
              <button onClick={() => { setShowInput(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition">
                <Plus className="w-4 h-4 text-emerald-500" /> New Entry
              </button>
              
              {hasPermission(['admin', 'manager']) && (
                <button onClick={() => { setShowOffDays(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition">
                  <CalendarX className="w-4 h-4 text-rose-500" /> Public Holidays
                </button>
              )}

              {hasPermission(['admin']) && (
                <Link to="/users" onClick={() => setIsMobileMenuOpen(false)} className={navItemClass('/users')}>
                  <Users className="w-4 h-4" /> User Management
                </Link>
              )}

              <Link to="/logs" onClick={() => setIsMobileMenuOpen(false)} className={navItemClass('/logs')}>
                <History className="w-4 h-4" /> Activity Logs
              </Link>

              <div className="pt-6 px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account</div>
              <button onClick={() => { setShowChangePass(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition">
                <Key className="w-4 h-4 text-indigo-500" /> Change Password
              </button>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition">
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </>
          )}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 bg-white dark:bg-slate-850 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <h2 className="font-black text-lg hidden md:block text-slate-700 dark:text-white capitalize">{location.pathname.replace('/', '') || 'Dashboard'}</h2>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                GoogleSheetsService.isEnabled() ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'
              }`}>
                <Database className="w-3 h-3" />
                {GoogleSheetsService.isEnabled() ? 'DB Connected' : 'Local Only'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handleSync} disabled={isSyncing} className={`p-2.5 text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition ${isSyncing ? 'animate-spin text-indigo-500' : ''}`}>
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={toggleDarkMode} className="p-2.5 text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {user ? (
              <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                 <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold uppercase">{user.name.charAt(0)}</div>
                 <div className="hidden sm:block text-left">
                    <p className="text-[10px] font-black uppercase text-indigo-500 leading-none">{user.role}</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-white">{user.name}</p>
                 </div>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition">
                <LogIn className="w-4 h-4" />Login
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {children}
        </div>
      </main>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showInput && <InputModal onClose={() => { setShowInput(false); setEntryToEdit(null); }} editEntry={entryToEdit} />}
      {showOffDays && <OffDayModal onClose={() => setShowOffDays(false)} />}
      {showChangePass && <ChangePasswordModal onClose={() => setShowChangePass(false)} />}
    </div>
  );
};
