/**
 * DatabaseElectronImpl.ts
 * 
 * Electron-specifieke implementatie van de DatabaseService interface.
 * Deze klasse maakt gebruik van de Electron IPC API om te communiceren met de main process
 * en de lokale database te beheren.
 */

import { Platform } from 'react-native';
import { IDatabaseService, Student, Teacher, Class, User } from './DatabaseService';

// Type definitie voor IPC communicatie
declare global {
  interface Window {
    electron?: {
      ipcRenderer: {
        invoke(channel: string, ...args: any[]): Promise<any>;
        send(channel: string, ...args: any[]): void;
        on(channel: string, func: (...args: any[]) => void): () => void;
      };
      platform: string;
      versions: {
        app: string;
        electron: string;
        node: string;
      };
    };
  }
}

class DatabaseElectronImpl implements IDatabaseService {
  private static instance: DatabaseElectronImpl;
  private isInitialized: boolean = false;
  private isElectron: boolean;

  // Singleton patroon
  public static getInstance(): DatabaseElectronImpl {
    if (!DatabaseElectronImpl.instance) {
      DatabaseElectronImpl.instance = new DatabaseElectronImpl();
    }
    return DatabaseElectronImpl.instance;
  }

  private constructor() {
    this.isElectron = Platform.OS === 'web' && typeof window !== 'undefined' && !!window.electron;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (!this.isElectron) {
        throw new Error('Deze implementatie is alleen voor Electron');
      }

      console.log('Initialiseren van Electron database');
      
      // Initialiseer database via IPC
      const result = await window.electron!.ipcRenderer.invoke('get-database-connection');
      
      if (!result.success) {
        throw new Error('Database initialisatie mislukt');
      }
      
      this.isInitialized = true;
      console.log('Electron database initialisatie voltooid');
    } catch (error) {
      console.error('Fout bij initialiseren Electron database:', error);
      throw error;
    }
  }

  // Student operaties
  public async getStudents(): Promise<Student[]> {
    await this.ensureInitialized();
    
    const result = await window.electron!.ipcRenderer.invoke('execute-query', 'GET_STUDENTS');
    
    if (!result.success) {
      throw new Error('Fout bij ophalen studenten: ' + result.error);
    }
    
    return result.data || [];
  }

  public async getStudentById(id: string): Promise<Student | null> {
    await this.ensureInitialized();
    
    const result = await window.electron!.ipcRenderer.invoke('execute-query', 'GET_STUDENT_BY_ID', { id });
    
    if (!result.success) {
      throw new Error('Fout bij ophalen student: ' + result.error);
    }
    
    return result.data || null;
  }

  public async createStudent(student: Omit<Student, 'id'>): Promise<Student> {
    await this.ensureInitialized();
    
    const result = await window.electron!.ipcRenderer.invoke('execute-query', 'CREATE_STUDENT', student);
    
    if (!result.success) {
      throw new Error('Fout bij aanmaken student: ' + result.error);
    }
    
    return result.data;
  }

  public async updateStudent(id: string, student: Partial<Student>): Promise<Student> {
    await this.ensureInitialized();
    
    const result = await window.electron!.ipcRenderer.invoke('execute-query', 'UPDATE_STUDENT', { id, ...student });
    
    if (!result.success) {
      throw new Error('Fout bij bijwerken student: ' + result.error);
    }
    
    return result.data;
  }

  public async deleteStudent(id: string): Promise<boolean> {
    await this.ensureInitialized();
    
    const result = await window.electron!.ipcRenderer.invoke('execute-query', 'DELETE_STUDENT', { id });
    
    if (!result.success) {
      throw new Error('Fout bij verwijderen student: ' + result.error);
    }
    
    return true;
  }

  // Teacher operaties
  public async getTeachers(): Promise<Teacher[]> {
    await this.ensureInitialized();
    
    const result = await window.electron!.ipcRenderer.invoke('execute-query', 'GET_TEACHERS');
    
    if (!result.success) {
      throw new Error('Fout bij ophalen docenten: ' + result.error);
    }
    
    return result.data || [];
  }

  public async getTeacherById(id: string): Promise<Teacher | null> {
    await this.ensureInitialized();
    
    const result = await window.electron!.ipcRenderer.invoke('execute-query', 'GET_TEACHER_BY_ID', { id });
    
    if (!result.success) {
      throw new Error('Fout bij ophalen docent: ' + result.error);
    }
    
    return result.data || null;
  }

  public async createTeacher(teacher: Omit<Teacher, 'id'>): Promise<Teacher> {
    await this.ensureInitialized();
    
    const result = await window.electron!.ipcRenderer.invoke('execute-query', 'CREATE_TEACHER', teacher);
    
    if (!result.success) {
      throw new Error('Fout bij aanmaken docent: ' + result.error);
    }
    
    return result.data;
  }

  public async updateTeacher(id: string, teacher: Partial<Teacher>): Promise<Teacher> {
    await this.ensureInitialized();
    
    const result = await window.electron!.ipcRenderer.invoke('execute-query', 'UPDATE_TEACHER', { id, ...teacher });
    
    if (!result.success) {
      throw new Error('Fout bij bijwerken docent: ' + result.error);
    }
    
    return result.data;
  }

  public async deleteTeacher(id: string): Promise<boolean> {
    await this.ensureInitialized();
    
    const result = await window.electron!.ipcRenderer.invoke('execute-query', 'DELETE_TEACHER', { id });
    
    if (!result.success) {
      throw new Error('Fout bij verwijderen docent: ' + result.error);
    }
    
    return true;
  }

  // Class operaties
  public async getClasses(): Promise<Class[]> {
    await this.ensureInitialized();
    
    const result = await window.electron!.ipcRenderer.invoke('execute-query', 'GET_CLASSES');
    
    if (!result.success) {
      throw new Error('Fout bij ophalen klassen: ' + result.error);
    }
    
    return result.data || [];
  }

  public async getClassById(id: string): Promise<Class | null> {
    await this.ensureInitialized();
    
    const result = await window.electron!.ipcRenderer.invoke('execute-query', 'GET_CLASS_BY_ID', { id });
    
    if (!result.success) {
      throw new Error('Fout bij ophalen klas: ' + result.error);
    }
    
    return result.data || null;
  }

  public async createClass(classData: Omit<Class, 'id'>): Promise<Class> {
    await this.ensureInitialized();
    
    const result = await window.electron!.ipcRenderer.invoke('execute-query', 'CREATE_CLASS', classData);
    
    if (!result.success) {
      throw new Error('Fout bij aanmaken klas: ' + result.error);
    }
    
    return result.data;
  }

  public async updateClass(id: string, classData: Partial<Class>): Promise<Class> {
    await this.ensureInitialized();
    
    const result = await window.electron!.ipcRenderer.invoke('execute-query', 'UPDATE_CLASS', { id, ...classData });
    
    if (!result.success) {
      throw new Error('Fout bij bijwerken klas: ' + result.error);
    }
    
    return result.data;
  }

  public async deleteClass(id: string): Promise<boolean> {
    await this.ensureInitialized();
    
    const result = await window.electron!.ipcRenderer.invoke('execute-query', 'DELETE_CLASS', { id });
    
    if (!result.success) {
      throw new Error('Fout bij verwijderen klas: ' + result.error);
    }
    
    return true;
  }

  // User operaties
  public async getUsers(): Promise<User[]> {
    await this.ensureInitialized();
    
    const result = await window.electron!.ipcRenderer.invoke('execute-query', 'GET_USERS');
    
    if (!result.success) {
      throw new Error('Fout bij ophalen gebruikers: ' + result.error);
    }
    
    return result.data || [];
  }

  public async getUserById(id: string): Promise<User | null> {
    await this.ensureInitialized();
    
    const result = await window.electron!.ipcRenderer.invoke('execute-query', 'GET_USER_BY_ID', { id });
    
    if (!result.success) {
      throw new Error('Fout bij ophalen gebruiker: ' + result.error);
    }
    
    return result.data || null;
  }

  public async getUserByUsername(username: string): Promise<User | null> {
    await this.ensureInitialized();
    
    const result = await window.electron!.ipcRenderer.invoke('execute-query', 'GET_USER_BY_USERNAME', { username });
    
    if (!result.success) {
      throw new Error('Fout bij ophalen gebruiker: ' + result.error);
    }
    
    return result.data || null;
  }

  public async createUser(user: Omit<User, 'id'>): Promise<User> {
    await this.ensureInitialized();
    
    const result = await window.electron!.ipcRenderer.invoke('execute-query', 'CREATE_USER', user);
    
    if (!result.success) {
      throw new Error('Fout bij aanmaken gebruiker: ' + result.error);
    }
    
    return result.data;
  }

  public async updateUser(id: string, user: Partial<User>): Promise<User> {
    await this.ensureInitialized();
    
    const result = await window.electron!.ipcRenderer.invoke('execute-query', 'UPDATE_USER', { id, ...user });
    
    if (!result.success) {
      throw new Error('Fout bij bijwerken gebruiker: ' + result.error);
    }
    
    return result.data;
  }

  public async deleteUser(id: string): Promise<boolean> {
    await this.ensureInitialized();
    
    const result = await window.electron!.ipcRenderer.invoke('execute-query', 'DELETE_USER', { id });
    
    if (!result.success) {
      throw new Error('Fout bij verwijderen gebruiker: ' + result.error);
    }
    
    return true;
  }

  // Synchronisatie met remote database
  public async synchronize(): Promise<void> {
    await this.ensureInitialized();
    
    const result = await window.electron!.ipcRenderer.invoke('execute-query', 'SYNCHRONIZE');
    
    if (!result.success) {
      throw new Error('Fout bij synchroniseren database: ' + result.error);
    }
  }

  // Helper functie om te zorgen dat de database geïnitialiseerd is
  private async ensureInitialized(): Promise<void> {
    if (!this.isElectron) {
      throw new Error('Deze implementatie is alleen voor Electron');
    }
    
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
}

export default DatabaseElectronImpl.getInstance();