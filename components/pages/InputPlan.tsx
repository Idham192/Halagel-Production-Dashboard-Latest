
import React, { useState } from 'react';
import { CATEGORIES, PROCESSES } from '../../constants';
import { StorageService } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';
import { ProductionEntry } from '../../types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { getTodayISO } from '../../utils/dateUtils';

export const InputPlan: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    date: getTodayISO(), // Changed from UTC toISOString() to Malaysia-aware getTodayISO()
    category: CATEGORIES[0],
    process: PROCESSES[0],
    productName: '',
    quantity: ''
  });
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const isOffDay = (date: string) => {
    const offDays = StorageService.getOffDays();
    return offDays.some(d => d.date === date);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffDay(formData.date)) {
      setMsg({ type: 'error', text: 'Selected date is marked as an Off Day.' });
      return;
    }

    if (!formData.productName || !formData.quantity) {
      setMsg({ type: 'error', text: 'Please fill all required fields.' });
      return;
    }

    try {
      const entries = StorageService.getProductionData();
      
      const newEntry: ProductionEntry = {
        id: Date.now().toString(),
        date: formData.date,
        category: formData.category as any,
        process: formData.process as any,
        productName: formData.productName,
        planQuantity: parseInt(formData.quantity),
        actualQuantity: 0,
        lastUpdatedBy: user!.id,
        updatedAt: new Date().toISOString()
      };

      StorageService.saveProductionData([...entries, newEntry]);
      StorageService.addLog({
        userId: user!.id,
        userName: user!.name,
        action: 'ADD_PLAN',
        details: `Planned ${newEntry.planQuantity} for ${newEntry.productName} on ${newEntry.date}`
      });

      setMsg({ type: 'success', text: 'Plan entry added successfully.' });
      setFormData({ ...formData, productName: '', quantity: '' });
      
      // Trigger global notification system
      window.dispatchEvent(new CustomEvent('app-notification', { 
        detail: { message: 'Production plan saved successfully!', type: 'success' } 
      }));
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to save data.' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Input Production Plan</h2>
        
        {msg && (
          <div className={`p-4 rounded-lg mb-6 flex items-center ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <input 
                type="date" 
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-slate-900 dark:text-white"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select 
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-slate-900 dark:text-white"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value as any})}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Process</label>
              <select 
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-slate-900 dark:text-white"
                value={formData.process}
                onChange={e => setFormData({...formData, process: e.target.value as any})}
              >
                {PROCESSES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan Quantity</label>
              <input 
                type="number" 
                min="1"
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-slate-900 dark:text-white"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Pain Relief Gel 50g"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-slate-900 dark:text-white"
              value={formData.productName}
              onChange={e => setFormData({...formData, productName: e.target.value})}
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              className="w-full bg-brand-600 text-white font-semibold py-2.5 rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
            >
              Submit Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
