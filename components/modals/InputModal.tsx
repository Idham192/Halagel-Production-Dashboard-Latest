
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { StorageService } from '../../services/storageService';
import { CATEGORIES, PROCESSES } from '../../constants';
import { ProductionEntry, Category, ProcessType } from '../../types';
import { X, Loader2, AlertTriangle, Palmtree } from 'lucide-react';
import { getTodayISO } from '../../utils/dateUtils';

interface InputModalProps {
  onClose: () => void;
  editEntry?: ProductionEntry | null;
}

export const InputModal: React.FC<InputModalProps> = ({ onClose, editEntry }) => {
  const { user, hasPermission } = useAuth();
  const { triggerRefresh } = useDashboard();
  const [tab, setTab] = useState<'Plan' | 'Actual'>('Plan');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [date, setDate] = useState(getTodayISO());
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [process, setProcess] = useState<ProcessType>(PROCESSES[0]);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [manpower, setManpower] = useState('0');
  const [batchNo, setBatchNo] = useState('');
  
  const [plans, setPlans] = useState<ProductionEntry[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  const offDays = useMemo(() => StorageService.getOffDays(), []);
  const currentOffDay = useMemo(() => offDays.find(od => od.date === date), [date, offDays]);

  const inputClasses = "w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm";

  useEffect(() => {
    if (currentOffDay && !editEntry) {
      window.dispatchEvent(new CustomEvent('app-notification', { 
        detail: { message: `PUBLIC HOLIDAY: ${currentOffDay.description}`, type: 'info' } 
      }));
    }
  }, [currentOffDay, editEntry]);

  useEffect(() => {
    if (editEntry) {
      setDate(editEntry.date);
      setCategory(editEntry.category);
      setProcess(editEntry.process);
      setProductName(editEntry.productName);
      setQuantity(editEntry.planQuantity.toString());
      setManpower(editEntry.manpower?.toString() || '0');
      setBatchNo(editEntry.batchNo || '');
      setTab(editEntry.actualQuantity > 0 ? 'Actual' : 'Plan'); 
    } else {
      if (user?.role === 'operator') setTab('Actual');
      else if (user?.role === 'planner') setTab('Plan');
    }
  }, [editEntry, user]);

  useEffect(() => {
    if (tab === 'Actual' && !editEntry) {
        const all = StorageService.getProductionData();
        const relevant = all.filter(p => p.date === date);
        setPlans(relevant);
        setSelectedPlanId('');
    }
  }, [date, tab, editEntry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Safety: Strip any time info and just keep YYYY-MM-DD
    const normalizedDate = date.split('T')[0];

    if (!editEntry && currentOffDay) {
        window.dispatchEvent(new CustomEvent('app-notification', { 
            detail: { message: `ENTRY RESTRICTED: Today is ${currentOffDay.description}`, type: 'info' } 
        }));
        setIsSubmitting(false);
        return;
    }

    const currentData = StorageService.getProductionData();

    try {
        if (editEntry) {
            const updated = currentData.map(p => {
                if (p.id === editEntry.id) {
                    return { 
                        ...p, 
                        date: normalizedDate, 
                        category, process, productName,
                        planQuantity: tab === 'Plan' ? parseInt(quantity) : p.planQuantity,
                        actualQuantity: tab === 'Actual' ? parseInt(quantity) : p.actualQuantity,
                        batchNo, manpower: parseInt(manpower),
                        lastUpdatedBy: user!.id, updatedAt: new Date().toISOString()
                    };
                }
                return p;
            });
            StorageService.saveProductionData(updated);
            StorageService.addLog({
              userId: user!.id,
              userName: user!.name,
              action: 'EDIT_RECORD',
              details: `Edited ${productName} on ${normalizedDate}`
            });
        } else {
            if (tab === 'Plan') {
                const newEntry: ProductionEntry = {
                    id: Date.now().toString(),
                    date: normalizedDate, 
                    category, process, productName, 
                    planQuantity: parseInt(quantity), actualQuantity: 0,
                    lastUpdatedBy: user!.id, updatedAt: new Date().toISOString()
                };
                StorageService.saveProductionData([...currentData, newEntry]);
            } else {
                if (!selectedPlanId) throw new Error("Please select a plan");
                const updated = currentData.map(p => {
                    if (p.id === selectedPlanId) {
                        return { 
                            ...p, 
                            actualQuantity: parseInt(quantity), batchNo, manpower: parseInt(manpower),
                            lastUpdatedBy: user!.id, updatedAt: new Date().toISOString()
                        };
                    }
                    return p;
                });
                StorageService.saveProductionData(updated);
            }
        }

        window.dispatchEvent(new CustomEvent('app-notification', { 
            detail: { message: 'PRODUCTION RECORD SYNCHRONIZED', type: 'success' } 
        }));
        
        triggerRefresh();
        onClose();
    } catch (err: any) {
        window.dispatchEvent(new CustomEvent('app-notification', { 
            detail: { message: err.message || 'Operation failed', type: 'info' } 
        }));
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative">
        {isSubmitting && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-2" />
                <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Uploading to Cloud...</p>
            </div>
        )}

        <div className="flex border-b border-gray-200 dark:border-slate-700">
            {!editEntry ? (
              <>
                {hasPermission(['admin', 'manager', 'planner']) && (
                    <button onClick={() => setTab('Plan')} 
                        className={`flex-1 py-4 font-black text-[11px] uppercase tracking-widest text-center transition border-b-2 ${tab === 'Plan' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        Production Plan
                    </button>
                )}
                {hasPermission(['admin', 'manager', 'operator']) && (
                    <button onClick={() => setTab('Actual')} 
                        className={`flex-1 py-4 font-black text-[11px] uppercase tracking-widest text-center transition border-b-2 ${tab === 'Actual' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        Production Actual
                    </button>
                )}
              </>
            ) : (
              <div className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest text-center text-indigo-600 border-b-2 border-indigo-600">
                Updating Record
              </div>
            )}
        </div>

        <div className="p-6 relative">
            <button onClick={onClose} className="absolute top-2 right-4 text-slate-300 hover:text-rose-500 transition-colors"><X className="w-5 h-5" /></button>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Production Date</label>
                    <input type="date" required value={date} onChange={e => setDate(e.target.value)} className={inputClasses} />
                    
                    {currentOffDay && (
                      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl flex items-center gap-3 animate-pulse shadow-sm">
                        <div className="p-2 bg-amber-500 text-white rounded-lg shadow-md">
                          <Palmtree className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest leading-none mb-1">Public Holiday</p>
                          <p className="text-xs font-black text-slate-900 dark:text-amber-50">{currentOffDay.description || 'OFF DAY'}</p>
                        </div>
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      </div>
                    )}
                </div>

                {tab === 'Plan' || editEntry ? (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Category</label>
                                <select value={category} onChange={e => setCategory(e.target.value as Category)} className={inputClasses}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Process</label>
                                <select value={process} onChange={e => setProcess(e.target.value as ProcessType)} className={inputClasses}>
                                    {PROCESSES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Product Name</label>
                            <input type="text" required value={productName} onChange={e => setProductName(e.target.value)} className={inputClasses} placeholder="Enter name..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Quantity</label>
                              <input type="number" required min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className={inputClasses} />
                          </div>
                          {editEntry && (
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Manpower</label>
                                <input type="number" required min="0" value={manpower} onChange={e => setManpower(e.target.value)} className={inputClasses} />
                            </div>
                          )}
                        </div>
                        {editEntry && (
                          <div>
                              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Batch Number</label>
                              <input type="text" value={batchNo} onChange={e => setBatchNo(e.target.value)} className={inputClasses} />
                          </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="mb-4">
                             <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Select Active Job</label>
                             {plans.length === 0 ? <div className="text-xs text-slate-400 italic text-center p-6 border-2 border-dashed rounded-xl">No plans scheduled for this date.</div> : (
                                 <div className="max-h-40 overflow-y-auto border rounded-xl p-2 space-y-1 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                     {plans.map(p => (
                                         <div key={p.id} onClick={() => setSelectedPlanId(p.id)}
                                            className={`p-3 rounded-lg cursor-pointer transition ${selectedPlanId === p.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'}`}>
                                            <div className="font-black text-sm">{p.productName}</div>
                                            <div className={`text-[10px] font-bold uppercase ${selectedPlanId === p.id ? 'text-indigo-100' : 'text-slate-400'}`}>{p.process} • Plan: {p.planQuantity}</div>
                                         </div>
                                     ))}
                                 </div>
                             )}
                        </div>
                        {selectedPlanId && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Actual Qty</label>
                                        <input type="number" required value={quantity} onChange={e => setQuantity(e.target.value)} className={inputClasses} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Manpower</label>
                                        <input type="number" required value={manpower} onChange={e => setManpower(e.target.value)} className={inputClasses} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Batch Number</label>
                                    <input type="text" required value={batchNo} onChange={e => setBatchNo(e.target.value)} className={inputClasses} placeholder="Enter batch ID..." />
                                </div>
                            </>
                        )}
                    </>
                )}

                <button 
                    type="submit" 
                    disabled={isSubmitting || (!editEntry && !!currentOffDay)} 
                    className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] text-white mt-6 shadow-xl transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${
                        !!currentOffDay && !editEntry ? 'bg-amber-600' : 
                        tab === 'Plan' ? 'bg-slate-900 dark:bg-indigo-600 shadow-indigo-500/10' : 
                        'bg-emerald-600 shadow-emerald-500/10'
                    }`}
                >
                    {isSubmitting ? 'Syncing...' : (!!currentOffDay && !editEntry ? 'Holiday Entry Locked' : 'Update System')}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};
