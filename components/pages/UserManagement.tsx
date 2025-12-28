
import React, { useState } from 'react';
import { StorageService } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';
import { User, Role } from '../../types';
import { Trash2, Edit2, Check, X, Plus, Database, ShieldCheck } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>(StorageService.getUsers());
  const [isAdding, setIsAdding] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(localStorage.getItem('halagel_sheets_api_url') || '');
  
  const [newUser, setNewUser] = useState<Omit<User, 'id'>>({
      name: '',
      username: '',
      email: '',
      role: 'operator',
      password: ''
  });

  const handleSaveSheetUrl = () => {
    localStorage.setItem('halagel_sheets_api_url', sheetUrl);
    window.dispatchEvent(new CustomEvent('app-notification', { 
        detail: { message: 'DATABASE CONFIGURATION UPDATED', type: 'success' } 
    }));
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
        alert("Username already exists!");
        return;
    }
    const u: User = { ...newUser, id: Date.now().toString() };
    const updated = [...users, u];
    StorageService.saveUsers(updated);
    StorageService.addLog({
      userId: currentUser!.id,
      userName: currentUser!.name,
      action: 'ADD_USER',
      details: `Created new user account: ${u.name} (${u.role})`
    });
    setUsers(updated);
    window.dispatchEvent(new CustomEvent('app-notification', { 
        detail: { message: `NEW USER CREATED: ${u.name.toUpperCase()}`, type: 'success' } 
    }));
    setIsAdding(false);
    setNewUser({ name: '', username: '', email: '', role: 'operator', password: '' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this user?')) {
        const target = users.find(u => u.id === id);
        const updated = users.filter(u => u.id !== id);
        StorageService.saveUsers(updated);
        StorageService.addLog({
          userId: currentUser!.id,
          userName: currentUser!.name,
          action: 'DELETE_USER',
          details: `Removed user account: ${target?.name} (@${target?.username})`
        });
        setUsers(updated);
        window.dispatchEvent(new CustomEvent('app-notification', { 
            detail: { message: `USER REMOVED: ${target?.name.toUpperCase()}`, type: 'info' } 
        }));
    }
  };

  return (
    <div className="space-y-8">
        {/* DB CONFIG FOR ADMINS */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <Database className="w-6 h-6 text-indigo-500" />
                <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white leading-none">Database Connection</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Link dashboard to Google Sheets</p>
                </div>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
                <input 
                    type="password"
                    placeholder="Paste Google Apps Script Deployment URL here..."
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                />
                <button onClick={handleSaveSheetUrl} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Save Connection
                </button>
            </div>
        </div>

        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-gray-800 dark:text-white">Staff Management</h2>
            <button 
                onClick={() => setIsAdding(!isAdding)}
                className="bg-slate-900 dark:bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:opacity-90 transition shadow-lg shadow-indigo-500/20 text-xs font-black uppercase tracking-widest"
            >
                {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {isAdding ? 'Cancel' : 'Create Account'}
            </button>
        </div>

        {isAdding && (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-indigo-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-4">
                <h3 className="text-lg font-black mb-6 dark:text-white">New User Profile</h3>
                <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Full Name</label>
                        <input type="text" required className="w-full border dark:border-slate-600 dark:bg-slate-900 p-2.5 rounded-xl outline-none dark:text-white font-bold" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Username</label>
                        <input type="text" required className="w-full border dark:border-slate-600 dark:bg-slate-900 p-2.5 rounded-xl outline-none dark:text-white font-bold" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email</label>
                        <input type="email" required className="w-full border dark:border-slate-600 dark:bg-slate-900 p-2.5 rounded-xl outline-none dark:text-white font-bold" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Initial Password</label>
                        <input type="text" required className="w-full border dark:border-slate-600 dark:bg-slate-900 p-2.5 rounded-xl outline-none dark:text-white font-bold" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">System Role</label>
                        <select className="w-full border dark:border-slate-600 dark:bg-slate-900 p-2.5 rounded-xl outline-none dark:text-white font-bold" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as Role})}>
                            <option value="admin">Administrator</option>
                            <option value="manager">Manager</option>
                            <option value="planner">Planner</option>
                            <option value="operator">Operator</option>
                        </select>
                    </div>
                    <div className="md:col-span-2 pt-4">
                        <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-xl shadow-lg hover:bg-indigo-700 transition font-black text-xs uppercase tracking-widest">Submit Account Details</button>
                    </div>
                </form>
            </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-slate-200 border-b dark:border-slate-700 uppercase font-bold text-[10px] tracking-widest">
                    <tr>
                        <th className="px-8 py-5">Staff Member</th>
                        <th className="px-8 py-5">Email</th>
                        <th className="px-8 py-5 text-center">Permissions</th>
                        <th className="px-8 py-5 text-right">Control</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-8 py-6">
                                <div className="font-black text-slate-800 dark:text-white">{u.name}</div>
                                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold tracking-tighter">@{u.username}</div>
                            </td>
                            <td className="px-8 py-6 text-slate-500 dark:text-gray-400 font-medium">{u.email}</td>
                            <td className="px-8 py-6 text-center">
                                <span className="bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg text-[9px] uppercase font-black tracking-[0.1em] text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                                    {u.role}
                                </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                                <button 
                                    onClick={() => handleDelete(u.id)}
                                    className="text-slate-400 hover:text-rose-600 p-2.5 transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl"
                                    disabled={u.role === 'admin' && users.filter(x => x.role === 'admin').length <= 1}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};
