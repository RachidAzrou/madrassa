import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AuthService, { AuthState } from '../services/AuthService';
import ApiService from '../services/ApiService';
import DatabaseService from '../services/DatabaseService';
import { Student, Teacher, Class } from '../services/DatabaseService';

// Type definities voor app state
interface AppContextState {
  // Auth
  auth: AuthState;
  
  // Data
  students: Student[];
  teachers: Teacher[];
  classes: Class[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  darkMode: boolean;
  language: 'nl' | 'en' | 'ar';
  
  // Functies
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchStudents: () => Promise<void>;
  fetchTeachers: () => Promise<void>;
  fetchClasses: () => Promise<void>;
  setDarkMode: (enabled: boolean) => void;
  setLanguage: (language: 'nl' | 'en' | 'ar') => void;
  clearError: () => void;
}

// Creëer context met default waarden
const AppContext = createContext<AppContextState>({
  // Auth
  auth: {
    isAuthenticated: false,
    user: null,
    error: null,
    isLoading: false
  },
  
  // Data
  students: [],
  teachers: [],
  classes: [],
  
  // UI state
  isLoading: false,
  error: null,
  darkMode: false,
  language: 'nl',
  
  // Functies (placeholder implementaties)
  login: async () => false,
  logout: async () => {},
  fetchStudents: async () => {},
  fetchTeachers: async () => {},
  fetchClasses: async () => {},
  setDarkMode: () => {},
  setLanguage: () => {},
  clearError: () => {}
});

// Hook voor het gebruiken van de context
export const useAppContext = () => useContext(AppContext);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Auth state
  const [auth, setAuth] = useState<AuthState>(AuthService.getAuthState());
  
  // Data state
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<'nl' | 'en' | 'ar'>('nl');

  // Luister naar veranderingen in auth state
  useEffect(() => {
    const unsubscribe = AuthService.subscribe(newAuthState => {
      setAuth(newAuthState);
    });
    
    return () => unsubscribe();
  }, []);

  // Database initialisatie
  useEffect(() => {
    const initDatabase = async () => {
      try {
        await DatabaseService.initialize();
        console.log('Database geïnitialiseerd');
      } catch (err) {
        console.error('Fout bij initialiseren database:', err);
        setError('Er is een fout opgetreden bij het initialiseren van de database.');
      }
    };
    
    initDatabase();
  }, []);

  // Login functie
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await AuthService.login({ username, password });
      
      if (success) {
        // Data ophalen na succesvolle login
        await fetchStudents();
        await fetchTeachers();
        await fetchClasses();
      }
      
      return success;
    } catch (err) {
      console.error('Login error:', err);
      setError('Er is een fout opgetreden bij het inloggen.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout functie
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      await AuthService.logout();
      
      // Reset app state na uitloggen
      setStudents([]);
      setTeachers([]);
      setClasses([]);
    } catch (err) {
      console.error('Logout error:', err);
      setError('Er is een fout opgetreden bij het uitloggen.');
    } finally {
      setIsLoading(false);
    }
  };

  // Functies voor het ophalen van data
  const fetchStudents = async (): Promise<void> => {
    if (!auth.isAuthenticated) return;
    
    setIsLoading(true);
    
    try {
      const response = await ApiService.getStudents();
      
      if (response.success && response.data) {
        setStudents(response.data);
      } else {
        setError(response.error || 'Er is een fout opgetreden bij het ophalen van studenten.');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Er is een fout opgetreden bij het ophalen van studenten.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeachers = async (): Promise<void> => {
    if (!auth.isAuthenticated) return;
    
    setIsLoading(true);
    
    try {
      const response = await ApiService.getTeachers();
      
      if (response.success && response.data) {
        setTeachers(response.data);
      } else {
        setError(response.error || 'Er is een fout opgetreden bij het ophalen van docenten.');
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError('Er is een fout opgetreden bij het ophalen van docenten.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async (): Promise<void> => {
    if (!auth.isAuthenticated) return;
    
    setIsLoading(true);
    
    try {
      const response = await ApiService.getClasses();
      
      if (response.success && response.data) {
        setClasses(response.data);
      } else {
        setError(response.error || 'Er is een fout opgetreden bij het ophalen van klassen.');
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Er is een fout opgetreden bij het ophalen van klassen.');
    } finally {
      setIsLoading(false);
    }
  };

  // Functies voor het instellen van UI preferences
  const handleSetDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    // In een echte app zou je hier de preference opslaan
  };

  const handleSetLanguage = (lang: 'nl' | 'en' | 'ar') => {
    setLanguage(lang);
    // In een echte app zou je hier de preference opslaan
  };

  // Functie om errors te wissen
  const clearError = () => {
    setError(null);
  };

  // Provider waarde object
  const value: AppContextState = {
    auth,
    students,
    teachers,
    classes,
    isLoading,
    error,
    darkMode,
    language,
    login,
    logout,
    fetchStudents,
    fetchTeachers,
    fetchClasses,
    setDarkMode: handleSetDarkMode,
    setLanguage: handleSetLanguage,
    clearError
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;