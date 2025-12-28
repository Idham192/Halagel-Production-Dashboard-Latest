
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { StorageService } from '../../services/storageService';
import { X, Key } from 'lucide-react';

export const ChangePasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user } = useAuth();
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const inputClasses = "w-full p-2.5 border border-slate-200 bg-white text-slate-900 font-bold rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm";

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(newPass !== confirmPass) return alert("Passwords do not match");
      if(user?.password !== currPass) return alert("Incorrect current password");
      
      const users = StorageService.getUsers();
      const updated = users.map(u => u.id === user.id ? {...u, password: newPass} : u);
      StorageService.saveUsers(updated);
      
      window.dispatchEvent(new CustomEvent('app-notification', { 
          detail: { message: 'Password updated successfully!', type: 'success' } 
      }));
      
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-80 shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X /></button>
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Key className="text-indigo-500"/> Change Password</h3>
        
        <form onSubmit={handleSubmit} className="space-y-3">
            <input type="password" placeholder="Current Password" required value={currPass} onChange={e => setCurrPass(e.target.value)} className={inputClasses} />
            <input type="password" placeholder="New Password" required value={newPass} onChange={e => setNewPass(e.target.value)} className={inputClasses} />
            <input type="password" placeholder="Confirm Password" required value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className={inputClasses} />
            <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition">Update</button>
        </form>
      </div>
    </div>
  );
};
