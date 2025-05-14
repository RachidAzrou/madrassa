import { IStorage } from './IStorage';
import { DatabaseStorage } from './databaseStorage';

// Exporteer de storage interface en de DatabaseStorage implementatie
export type { IStorage };
export const storage = new DatabaseStorage();