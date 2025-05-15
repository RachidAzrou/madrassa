import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converteert een datum in het formaat DD/MM/YYYY naar een ISO datumstring (YYYY-MM-DD)
 * @param dateString Datum in DD/MM/YYYY formaat
 * @returns ISO datumstring (YYYY-MM-DD) of null bij ongeldige invoer
 */
export function formatDateToDatabaseFormat(dateString: string): string | null {
  if (!dateString) return null;
  
  // Controleer of de input al in ISO formaat is (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Controleer of het formaat DD/MM/YYYY is
  const parts = dateString.split('/');
  if (parts.length !== 3) {
    return null;
  }
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  // Valideer de datum
  if (isNaN(day) || isNaN(month) || isNaN(year) || 
      day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
    return null;
  }
  
  // Formatteren naar YYYY-MM-DD
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

/**
 * Converteert een ISO datumstring (YYYY-MM-DD) naar een leesbaar formaat (DD/MM/YYYY)
 * @param isoDateString ISO datumstring (YYYY-MM-DD)
 * @returns Datum in DD/MM/YYYY formaat
 */
export function formatDateToDisplayFormat(isoDateString: string | null): string {
  if (!isoDateString) return '';
  
  try {
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Fout bij het formatteren van de datum:', error);
    return '';
  }
}
