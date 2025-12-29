
import { User, ProductionEntry, OffDay } from './types';
import { getTodayISO, getDbTimestamp } from './utils/dateUtils';

export const CATEGORIES = ['Healthcare', 'Toothpaste', 'Rocksalt'] as const;
export const PROCESSES = ['Mixing', 'Encapsulation', 'Filling', 'Sorting', 'Packing'] as const;
export const UNITS = ['KG', 'PCS'] as const;

export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Admin User', username: 'admin', email: 'admin@nexus.com', role: 'admin', password: 'password123' },
  { id: 'u2', name: 'Manager User', username: 'manager', email: 'manager@nexus.com', role: 'manager', password: 'password123' },
  { id: 'u3', name: 'Planner User', username: 'planner', email: 'planner@nexus.com', role: 'planner', password: 'password123' },
  { id: 'u4', name: 'Operator User', username: 'operator', email: 'operator@nexus.com', role: 'operator', password: 'password123' },
];

export const INITIAL_OFF_DAYS: OffDay[] = [
  { id: 'od1', date: '2025-12-25', description: 'Christmas Day', createdBy: 'u1' },
  { id: 'od2', date: '2026-01-01', description: 'New Year', createdBy: 'u1' },
];

export const generateSeedProductionData = (): ProductionEntry[] => {
  const data: ProductionEntry[] = [];
  const products = ['Pain Relief Gel', 'Minty Fresh', 'Pink Salt Fine', 'Vitamin C', 'Charcoal Paste'];
  
  const todayStr = getTodayISO();
  const [y, m, d] = todayStr.split('-').map(Number);
  const baseDate = new Date(y, m - 1, d);

  for (let i = 0; i < 30; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    products.forEach((prod, idx) => {
      if (Math.random() > 0.8) return;

      const plan = Math.floor(Math.random() * 500) + 500;
      const actual = Math.floor(plan * (0.8 + Math.random() * 0.2));

      data.push({
        id: `seed-${i}-${idx}`,
        date: dateStr,
        category: idx % 3 === 0 ? 'Healthcare' : idx % 3 === 1 ? 'Toothpaste' : 'Rocksalt',
        process: PROCESSES[idx % 5],
        productName: prod,
        planQuantity: plan,
        actualQuantity: actual,
        unit: idx % 2 === 0 ? 'KG' : 'PCS',
        batchNo: `B-${dateStr.replace(/-/g, '')}-${idx}`,
        manpower: Math.floor(Math.random() * 5) + 3,
        lastUpdatedBy: 'u1',
        updatedAt: getDbTimestamp()
      });
    });
  }
  return data;
};
