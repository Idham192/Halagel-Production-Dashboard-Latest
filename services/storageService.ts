
import { User, ProductionEntry, OffDay, ActivityLog } from '../types';
import { INITIAL_USERS, INITIAL_OFF_DAYS, generateSeedProductionData } from '../constants';
import { GoogleSheetsService } from './googleSheetsService';

const KEYS = {
  USERS: 'halagel_users',
  PRODUCTION: 'halagel_production',
  OFF_DAYS: 'halagel_off_days',
  LOGS: 'halagel_activity_logs',
  CURRENT_USER: 'halagel_current_user_session',
};

const init = () => {
  if (!localStorage.getItem(KEYS.USERS)) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(KEYS.OFF_DAYS)) {
    localStorage.setItem(KEYS.OFF_DAYS, JSON.stringify(INITIAL_OFF_DAYS));
  }
  if (!localStorage.getItem(KEYS.PRODUCTION)) {
    localStorage.setItem(KEYS.PRODUCTION, JSON.stringify(generateSeedProductionData()));
  }
  if (!localStorage.getItem(KEYS.LOGS)) {
    localStorage.setItem(KEYS.LOGS, JSON.stringify([]));
  }
};

init();

export const StorageService = {
  // Local CRUD
  getUsers: (): User[] => JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'),
  saveUsers: (users: User[]) => {
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    GoogleSheetsService.saveData('saveUsers', users);
  },
  
  getProductionData: (): ProductionEntry[] => JSON.parse(localStorage.getItem(KEYS.PRODUCTION) || '[]'),
  saveProductionData: (data: ProductionEntry[]) => {
    localStorage.setItem(KEYS.PRODUCTION, JSON.stringify(data));
    GoogleSheetsService.saveData('saveProduction', data);
  },

  /**
   * Deletes a production entry by ID.
   * Uses robust String conversion for ID matching to handle mix of numeric/string IDs.
   */
  deleteProductionEntry: (id: string): { updatedData: ProductionEntry[], deletedItem: ProductionEntry | null } => {
    try {
      const data = StorageService.getProductionData();
      const targetId = String(id);
      
      const targetItem = data.find(p => String(p.id) === targetId) || null;
      const updatedData = data.filter(p => String(p.id) !== targetId);
      
      // Save immediately to local storage
      StorageService.saveProductionData(updatedData);
      
      return { updatedData, deletedItem: targetItem };
    } catch (err) {
      console.error("Storage delete error:", err);
      return { updatedData: StorageService.getProductionData(), deletedItem: null };
    }
  },
  
  getOffDays: (): OffDay[] => JSON.parse(localStorage.getItem(KEYS.OFF_DAYS) || '[]'),
  saveOffDays: (days: OffDay[]) => {
    localStorage.setItem(KEYS.OFF_DAYS, JSON.stringify(days));
    GoogleSheetsService.saveData('saveOffDays', days);
  },

  // Sync Logic
  syncWithSheets: async () => {
    if (!GoogleSheetsService.isEnabled()) return;
    
    const remoteProduction = await GoogleSheetsService.fetchData<ProductionEntry[]>('getProduction');
    if (remoteProduction) localStorage.setItem(KEYS.PRODUCTION, JSON.stringify(remoteProduction));
    
    const remoteOffDays = await GoogleSheetsService.fetchData<OffDay[]>('getOffDays');
    if (remoteOffDays) localStorage.setItem(KEYS.OFF_DAYS, JSON.stringify(remoteOffDays));
  },
  
  getLogs: (): ActivityLog[] => JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]'),
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    try {
      const logs = StorageService.getLogs();
      const newLog: ActivityLog = {
        ...log,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
      logs.unshift(newLog);
      if (logs.length > 1000) logs.pop();
      localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
    } catch (err) {
      console.error("Logging error:", err);
    }
  },

  getSession: (): User | null => {
    const session = localStorage.getItem(KEYS.CURRENT_USER);
    return session ? JSON.parse(session) : null;
  },
  setSession: (user: User | null) => {
    if (user) localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    else localStorage.removeItem(KEYS.CURRENT_USER);
  }
};
