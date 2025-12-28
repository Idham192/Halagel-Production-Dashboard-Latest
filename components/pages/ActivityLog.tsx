import React from 'react';
import { StorageService } from '../../services/storageService';

export const ActivityLog: React.FC = () => {
  const logs = StorageService.getLogs();

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">System Activity Log</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <ul className="divide-y divide-gray-100">
            {logs.length === 0 ? (
                <li className="p-8 text-center text-gray-400">No activity recorded yet.</li>
            ) : logs.map(log => (
                <li key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                                <span className="font-bold text-brand-700">{log.userName}</span> 
                                <span className="text-gray-500 font-normal ml-1">performed</span> 
                                <span className="ml-1 px-2 py-0.5 rounded bg-gray-100 text-xs font-mono border border-gray-200">{log.action}</span>
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                            {new Date(log.timestamp).toLocaleString()}
                        </span>
                    </div>
                </li>
            ))}
        </ul>
      </div>
    </div>
  );
};