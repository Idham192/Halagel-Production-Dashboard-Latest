
import React, { useMemo, useState } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { StorageService } from '../../services/storageService';
import { ProductionEntry } from '../../types';
import { PROCESSES } from '../../constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  ClipboardList, CheckCircle, RefreshCw, List, Calendar, 
  ArrowUpRight, TrendingUp, Download, Pencil, Trash2, BarChart3, Layers
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDisplayDate, getCurrentMonthISO } from '../../utils/dateUtils';

export const Dashboard: React.FC = () => {
  const { category, refreshKey, triggerRefresh } = useDashboard();
  const { hasPermission } = useAuth();
  
  // Use Malaysia-aware monthly initialization
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthISO());

  const { productionData } = useMemo(() => {
    return {
      productionData: StorageService.getProductionData(),
    };
  }, [refreshKey]);

  const dashboardData = useMemo(() => {
    const relevant = productionData.filter(d => d.category === category);
    
    let selectedMonthPlan = 0;
    let selectedMonthActual = 0;
    
    // Initialize map with all standard processes to ensure they show even if 0
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

    const dates = new Set<string>();
    filteredEntries.forEach(d => dates.add(d.date));
    const sortedDates = Array.from(dates).sort((a, b) => b.localeCompare(a));

    return sortedDates.map(date => {
        const entriesForDate = filteredEntries.filter(d => d.date === date);
        const totalActualForDate = entriesForDate.reduce((sum, entry) => sum + entry.actualQuantity, 0);
        return {
            date,
            totalActualForDate,
            entries: entriesForDate
        };
    });
  }, [dashboardData.filteredData, selectedMonth]);

  const handleDelete = (id: string) => {
      if(!window.confirm("Delete this record?")) return;
      const newData = productionData.filter(p => p.id !== id);
      StorageService.saveProductionData(newData);
      triggerRefresh();
      window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Entry deleted successfully' } }));
  };

  const handleEdit = (entry: ProductionEntry) => {
    window.dispatchEvent(new CustomEvent('edit-production-entry', { detail: entry }));
  };

  const downloadCSV = () => {
    const headers = ["Date", "Process", "Product", "Plan", "Actual", "Batch No", "Manpower"];
    const rows = dashboardData.filteredData.map(d => [
      d.date, d.process, d.productName, d.planQuantity, d.actualQuantity, d.batchNo, d.manpower
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Halagel_Report_${category}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    
    window.dispatchEvent(new CustomEvent('app-notification', { detail: { message: 'Production report exported successfully!' } }));
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

      {/* Production Chart Section */}
      <div className="glass-panel p-8 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Performance Chart
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Plan vs Actual Comparison ({selectedMonth})</p>
            </div>
        </div>

        <div className="h-[350px] w-full">
          {dashboardData.chartData.some(d => d.Plan > 0 || d.Actual > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="process" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    backgroundColor: '#fff',
                    padding: '12px'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 800, padding: '2px 0' }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '30px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                />
                <Bar 
                  dataKey="Plan" 
                  fill="#3b82f6" 
                  radius={[6, 6, 0, 0]} 
                  barSize={32} 
                />
                <Bar 
                  dataKey="Actual" 
                  fill="#10b981" 
                  radius={[6, 6, 0, 0]} 
                  barSize={32} 
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
              <p className="text-slate-400 font-bold italic">No data recorded for {selectedMonth}.</p>
            </div>
          )}
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
                  <div key={`group-${groupIdx}`} className="bg-white dark:bg-[#1a2333] rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-slate-700/50">
                      <div className="p-6 flex justify-between items-center border-b border-gray-100 dark:border-slate-700/50 bg-gray-50/50 dark:bg-[#232d3f]">
                          <div className="flex items-center gap-4">
                              <Calendar className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                              <div className="flex items-baseline gap-4">
                                <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{datePart}</span>
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{dayPart}</span>
                              </div>
                          </div>
                          <div className="px-6 py-2 bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm shadow-sm dark:shadow-inner">
                            Total Actual: <span className="text-emerald-600 dark:text-emerald-400 ml-1">{group.totalActualForDate.toLocaleString()}</span>
                          </div>
                      </div>

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
                                          <tr key={entry.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-700/20 transition-colors">
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
                                                        <button onClick={() => handleEdit(entry)} className="p-2 text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition">
                                                            <Pencil className="w-5 h-5" />
                                                        </button>
                                                        <button onClick={() => handleDelete(entry.id)} className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/20 rounded-xl transition">
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
                  </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};
