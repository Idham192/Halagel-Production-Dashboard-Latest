
import { ProductionEntry, OffDay, User } from '../types';

/**
 * GOOGLE SHEETS CONFIGURATION
 * 
 * Replace the placeholder below with the URL from Step 2.
 */
export const HARDCODED_URL = "PASTE_YOUR_COPIED_APPS_SCRIPT_URL_HERE"; 

const getSheetUrl = () => {
  const savedUrl = localStorage.getItem('halagel_sheets_api_url');
  if (savedUrl && savedUrl.startsWith('https://script.google.com')) return savedUrl;
  if (HARDCODED_URL && HARDCODED_URL.startsWith('https://script.google.com')) return HARDCODED_URL;
  return null;
};

export const GoogleSheetsService = {
  isEnabled: () => !!getSheetUrl(),
  
  getActiveUrl: () => getSheetUrl(),

  fetchData: async <T>(action: string): Promise<T | null> => {
    const url = getSheetUrl();
    if (!url) return null;

    try {
      const seed = Math.random().toString(36).substring(7);
      const response = await fetch(`${url}?action=${action}&_t=${Date.now()}&_s=${seed}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Sheets fetch error (${action}):`, error);
      return null;
    }
  },

  saveData: async (action: string, payload: any): Promise<boolean> => {
    const url = getSheetUrl();
    if (!url) return false;

    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data: payload, timestamp: Date.now() })
      });
      return true;
    } catch (error) {
      console.error(`Sheets save error (${action}):`, error);
      return false;
    }
  }
};
