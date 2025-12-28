
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { StorageService } from '../../services/storageService';
import { X, Key, ShieldCheck, AlertCircle } from 'lucide-react';

export const ChangePasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user } = useAuth();
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');

  const inputClasses = "w-full p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all";

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!user) return;
      
      if(newPass !== confirmPass) {
          setError("New passwords do not match");
          return;
      }

      if(user.password !== currPass) {
          setError("Incorrect current password");
          return;
      }
      
      if(newPass.length < 6) {
          setError("Password must be at least 6 characters");
          return;
      }

      try {
          const users = StorageService.getUsers();
          const updatedUser = { ...user, password: newPass };
          const updated = users.map(u => u.id === user.id ? updatedUser : u);
          
          StorageService.saveUsers(updated);
          StorageService.setSession(updatedUser);
          
          StorageService.addLog({
            userId: user.id,
            userName: user.name,
            action: 'CHANGE_PASSWORD',
            details: `User successfully updated their account password`
          });

          window.dispatchEvent(new CustomEvent('app-notification', { 
              detail: { message: 'PASSWORD UPDATED SUCCESSFULLY', type: 'success' } 
          }));
          
          onClose();
      } catch (err) {
          setError("Failed to update password. Please try again.");
      }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm shadow-2xl p-8 relative animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-700">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <div className="mb-8">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                    <Key className="w-6 h-6 text-indigo-600 dark:text-indigo-400"/>
                </div>
                Security
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Update Account Password</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl flex items-center gap-3 animate-pulse">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>
                </div>
            )}

            <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Current Password</label>
                <input type="password" required value={currPass} onChange={e => setCurrPass(e.target.value)} className={inputClasses} placeholder="••••••••" />
            </div>

            <div className="pt-2 border-t border-slate-50 dark:border-slate-700/50">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">New Password</label>
                <input type="password" required value={newPass} onChange={e => setNewPass(e.target.value)} className={inputClasses} placeholder="••••••••" />
            </div>

            <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Confirm New Password</label>
                <input type="password" required value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className={inputClasses} placeholder="••••••••" />
            </div>

            <button type="submit" className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-4 rounded-2xl font-black hover:opacity-90 shadow-xl shadow-indigo-500/10 uppercase tracking-[0.2em] text-xs mt-4 flex items-center justify-center gap-2 transition-all active:scale-95">
                <ShieldCheck className="w-4 h-4" />
                Update Credentials
            </button>
        </form>
      </div>
    </div>
  );
};
