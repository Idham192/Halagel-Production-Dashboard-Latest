
import { ProductionEntry, OffDay, User } from '../types';

/**
 * GOOGLE SHEETS CONFIGURATION
 * 
 * The app uses this URL as the default database connection.
 */
export const HARDCODED_URL = "https://script.google.com/macros/s/AKfycbzbIZqMRFdmYfF5FXhTKecEjf_zh47TU5SKK27zGRKb2gYL5JpyIfiVMVKJZwuAMfLm/exec"; 

const getSheetUrl = () => localStorage.getItem('halagel_sheets_api_url') || HARDCODED_URL;

export const GoogleSheetsService = {
  isEnabled: () => !!getSheetUrl(),
  
  getActiveUrl: () => getSheetUrl(),

  fetchData: async <T>(action: string): Promise<T | null> => {
    const url = getSheetUrl();
    if (!url) return null;

    try {
      // Use double cache-busting (timestamp + random seed) to defeat strict browser/CDN caching
      const seed = Math.random().toString(36).substring(7);
      const response = await fetch(`${url}?action=${action}&_t=${Date.now()}&_s=${seed}`);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const json = await response.json();
      return json;
    } catch (error) {
      console.error(`Sheets fetch error (${action}):`, error);
      return null;
    }
  },

  saveData: async (action: string, payload: any): Promise<boolean> => {
    const url = getSheetUrl();
    if (!url) return false;

    try {
      // Send data to GAS. Note: GAS redirects on POST, so 'no-cors' is often used.
      // We stringify the payload to ensure complex objects aren't mangled.
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
