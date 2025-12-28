
import React, { useState } from 'react';
import { StorageService } from '../../services/storageService';
import { User, Role } from '../../types';
import { Trash2, Edit2, Check, X, Plus } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(StorageService.getUsers());
  const [isAdding, setIsAdding] = useState(false);
  
  // New User Form State
  const [newUser, setNewUser] = useState<Omit<User, 'id'>>({
      name: '',
      username: '',
      email: '',
      role: 'operator',
      password: ''
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
        alert("Username already exists!");
        return;
    }
    const u: User = {
        ...newUser,
        id: Date.now().toString(),
    };
    const updated = [...users, u];
    StorageService.saveUsers(updated);
    setUsers(updated);
    setIsAdding(false);
    setNewUser({ name: '', username: '', email: '', role: 'operator', password: '' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this user?')) {
        const updated = users.filter(u => u.id !== id);
        StorageService.saveUsers(updated);
        setUsers(updated);
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
            <button 
                onClick={() => setIsAdding(!isAdding)}
                className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700 transition shadow-lg shadow-brand-500/20"
            >
                {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {isAdding ? 'Cancel' : 'Add User'}
            </button>
        </div>

        {isAdding && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-200 animate-in fade-in slide-in-from-top-4">
                <h3 className="text-lg font-bold mb-4">Create New Account</h3>
                <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                        type="text" placeholder="Full Name" required
                        className="border p-2 rounded focus:ring-2 focus:ring-brand-500 outline-none"
                        value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}
                    />
                    <input 
                        type="text" placeholder="Username" required
                        className="border p-2 rounded focus:ring-2 focus:ring-brand-500 outline-none"
                        value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})}
                    />
                    <input 
                        type="email" placeholder="Email Address" required
                        className="border p-2 rounded focus:ring-2 focus:ring-brand-500 outline-none"
                        value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                    />
                    <input 
                        type="text" placeholder="Password" required
                        className="border p-2 rounded focus:ring-2 focus:ring-brand-500 outline-none"
                        value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                    />
                    <select 
                        className="border p-2 rounded focus:ring-2 focus:ring-brand-500 outline-none"
                        value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as Role})}
                    >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="planner">Planner</option>
                        <option value="operator">Operator</option>
                    </select>
                    <div className="md:col-span-2 pt-2">
                        <button type="submit" className="bg-brand-600 text-white px-6 py-2.5 rounded-lg shadow-lg hover:bg-brand-700 transition">Save New User</button>
                    </div>
                </form>
            </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-700 border-b uppercase font-bold text-[10px] tracking-widest">
                    <tr>
                        <th className="px-6 py-4">Name & Username</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="font-bold text-slate-800">{u.name}</div>
                                <div className="text-xs text-indigo-600 font-mono">@{u.username}</div>
                            </td>
                            <td className="px-6 py-4 text-gray-500">{u.email}</td>
                            <td className="px-6 py-4">
                                <span className="bg-gray-100 px-2.5 py-1 rounded text-[10px] uppercase font-black tracking-widest text-gray-600">
                                    {u.role}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button 
                                    onClick={() => handleDelete(u.id)}
                                    className="text-red-400 hover:text-red-600 p-2 transition-colors hover:bg-red-50 rounded-lg"
                                    disabled={u.role === 'admin' && users.filter(x => x.role === 'admin').length <= 1}
                                    title={u.role === 'admin' ? "Cannot delete last admin" : "Delete"}
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
