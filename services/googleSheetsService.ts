
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
      // Use cache-busting to ensure fresh data from the sheet
      const response = await fetch(`${url}?action=${action}&_t=${Date.now()}`);
      if (!response.ok) throw new Error('Network error');
      const json = await response.json();
      return json;
    } catch (error) {
      console.error('Sheets fetch error:', error);
      return null;
    }
  },

  saveData: async (action: string, payload: any): Promise<boolean> => {
    const url = getSheetUrl();
    if (!url) return false;

    try {
      // POST to Google Apps Script
      // We use 'no-cors' to avoid preflight issues with Google's redirect
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data: payload })
      });
      return true;
    } catch (error) {
      console.error('Sheets save error:', error);
      return false;
    }
  }
};
