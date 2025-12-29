
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

  const handleSync = async (silent = false) => {
    if (!GoogleSheetsService.isEnabled()) {
      if (!silent) {
        window.dispatchEvent(new CustomEvent('app-notification', { 
          detail: { message: 'DATABASE NOT CONFIGURED. PLEASE SET URL IN USER MANAGEMENT.', type: 'info' } 
        }));
      }
      return;
    }
    
    if (!silent) setIsSyncing(true);
    try {
      await StorageService.syncWithSheets();
      triggerRefresh();
      if (!silent) {
        window.dispatchEvent(new CustomEvent('app-notification', { 
          detail: { message: 'CLOUD DATA SYNCHRONIZED', type: 'success' } 
        }));
      }
    } catch (e) {
      if (!silent) {
        window.dispatchEvent(new CustomEvent('app-notification', { 
          detail: { message: 'SYNC FAILED - CHECK CONNECTION', type: 'info' } 
        }));
      }
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (GoogleSheetsService.isEnabled()) {
      handleSync(true); 
    }
  }, []);

  useEffect(() => {
    window.addEventListener('app-notification', handleNotify);
    window.addEventListener('edit-production-entry', handleEditEntry);
    return () => {
      window.removeEventListener('app-notification', handleNotify);
      window.removeEventListener('edit-production-entry', handleEditEntry);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [handleNotify, handleEditEntry]);

  const navItemClass = (path: string) => `
    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
    ${location.pathname === path 
      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800' 
      : 'text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800'}
  `;

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'dark' : ''} bg-slate-50 dark:bg-slate-900 transition-colors duration-300 font-sans`}>
      {/* GLOBAL NOTIFICATION - CENTERED TOP */}
      {notification && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[10000] pointer-events-none w-full max-w-md px-4">
          <div className="notification-animate pointer-events-auto">
            <div className={`flex items-center gap-5 px-8 py-5 rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.35)] border-2 bg-white dark:bg-slate-800 ${
              notification.type === 'success' ? 'border-emerald-500' : 'border-indigo-500'
            }`}>
              <div className={`p-3 rounded-2xl shadow-inner ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {notification.type === 'success' ? <CheckCircle className="w-7 h-7" /> : <Info className="w-7 h-7" />}
              </div>
              <div className="flex-1">
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

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-850 border-r border-gray-200 dark:border-slate-700 z-50 transform transition-transform duration-300 md:translate-x-0 md:static md:block ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col items-center justify-center border-b border-gray-100 dark:border-slate-800">
           <div className="w-48 mb-2">
             <img 
               src="data:image/png;base64,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" 
               alt="Halagel Logo" 
               className="w-full h-auto object-contain"
             />
             <div className="text-center">
               <h1 className="font-extrabold text-2xl tracking-tight">HALA<span className="text-green-600">GEL</span></h1>
               <p className="text-[10px] font-bold text-slate-400 uppercase">Manufacturing System</p>
             </div>
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
            <button onClick={() => handleSync()} disabled={isSyncing} className={`p-2.5 text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition ${isSyncing ? 'animate-spin text-indigo-500' : ''}`}>
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
