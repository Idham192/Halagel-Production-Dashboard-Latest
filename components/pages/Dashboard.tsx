
import React, { useMemo, useState } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { StorageService } from '../../services/storageService';
import { ProductionEntry, OffDay } from '../../types';
import { PROCESSES } from '../../constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  ClipboardList, CheckCircle, RefreshCw, List, Calendar, 
  TrendingUp, Download, Pencil, Trash2, BarChart3, Layers,
  Palmtree, CalendarOff
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDisplayDate, getCurrentMonthISO } from '../../utils/dateUtils';

export const Dashboard: React.FC = () => {
  const { category, refreshKey, triggerRefresh } = useDashboard();
  const { user, hasPermission } = useAuth();
  
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthISO());

  const { productionData, offDays } = useMemo(() => {
    return {
      productionData: StorageService.getProductionData(),
      offDays: StorageService.getOffDays(),
    };
  }, [refreshKey]);

  const dashboardData = useMemo(() => {
    const relevant = productionData.filter(d => d.category === category);
    
    let selectedMonthPlan = 0;
    let selectedMonthActual = 0;
    
    const selectedMonthProcessMap = new Map<string, {process: string, Plan: number, Actual: number}>();
    PROCESSES.forEach(proc => {
      selectedMonthProcessMap.set(proc, { process: proc, Plan: 0, Actual: 0 });
    });

    relevant.forEach(d => {
      const monthKey = d.date.substring(0, 7);
      if (monthKey === selectedMonth) {
        selectedMonthPlan += d.planQuantity;
        selectedMonthActual += d.actualQuantity;
        
        if (!selectedMonthProcessMap.has(d.process)) {
          selectedMonthProcessMap.set(d.process, { process: d.process, Plan: 0, Actual: 0 });
        }
        const p = selectedMonthProcessMap.get(d.process)!;
        p.Plan += d.planQuantity;
        p.Actual += d.actualQuantity;
      }
    });

    return {
      filteredData: relevant.sort((a,b) => b.date.localeCompare(a.date)),
      selectedMonthStats: { 
        plan: selectedMonthPlan, 
        actual: selectedMonthActual,
        efficiency: selectedMonthPlan > 0 ? (selectedMonthActual / selectedMonthPlan) * 100 : 0
      },
      chartData: Array.from(selectedMonthProcessMap.values())
    };
  }, [productionData, category, selectedMonth]);

  const dailyGroups = useMemo(() => {
    const baseData = dashboardData.filteredData;
    const filteredEntries = baseData.filter(d => d.date.startsWith(selectedMonth));
    const filteredOffDays = offDays.filter(od => od.date.startsWith(selectedMonth));

    const dates = new Set<string>();
    filteredEntries.forEach(d => dates.add(d.date));
    filteredOffDays.forEach(od => dates.add(od.date));
    
    const sortedDates = Array.from(dates).sort((a, b) => b.localeCompare(a));

    return sortedDates.map(date => {
        const entriesForDate = filteredEntries.filter(d => d.date === date);
        const offDayInfo = filteredOffDays.find(od => od.date === date);
        const totalActualForDate = entriesForDate.reduce((sum, entry) => sum + entry.actualQuantity, 0);
        return {
            date,
            totalActualForDate,
            entries: entriesForDate,
            isOffDay: !!offDayInfo,
            offDayName: offDayInfo?.description || ''
        };
    });
  }, [dashboardData.filteredData, offDays, selectedMonth]);

  const handleDelete = (id: string) => {
      if(!window.confirm("Are you sure you want to PERMANENTLY delete this record? This action cannot be undone.")) return;
      
      // Perform atomic delete and get result
      const { deletedItem } = StorageService.deleteProductionEntry(id);
      
      if (deletedItem) {
          StorageService.addLog({
            userId: user!.id,
            userName: user!.name,
            action: 'DELETE_RECORD',
            details: `Admin/Manager permanently deleted production record: ${deletedItem.productName} (${deletedItem.date})`
          });
          
          window.dispatchEvent(new CustomEvent('app-notification', { 
            detail: { message: 'RECORD DELETED SUCCESSFULLY', type: 'info' } 
          }));
      } else {
          window.dispatchEvent(new CustomEvent('app-notification', { 
            detail: { message: 'ERROR: RECORD NOT FOUND', type: 'info' } 
          }));
      }

      // Force UI refresh regardless of log outcome
      triggerRefresh();
  };

  const handleEdit = (entry: ProductionEntry) => {
    window.dispatchEvent(new CustomEvent('edit-production-entry', { detail: entry }));
  };

  const downloadCSV = () => {
    const headers = ["Date", "Status", "Process", "Product", "Plan", "Actual", "Batch No", "Manpower"];
    const rows = dailyGroups.flatMap(g => {
        if (g.entries.length === 0) {
            return [[g.date, g.offDayName || 'Off Day', '-', '-', 0, 0, '-', 0]];
        }
        return g.entries.map(d => [
            d.date, g.isOffDay ? `Holiday (${g.offDayName})` : 'Normal', d.process, d.productName, d.planQuantity, d.actualQuantity, d.batchNo, d.manpower
        ]);
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Halagel_Full_Report_${category}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    
    StorageService.addLog({
      userId: user!.id,
      userName: user!.name,
      action: 'EXPORT_REPORT',
      details: `Exported full report for ${category} (${selectedMonth})`
    });
    
    window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'REPORT EXPORTED SUCCESSFULLY', type: 'success' } }));
  };

  return (
    <div className="space-y-8 pb-12">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl border-l-4 border-blue-500 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <TrendingUp className="w-16 h-16" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Plan (Total)</p>
            <h3 className="text-3xl font-black mt-1 text-slate-800 dark:text-white">{dashboardData.selectedMonthStats.plan.toLocaleString()}</h3>
        </div>
        <div className="glass-panel p-6 rounded-3xl border-l-4 border-emerald-500 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <CheckCircle className="w-16 h-16" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Actual (Total)</p>
            <h3 className="text-3xl font-black mt-1 text-slate-800 dark:text-white">{dashboardData.selectedMonthStats.actual.toLocaleString()}</h3>
        </div>
        <div className="glass-panel p-6 rounded-3xl border-l-4 border-indigo-500 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <RefreshCw className="w-16 h-16" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Efficiency</p>
            <h3 className="text-3xl font-black mt-1 text-slate-800 dark:text-white">{dashboardData.selectedMonthStats.efficiency.toFixed(1)}%</h3>
        </div>
      </div>

      {/* Monthly Breakdown by Process */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Layers className="w-5 h-5 text-indigo-500" />
          <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Monthly Process Breakdown</h3>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {dashboardData.chartData.map(proc => {
            const eff = proc.Plan > 0 ? (proc.Actual / proc.Plan) * 100 : 0;
            return (
              <div key={proc.process} className="glass-panel p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">{proc.process}</p>
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Plan</span>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-200">{proc.Plan.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Actual</span>
                    <span className="text-sm font-black text-emerald-500">{proc.Actual.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-50 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-[8px] font-black text-slate-300 uppercase">Eff.</span>
                    <span className={`text-xs font-black ${eff >= 100 ? 'text-emerald-500' : eff >= 75 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {eff.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 px-2">
            <div>
               <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <List className="w-5 h-5 text-indigo-500" />
                  Daily Production Log
               </h3>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Detailed operational entries</p>
            </div>
            
            <div className="flex items-center gap-3">
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 text-sm font-bold bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 dark:text-white outline-none"
              />
              <button onClick={downloadCSV} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 uppercase tracking-widest transition">
                <Download className="w-4 h-4" /> Export Report
              </button>
            </div>
        </div>
        
        <div className="space-y-8">
            {dailyGroups.length === 0 ? (
               <div className="bg-white dark:bg-slate-850 rounded-3xl p-12 text-center border-2 border-dashed border-gray-100 dark:border-slate-800">
                  <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold">No production logs found for the selected month.</p>
               </div>
            ) : dailyGroups.map((group, groupIdx) => {
                const displayDate = formatDisplayDate(group.date);
                const [datePart, dayPart] = displayDate.split(' ');

                return (
                  <div key={`group-${groupIdx}`} className={`bg-white dark:bg-[#1a2333] rounded-3xl overflow-hidden shadow-xl border ${group.isOffDay ? 'border-amber-400/50' : 'border-gray-100 dark:border-slate-700/50'}`}>
                      <div className={`p-6 flex justify-between items-center border-b ${group.isOffDay ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30' : 'border-gray-100 dark:border-slate-700/50 bg-gray-50/50 dark:bg-[#232d3f]'}`}>
                          <div className="flex items-center gap-4">
                              {group.isOffDay ? <Palmtree className="w-7 h-7 text-amber-500" /> : <Calendar className="w-7 h-7 text-slate-400 dark:text-slate-500" />}
                              <div className="flex items-baseline gap-4">
                                <span className={`text-2xl font-black tracking-tight ${group.isOffDay ? 'text-amber-700 dark:text-amber-400' : 'text-slate-800 dark:text-white'}`}>{datePart}</span>
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{dayPart}</span>
                              </div>
                              {group.isOffDay && (
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase rounded-full shadow-sm tracking-widest">
                                    <CalendarOff className="w-3 h-3" />
                                    {group.offDayName || 'OFF DAY'}
                                </span>
                              )}
                          </div>
                          <div className="px-6 py-2 bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm shadow-sm dark:shadow-inner">
                            Total Actual: <span className="text-emerald-600 dark:text-emerald-400 ml-1">{group.totalActualForDate.toLocaleString()}</span>
                          </div>
                      </div>

                      {group.entries.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-full text-slate-300 dark:text-slate-700">
                                <Palmtree className="w-10 h-10" />
                            </div>
                            <p className="text-slate-500 font-bold">No production recorded for this Off Day.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-slate-700/50 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-gray-50 dark:bg-[#0f172a]/20">
                                        <th className="px-8 py-5">Process</th>
                                        <th className="px-8 py-5">Product</th>
                                        <th className="px-8 py-5 text-center">Plan Qty</th>
                                        <th className="px-8 py-5 text-center">Actual Qty</th>
                                        <th className="px-8 py-5 text-center">Efficiency</th>
                                        <th className="px-8 py-5 text-center">Batch No</th>
                                        <th className="px-8 py-5 text-center">Manpower</th>
                                        {hasPermission(['admin', 'manager']) && <th className="px-8 py-5 text-center">Action</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-slate-800/30">
                                    {group.entries.map(entry => {
                                        const eff = entry.planQuantity > 0 ? (entry.actualQuantity / entry.planQuantity) * 100 : 0;
                                        const effColor = eff >= 100 ? 'text-[#10b981]' : eff >= 75 ? 'text-[#fbbf24]' : 'text-[#f43f5e]';

                                        return (
                                            <tr key={entry.id} className={`hover:bg-gray-50/80 dark:hover:bg-slate-700/20 transition-colors ${group.isOffDay ? 'bg-amber-50/20 dark:bg-amber-900/5' : ''}`}>
                                                <td className="px-8 py-6">
                                                    <span className="inline-block px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase">
                                                      {entry.process}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-sm font-black text-slate-800 dark:text-white">{entry.productName}</span>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className="text-blue-600 dark:text-blue-400 font-black font-mono text-lg">{entry.planQuantity.toLocaleString()}</span>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-black font-mono text-lg">{entry.actualQuantity.toLocaleString()}</span>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className={`font-black text-lg ${effColor}`}>{eff.toFixed(0)}%</span>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className="text-slate-400 dark:text-slate-500 font-mono text-xs font-bold uppercase">{entry.batchNo || '-'}</span>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className="text-slate-700 dark:text-slate-200 font-black text-lg">{entry.manpower || 0}</span>
                                                </td>
                                                {hasPermission(['admin', 'manager']) && (
                                                  <td className="px-8 py-6">
                                                      <div className="flex items-center justify-center gap-3">
                                                          <button onClick={() => handleEdit(entry)} title="Edit Record" className="p-2 text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition">
                                                              <Pencil className="w-5 h-5" />
                                                          </button>
                                                          <button onClick={() => handleDelete(entry.id)} title="Delete Record" className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/20 rounded-xl transition">
                                                              <Trash2 className="w-5 h-5" />
                                                          </button>
                                                      </div>
                                                  </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                      )}
                  </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};
