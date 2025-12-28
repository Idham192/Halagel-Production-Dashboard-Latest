
/**
 * HALAGEL DATE UTILITIES
 * Strictly enforces Malaysia Time (UTC+8) to prevent the "Yesterday Bug".
 */

/**
 * Returns YYYY-MM-DD based on Malaysia Timezone.
 * Safe for use in <input type="date">
 */
export const getTodayISO = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
};

/**
 * Returns YYYY-MM based on Malaysia Timezone.
 */
export const getCurrentMonthISO = (): string => {
  return getTodayISO().substring(0, 7);
};

/**
 * Formats YYYY-MM-DD for display (e.g., "2025-12-25 THURSDAY").
 * Uses manual parsing to prevent the browser from applying UTC shifts.
 */
export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return 'Invalid Date';

  // Use only the date portion
  const cleanDate = dateStr.split('T')[0];
  const [year, month, day] = cleanDate.split('-').map(Number);
  
  // Construct date object at NOON local time to avoid boundary shifts
  const localDate = new Date(year, month - 1, day, 12, 0, 0);
  
  if (isNaN(localDate.getTime())) return cleanDate;

  const dayName = localDate.toLocaleDateString('en-MY', { 
    weekday: 'long', 
    timeZone: 'Asia/Kuala_Lumpur' 
  }).toUpperCase();
  
  return `${cleanDate} ${dayName}`;
};

/**
 * Validates if a string is a valid YYYY-MM-DD format
 */
export const isValidISODate = (dateStr: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
};
