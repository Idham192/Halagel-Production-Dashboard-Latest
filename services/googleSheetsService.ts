
import { ProductionEntry, OffDay, User } from '../types';

/**
 * GOOGLE SHEETS SETUP INSTRUCTIONS:
 * 1. Create a Google Sheet.
 * 2. In Extensions > Apps Script, paste a script that handles doGet(e) and doPost(e).
 * 3. Deploy as Web App (Set "Who has access" to "Anyone").
 * 4. Paste the Web App URL in localStorage or replace the constant below.
 */

const getSheetUrl = () => localStorage.getItem('nexus_sheets_api_url') || '';

export const GoogleSheetsService = {
  isEnabled: () => !!getSheetUrl(),

  fetchData: async <T>(action: string): Promise<T | null> => {
    const url = getSheetUrl();
    if (!url) return null;

    try {
      const response = await fetch(`${url}?action=${action}`);
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      console.error('Sheets fetch error:', error);
      return null;
    }
  },

  saveData: async (action: string, payload: any): Promise<boolean> => {
    const url = getSheetUrl();
    if (!url) return false;

    try {
      const response = await fetch(url, {
        method: 'POST',
        mode: 'no-cors', // Standard for simple Apps Script POSTs
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data: payload })
      });
      return true; // no-cors doesn't return response body
    } catch (error) {
      console.error('Sheets save error:', error);
      return false;
    }
  }
};
