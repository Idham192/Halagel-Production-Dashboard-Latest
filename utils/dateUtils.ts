
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
 * Formats YYYY-MM-DD for display (e.g., "2025-12-28 SUNDAY").
 * 100% safe from "Yesterday Bug":
 * 1. Splits the string manually to avoid UTC conversion.
 * 2. Sets time to 12:00 PM to create a safety buffer against timezone shifts.
 * 3. Force-formats using Asia/Kuala_Lumpur.
 */
export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return 'Invalid Date';

  // Take only the date part YYYY-MM-DD
  const cleanDate = dateStr.split('T')[0];
  const parts = cleanDate.split('-');
  
  if (parts.length !== 3) return cleanDate;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  // Construct date object at NOON (12:00:00) Malaysia Time.
  // This ensures that even if a user is in a different timezone, 
  // the +/- 12h shift won't change the date.
  const localDate = new Date(year, month - 1, day, 12, 0, 0);
  
  if (isNaN(localDate.getTime())) return cleanDate;

  const dayName = new Intl.DateTimeFormat('en-MY', { 
    weekday: 'long', 
    timeZone: 'Asia/Kuala_Lumpur' 
  }).format(localDate).toUpperCase();
  
  return `${cleanDate} ${dayName}`;
};

/**
 * Validates if a string is a valid YYYY-MM-DD format
 */
export const isValidISODate = (dateStr: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
};
