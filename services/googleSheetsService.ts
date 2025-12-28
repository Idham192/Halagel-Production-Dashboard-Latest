
import { ProductionEntry, OffDay, User } from '../types';

/**
 * GOOGLE SHEETS SETUP INSTRUCTIONS:
 * 1. Create a Google Sheet.
 * 2. In Extensions > Apps Script, paste the updated Code.gs provided.
 * 3. Deploy as Web App (Set "Who has access" to "Anyone").
 * 4. Paste the Web App URL in the Dashboard Setup.
 */

const getSheetUrl = () => localStorage.getItem('halagel_sheets_api_url') || '';

export const GoogleSheetsService = {
  isEnabled: () => !!getSheetUrl(),

  fetchData: async <T>(action: string): Promise<T | null> => {
    const url = getSheetUrl();
    if (!url) return null;

    try {
      // We use a proxy-safe GET request
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
      // Note: Apps Script redirect requires no-cors for simple POST
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
