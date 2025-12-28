
import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';
import { ProductionEntry } from '../../types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { getTodayISO } from '../../utils/dateUtils';

export const InputActual: React.FC = () => {
  const { user } = useAuth();
  // Changed from UTC toISOString() to Malaysia-aware getTodayISO()
  const [date, setDate] = useState(getTodayISO());
  
  const [pendingPlans, setPendingPlans] = useState<ProductionEntry[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    actualQty: '',
    manpower: '',
    batchNo: ''
  });

  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const all = StorageService.getProductionData();
    const forDate = all.filter(p => p.date === date);
    setPendingPlans(forDate);
    setSelectedPlanId('');
    setFormData({ actualQty: '', manpower: '', batchNo: '' });
  }, [date]);

  const isOffDay = (d: string) => {
    const offDays = StorageService.getOffDays();
    return offDays.some(od => od.date === d);
  };

  const handleAutoBatch = () => {
    const r = Math.floor(Math.random() * 10000);
    const b = `B-${date.replace(/-/g, '')}-${r}`;
    setFormData(prev => ({ ...prev, batchNo: b }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffDay(date)) {
      setMsg({ type: 'error', text: 'Cannot enter data on an Off Day.' });
      return;
    }

    if (!selectedPlanId) {
      setMsg({ type: 'error', text: 'Please select a production plan to update.' });
      return;
    }

    try {
      const allData = StorageService.getProductionData();
      const updatedData = allData.map(entry => {
        if (entry.id === selectedPlanId) {
          return {
            ...entry,
            actualQuantity: parseInt(formData.actualQty),
            manpower: parseInt(formData.manpower),
            batchNo: formData.batchNo,
            lastUpdatedBy: user!.id,
            updatedAt: new Date().toISOString()
          };
        }
        return entry;
      });

      StorageService.saveProductionData(updatedData);
      
      const target = allData.find(e => e.id === selectedPlanId);
      StorageService.addLog({
        userId: user!.id,
        userName: user!.name,
        action: 'ADD_ACTUAL',
        details: `Updated actuals for ${target?.productName}: ${formData.actualQty} units`
      });

      setMsg({ type: 'success', text: 'Actual data updated successfully.' });
      
      // Trigger global notification system
      window.dispatchEvent(new CustomEvent('app-notification', { 
        detail: { message: 'Actual production recorded successfully!', type: 'success' } 
      }));

      const forDate = updatedData.filter(p => p.date === date);
      setPendingPlans(forDate);
    } catch (err) {
      setMsg({ type: 'error', text: 'Error saving data.' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Input Actual Production</h2>

        {msg && (
          <div className={`p-4 rounded-lg mb-6 flex items-center ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
            {msg.text}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Date</label>
          <input 
            type="date" 
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-slate-900 dark:text-white"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Job / Plan</label>
          {pendingPlans.length === 0 ? (
            <div className="text-sm text-gray-500 italic p-3 border rounded bg-gray-50 dark:bg-slate-900 dark:border-slate-700">No plans found for this date. Ask a planner to input data first.</div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-lg p-2">
              {pendingPlans.map(plan => (
                <div 
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-3 rounded-md cursor-pointer border transition-colors ${
                    selectedPlanId === plan.id 
                      ? 'bg-brand-50 border-brand-500 ring-1 ring-brand-500 dark:bg-brand-900/20' 
                      : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800 dark:text-white">{plan.productName}</span>
                    <span className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-gray-600 dark:text-gray-400">{plan.category}</span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex justify-between mt-1">
                    <span>{plan.process}</span>
                    <span>Plan: {plan.planQuantity}</span>
                  </div>
                  {plan.actualQuantity > 0 && (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      Currently Recorded: {plan.actualQuantity}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedPlanId && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Actual Quantity</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-slate-900 dark:text-white"
                  value={formData.actualQty}
                  onChange={e => setFormData({...formData, actualQty: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Manpower</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-slate-900 dark:text-white"
                  value={formData.manpower}
                  onChange={e => setFormData({...formData, manpower: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Batch Number</label>
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  required
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:bg-slate-900 dark:text-white"
                  value={formData.batchNo}
                  onChange={e => setFormData({...formData, batchNo: e.target.value})}
                />
                <button
                  type="button"
                  onClick={handleAutoBatch}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600"
                >
                  Generate
                </button>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-brand-600 text-white font-semibold py-2.5 rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
            >
              Update Production Data
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
