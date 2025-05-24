/**
 * AuthService.ts
 * Deze service beheert de authenticatie en gebruikerstoegang in de app.
 * Het werkt samen met ApiService voor verificatie en opslaan/ophalen van gebruikersgegevens.
 */

import { Platform } from 'react-native';
import ApiService from './ApiService';
import { User } from './DatabaseService';

// Type definitie voor inloggegevens
export interface LoginCredentials {
  username: string;
  password: string;
}

// Type definitie voor authenticatie-status
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  error: string | null;
  isLoading: boolean;
}

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    error: null,
    isLoading: false
  };
  
  private listeners: Array<(state: AuthState) => void> = [];

  // Singleton patroon
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private constructor() {
    // Bij initialisatie controleren of er een opgeslagen token is
    this.checkPersistedAuth();
  }

  private checkPersistedAuth() {
    // In een echte app zou je hier controleren of er een opgeslagen token is
    // Bijvoorbeeld in AsyncStorage, SecureStore of localStorage
    console.log('Controleren op bestaande inlogsessie...');
    
    // Controleren of we in Electron draaien
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.electron) {
      // In Electron zouden we de electron API gebruiken voor veilige opslag
      console.log('Electron-specifieke authenticatie controle');
    }
  }

  // Subscribe methode voor het observeren van authenticatiestatus wijzigingen
  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    // Stuur de huidige state naar de nieuwe listener
    listener(this.authState);
    
    // Return unsubscribe functie
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notificeer alle luisteraars over wijzigingen in de authenticatiestatus
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.authState));
  }

  // Inloggen
  public async login(credentials: LoginCredentials): Promise<boolean> {
    try {
      this.authState = {
        ...this.authState,
        isLoading: true,
        error: null
      };
      this.notifyListeners();

      const response = await ApiService.login(credentials.username, credentials.password);
      
      if (response.success && response.data) {
        // Inloggegevens opslaan (in een echte app)
        // await this.persistAuth(response.data);
        
        this.authState = {
          isAuthenticated: true,
          user: response.data,
          error: null,
          isLoading: false
        };
        this.notifyListeners();
        return true;
      } else {
        this.authState = {
          isAuthenticated: false,
          user: null,
          error: response.error || 'Onbekende inlogfout',
          isLoading: false
        };
        this.notifyListeners();
        return false;
      }
    } catch (error) {
      this.authState = {
        isAuthenticated: false,
        user: null,
        error: 'Er is een fout opgetreden bij het inloggen',
        isLoading: false
      };
      this.notifyListeners();
      return false;
    }
  }

  // Uitloggen
  public async logout(): Promise<void> {
    try {
      this.authState = {
        ...this.authState,
        isLoading: true
      };
      this.notifyListeners();

      await ApiService.logout();
      
      // In een echte app zou je hier opgeslagen tokens verwijderen
      // await this.clearPersistedAuth();
      
      this.authState = {
        isAuthenticated: false,
        user: null,
        error: null,
        isLoading: false
      };
      this.notifyListeners();
    } catch (error) {
      console.error('Logout error:', error);
      
      this.authState = {
        ...this.authState,
        isLoading: false,
        error: 'Uitloggen mislukt'
      };
      this.notifyListeners();
    }
  }

  // Haal huidige authenticatiestatus op
  public getAuthState(): AuthState {
    return this.authState;
  }

  // Controleer of gebruiker is ingelogd
  public isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  // Haal huidige gebruiker op
  public getCurrentUser(): User | null {
    return this.authState.user;
  }

  // Controleer of gebruiker admin-rechten heeft
  public isAdmin(): boolean {
    return this.authState.user?.role === 'admin';
  }

  // Reset authenticatiefout
  public clearError(): void {
    this.authState = {
      ...this.authState,
      error: null
    };
    this.notifyListeners();
  }
}

export default AuthService.getInstance();