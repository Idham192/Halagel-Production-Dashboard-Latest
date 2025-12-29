
import React, { useState } from 'react';
import { StorageService } from '../../services/storageService';
import { OffDay } from '../../types';
import { X, Trash2, CalendarX } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard } from '../../contexts/DashboardContext';

export const OffDayModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user } = useAuth();
  const { triggerRefresh } = useDashboard();
  const [offDays, setOffDays] = useState<OffDay[]>(StorageService.getOffDays());
  const [date, setDate] = useState('');
  const [desc, setDesc] = useState('');

  const inputClasses = "w-full p-2 border border-slate-200 bg-white text-slate-900 font-bold rounded outline-none shadow-sm";

  const handleAdd = () => {
      if(!date) return;
      if(offDays.some(od => od.date === date)) return alert('Already off day');
      const newOd: OffDay = { id: Date.now().toString(), date, description: desc || 'Holiday', createdBy: user!.id };
      const updated = [...offDays, newOd].sort((a,b) => (a.date || '').localeCompare(b.date || ''));
      StorageService.saveOffDays(updated);
      
      StorageService.addLog({
        userId: user!.id,
        userName: user!.name,
        action: 'ADD_HOLIDAY',
        details: `Scheduled public holiday: ${newOd.description} (${newOd.date})`
      });

      setOffDays(updated);
      triggerRefresh();
      
      window.dispatchEvent(new CustomEvent('app-notification', { 
          detail: { message: `PUBLIC HOLIDAY SET: ${newOd.description.toUpperCase()} (${newOd.date})`, type: 'success' } 
      }));
      
      setDate(''); setDesc('');
  };

  const handleRemove = (id: string) => {
      const target = offDays.find(od => od.id === id);
      const updated = offDays.filter(od => od.id !== id);
      StorageService.saveOffDays(updated);
      
      StorageService.addLog({
        userId: user!.id,
        userName: user!.name,
        action: 'DELETE_HOLIDAY',
        details: `Removed holiday: ${target?.description} (${target?.date})`
      });

      setOffDays(updated);
      triggerRefresh();
      window.dispatchEvent(new CustomEvent('app-notification', { 
          detail: { message: 'HOLIDAY REMOVED FROM SYSTEM', type: 'info' } 
      }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-96 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><CalendarX className="text-red-500"/> Off Days</h3>
            <button onClick={onClose}><X className="text-gray-400 hover:text-red-500" /></button>
        </div>

        <div className="space-y-3 mb-4">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClasses} />
            <div className="flex gap-2">
                <input type="text" placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} className={`${inputClasses} flex-1 text-sm font-normal`} />
                <button onClick={handleAdd} className="bg-indigo-600 text-white px-4 rounded font-bold hover:bg-indigo-700 shadow-md">Add</button>
            </div>
        </div>

        <div className="h-48 overflow-y-auto border border-slate-200 rounded bg-gray-50 dark:bg-slate-900 p-2 space-y-2">
            {offDays.length === 0 ? (
                <div className="text-center p-8 text-slate-400 text-xs italic">No holidays scheduled</div>
            ) : offDays.map(od => (
                <div key={od.id} className="flex justify-between items-center bg-white dark:bg-slate-700 p-2 rounded shadow-sm text-sm border border-slate-100 dark:border-slate-600">
                    <div>
                        <span className="font-mono font-bold text-red-500">{od.date || 'No Date'}</span>
                        <div className="text-xs text-gray-500 dark:text-gray-300">{od.description}</div>
                    </div>
                    <button onClick={() => handleRemove(od.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
