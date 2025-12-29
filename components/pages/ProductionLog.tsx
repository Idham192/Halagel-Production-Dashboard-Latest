
import React, { useState, useMemo, useEffect } from 'react';
import { StorageService } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { CATEGORIES, PROCESSES } from '../../constants';
import { ProductionEntry } from '../../types';
import { Trash2, Download, Calendar, List, Filter, XCircle, Palmtree } from 'lucide-react';
import { getTodayISO } from '../../utils/dateUtils';

export const ProductionLog: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { refreshKey, triggerRefresh } = useDashboard();
  const [data, setData] = useState<ProductionEntry[]>([]);
  const offDays = useMemo(() => StorageService.getOffDays(), []);
  
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [category, setCategory] = useState('All');
  const [processType, setProcessType] = useState('All');

  // Reactively re-fetch production data when the global refreshKey changes
  useEffect(() => {
    setData(StorageService.getProductionData());
  }, [refreshKey]);

  const filteredData = useMemo(() => {
    return data.filter(d => {
      if (!d) return false;
      const matchCat = category === 'All' || d.category === category;
      const matchProc = processType === 'All' || d.process === processType;
      const matchStart = !dateRange.start || (d.date && d.date >= dateRange.start);
      const matchEnd = !dateRange.end || (d.date && d.date <= dateRange.end);
      return matchCat && matchProc && matchStart && matchEnd;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [data, dateRange, category, processType]);

  const monthlyData = useMemo(() => {
    const groups: Record<string, { plan: number, actual: number, count: number }> = {};
    
    filteredData.forEach(d => {
        if (!d.date) return;
        const monthKey = d.date.substring(0, 7); 
        if (!groups[monthKey]) {
            groups[monthKey] = { plan: 0, actual: 0, count: 0 };
        }
        groups[monthKey].plan += (d.planQuantity || 0);
        groups[monthKey].actual += (d.actualQuantity || 0);
        groups[monthKey].count++;
    });

    return Object.entries(groups)
        .map(([month, stats]) => ({
            month,
            plan: stats.plan,
            actual: stats.actual,
            efficiency: stats.plan > 0 ? (stats.actual / stats.plan) * 100 : 0
        }))
        .sort((a, b) => (b.month || '').localeCompare(a.month || '')); 
  }, [filteredData]);

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete this entry?")) return;
    
    // Atomic delete from storage
    const { deletedItem } = StorageService.deleteProductionEntry(id);
    
    if (deletedItem) {
        StorageService.addLog({
          userId: user!.id,
          userName: user!.name,
          action: 'DELETE_RECORD',
          details: `Record deleted from reports: ${deletedItem.productName} (${deletedItem.date})`
        });

        window.dispatchEvent(new CustomEvent('app-notification', { 
            detail: { message: 'RECORD REMOVED SUCCESSFULLY', type: 'info' } 
        }));
    }

    // Always trigger global refresh
    triggerRefresh();
  };

  const resetFilters = () => {
    setDateRange({ start: '', end: '' });
    setCategory('All');
    setProcessType('All');
  };

  const calculateEfficiency = (actual: number, plan: number) => {
    if (!plan || plan === 0) return 0;
    return ((actual / plan) * 100).toFixed(1);
  };

  const downloadCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = '';

    const today = getTodayISO();

    if (viewMode === 'daily') {
        headers = ["Date", "Status", "Category", "Process", "Product", "Plan", "Actual", "Unit", "Efficiency %", "Batch No", "Manpower"];
        rows = filteredData.map(d => {
            const isOff = offDays.some(od => od.date === d.date);
            return [
                d.date, isOff ? 'Holiday Shift' : 'Normal', d.category, d.process, `"${d.productName}"`, d.planQuantity || 0, d.actualQuantity || 0, d.unit || 'KG',
                calculateEfficiency(d.actualQuantity || 0, d.planQuantity || 0), d.batchNo || '', d.manpower || ''
            ];
        });
        filename = `production_log_daily_${today}.csv`;
    } else {
        headers = ["Month", "Total Plan", "Total Actual", "Overall Efficiency %"];
        rows = monthlyData.map(m => [ m.month, m.plan || 0, m.actual || 0, (m.efficiency || 0).toFixed(2) ]);
        filename = `production_summary_monthly_${today}.csv`;
    }

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'REPORT EXPORTED SUCCESSFULLY', type: 'success' } }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Production Reports</h2>
        
        <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg p-1 border border-gray-200 dark:border-slate-700 shadow-sm">
            <button onClick={() => setViewMode('daily')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'daily' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'text-gray-500 hover:text-gray-700'}`}>
                <List className="w-4 h-4" /> Daily Log
            </button>
            <button onClick={() => setViewMode('monthly')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'monthly' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'text-gray-500 hover:text-gray-700'}`}>
                <Calendar className="w-4 h-4" /> Monthly Summary
            </button>
        </div>

        <button onClick={downloadCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition">
            <Download className="w-4 h-4" /> Export Excel
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
            <Filter className="w-3 h-3" /> Start Date
          </label>
          <input 
            type="date" 
            value={dateRange.start} 
            onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto font-bold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
            <Filter className="w-3 h-3" /> End Date
          </label>
          <input 
            type="date" 
            value={dateRange.end} 
            onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto font-bold"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</label>
          <select 
            value={category} 
            onChange={e => setCategory(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 min-w-[120px] font-bold"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Process</label>
          <select 
            value={processType} 
            onChange={e => setProcessType(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 min-w-[120px] font-bold"
          >
            <option value="All">All Processes</option>
            {PROCESSES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <button 
          onClick={resetFilters}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition"
        >
          <XCircle className="w-4 h-4" /> Reset Filters
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold uppercase text-[10px] tracking-widest">
              {viewMode === 'daily' ? (
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Dept</th>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4 text-right">Plan</th>
                    <th className="px-6 py-4 text-right">Actual</th>
                    <th className="px-6 py-4 text-center">Unit</th>
                    <th className="px-6 py-4 text-right">Eff. %</th>
                    {hasPermission(['admin', 'manager']) && <th className="px-6 py-4 text-center">Actions</th>}
                  </tr>
              ) : (
                  <tr>
                    <th className="px-6 py-4">Month</th>
                    <th className="px-6 py-4 text-right">Total Plan</th>
                    <th className="px-6 py-4 text-right">Total Actual</th>
                    <th className="px-6 py-4 text-right">Overall Efficiency</th>
                  </tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {viewMode === 'daily' ? (
                  filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-10 text-center text-slate-400 italic">No entries found matching filters</td>
                    </tr>
                  ) : filteredData.map(entry => {
                    const eff = Number(calculateEfficiency(entry.actualQuantity || 0, entry.planQuantity || 0));
                    const isOff = entry.date && offDays.some(od => od.date === entry.date);
                    return (
                      <tr key={entry.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${isOff ? 'bg-amber-50/20 dark:bg-amber-900/10' : ''}`}>
                        <td className="px-6 py-4 font-mono text-xs font-bold">{entry.date || 'N/A'}</td>
                        <td className="px-6 py-4">
                            {isOff ? (
                                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-amber-600 dark:text-amber-400">
                                    <Palmtree className="w-3 h-3" /> Holiday Shift
                                </span>
                            ) : (
                                <span className="text-[9px] font-black uppercase text-slate-400">Regular</span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800">
                            {entry.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                            <div className="font-bold text-slate-700 dark:text-slate-200">{entry.productName}</div>
                            <div className="text-[9px] font-black uppercase text-indigo-500 tracking-tighter">{entry.process}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-black font-mono text-blue-600">{(entry.planQuantity || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-black font-mono text-emerald-600">{(entry.actualQuantity || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-[10px] font-black text-slate-400">{entry.unit || 'KG'}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <span className={`px-2 py-1 rounded-lg text-xs font-black border ${eff >= 100 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : eff >= 80 ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                {eff}%
                            </span>
                        </td>
                        {hasPermission(['admin', 'manager']) && (
                            <td className="px-6 py-4 text-center">
                                <button onClick={() => handleDelete(entry.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        )}
                      </tr>
                    );
                  })
              ) : (
                  monthlyData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">No summaries available for current filters</td>
                    </tr>
                  ) : monthlyData.map(m => (
                      <tr key={m.month} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                          <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{m.month}</td>
                          <td className="px-6 py-4 text-right font-mono text-blue-600">{(m.plan || 0).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-mono text-emerald-600">{(m.actual || 0).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-bold">
                            <span className={(m.efficiency || 0) >= 85 ? 'text-emerald-500' : 'text-rose-500'}>
                              {(m.efficiency || 0).toFixed(1)}%
                            </span>
                          </td>
                      </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
