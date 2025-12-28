
import React, { ReactNode, useState, useEffect } from 'react';
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
import { 
  Menu, X, Moon, Sun, Plus, LogOut, Key, Database,
  CalendarX, Users, LayoutDashboard, CheckCircle, RefreshCw, LogIn, Info, Globe
} from 'lucide-react';

const LOGO_BASE64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48Y2lyY2xlIGN4PSIyNTYiIGN5PSIyNTYiIHI9IjI1NiIgZmlsbD0iIzA1OTY2OSIvPjxwYXRoIGQ9Ik0zNjggMTYwaC00MHYtMTZoLTgwdi00MGgtNDB2NDBoLTQwdjE2aC00MHYxOTJoMjI0VjE2MHpNMjQwIDEyMGgyMHYyNGgtMjB2LTI0em0xMTIgMjI0SDE2MFYxNzZoMTkyVjE2MGgyMHYxNmg0MHYxOTJ6IiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTI1NiAxNzZoLTgwdjE5MmgyMjRWMTc2aC0xNDR6bTExMiAxNzZIMTkyVjE5MmgxOTJ2MTYweiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==";

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, hasPermission } = useAuth();
  const { category, setCategory, isDarkMode, toggleDarkMode, triggerRefresh } = useDashboard();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const [showLogin, setShowLogin] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<ProductionEntry | null>(null);
  const [showUsers, setShowUsers] = useState(false);
  const [showOffDays, setShowOffDays] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);

  useEffect(() => {
    const handleNotify = (e: any) => {
      setNotification({ message: e.detail.message, type: e.detail.type || 'success' });
      setTimeout(() => setNotification(null), 4000);
    };
    const handleEditEntry = (e: any) => {
      setEntryToEdit(e.detail);
      setShowInput(true);
    };

    window.addEventListener('app-notification', handleNotify);
    window.addEventListener('edit-production-entry', handleEditEntry);
    return () => {
      window.removeEventListener('app-notification', handleNotify);
      window.removeEventListener('edit-production-entry', handleEditEntry);
    };
  }, []);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    await StorageService.syncWithSheets();
    triggerRefresh();
    setIsSyncing(false);
    window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Dashboard synced with Cloud Database' } }));
  };

  const configureSheets = () => {
    const url = prompt("Enter Google Apps Script Web App URL:", localStorage.getItem('nexus_sheets_api_url') || '');
    if (url !== null) {
      localStorage.setItem('nexus_sheets_api_url', url);
      window.location.reload();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans">
      {notification && (
        <div className="fixed top-4 right-4 z-[100] animate-in fade-in slide-in-from-right-4 duration-300">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl border bg-white dark:bg-slate-800 ${
            notification.type === 'success' ? 'border-emerald-500' : 'border-indigo-500'
          }`}>
            <div className={`p-1.5 rounded-full ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">System Message</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="ml-4 text-slate-300 hover:text-slate-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-850 border-r border-gray-200 dark:border-slate-700 shadow-xl overflow-y-auto transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 no-scrollbar
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex flex-col items-center">
           <img src={LOGO_BASE64} alt="Halagel Logo" className="w-16 h-16 mb-4 object-contain shadow-sm rounded-full bg-slate-50 dark:bg-slate-800 p-1" />
           <h1 className="font-black text-xl tracking-tight text-center">HALA<span className="text-green-600">GEL</span></h1>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 text-center">Production Dashboard</p>
        </div>

        <nav className="p-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>

          <div className="pt-6 px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categories</div>
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
              <div className="pt-6 px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Management</div>
              <button onClick={() => setShowInput(true)} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl">
                <Plus className="w-4 h-4 text-emerald-500" /> Input Data
              </button>
              <button onClick={() => setShowOffDays(true)} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl">
                <CalendarX className="w-4 h-4 text-rose-500" /> Manage Off Days
              </button>
              <button onClick={configureSheets} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl">
                <Globe className="w-4 h-4 text-indigo-500" /> Database Setup
              </button>

              <div className="pt-6 px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account</div>
              <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl">
                <LogOut className="w-4 h-4" /> Sign Out
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
              <h2 className="font-black text-lg hidden md:block">HALAGEL Manufacturing</h2>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                GoogleSheetsService.isEnabled() ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'
              }`}>
                <Database className="w-3 h-3" />
                {GoogleSheetsService.isEnabled() ? 'Connected' : 'Local Only'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handleSync} disabled={isSyncing} className={`p-2.5 text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition ${isSyncing ? 'animate-spin' : ''}`}>
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
                    <p className="text-xs font-bold">{user.name}</p>
                 </div>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition">
                <LogIn className="w-4 h-4" /> Login
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
      {showUsers && <UserModal onClose={() => setShowUsers(false)} />}
      {showChangePass && <ChangePasswordModal onClose={() => setShowChangePass(false)} />}
    </div>
  );
};
