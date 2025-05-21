import { DatabaseStorage } from './databaseStorage';
import { IStorage } from './IStorage';

// Exporteer de DatabaseStorage instantie als storage
export const storage: IStorage = new DatabaseStorage();