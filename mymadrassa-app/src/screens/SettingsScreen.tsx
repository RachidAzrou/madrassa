import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppContext } from '../store/AppContext';

// Type definitie voor navigatieparameters
type RootStackParamList = {
  Dashboard: undefined;
  Settings: undefined;
  Login: undefined;
};

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

type Props = {
  navigation: SettingsScreenNavigationProp;
};

// Instellingen interface
interface AppSettings {
  darkMode: boolean;
  notifications: boolean;
  offlineMode: boolean;
  autoSync: boolean;
  language: 'nl' | 'en' | 'ar';
  fontSize: 'small' | 'medium' | 'large';
}

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  // Haal context data en functies op
  const { auth, logout, darkMode, setDarkMode, language, setLanguage, isLoading: contextLoading } = useAppContext();
  
  const [settings, setSettings] = useState<AppSettings>({
    darkMode: darkMode,
    notifications: true,
    offlineMode: false,
    autoSync: true,
    language: language,
    fontSize: 'medium'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const currentUser = auth.user;

  // Controleer authenticatie
  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }]
      });
    }
  }, [auth.isAuthenticated, navigation]);

  // Laden van instellingen
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        // In een echte app zou je hier de instellingen uit opslag halen
        // Voor nu simuleren we een vertraging
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update darkMode en language vanuit de context
        setSettings(prev => ({
          ...prev,
          darkMode: darkMode,
          language: language
        }));
      } catch (error) {
        console.error('Error loading settings:', error);
        Alert.alert('Fout', 'Er is een fout opgetreden bij het laden van de instellingen.');
      } finally {
        setIsLoading(false);
      }
    };

    if (auth.isAuthenticated) {
      loadSettings();
    }
  }, [auth.isAuthenticated, darkMode, language]);

  const handleToggleSetting = (key: keyof AppSettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Update de context voor bepaalde instellingen
    if (key === 'darkMode') {
      setDarkMode(value);
    }
  };

  const handleChangeLanguage = (lang: 'nl' | 'en' | 'ar') => {
    setSettings(prev => ({
      ...prev,
      language: lang
    }));
    
    // Update de context
    setLanguage(lang);
  };

  const handleChangeFontSize = (fontSize: 'small' | 'medium' | 'large') => {
    setSettings(prev => ({
      ...prev,
      fontSize
    }));
    
    // In een echte app zou je dit in de context opslaan
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // In een echte app zou je hier de instellingen opslaan
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Succes', 'Instellingen zijn opgeslagen.');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Fout', 'Er is een fout opgetreden bij het opslaan van de instellingen.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Navigatie gebeurt automatisch via het auth effect bovenaan
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Fout', 'Er is een fout opgetreden bij het uitloggen.');
    }
  };

  const renderLanguageSelector = () => (
    <View style={styles.languageSelector}>
      <TouchableOpacity
        style={[styles.languageButton, settings.language === 'nl' && styles.activeLanguage]}
        onPress={() => handleChangeLanguage('nl')}
      >
        <Text style={[styles.languageButtonText, settings.language === 'nl' && styles.activeLanguageText]}>
          Nederlands
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.languageButton, settings.language === 'en' && styles.activeLanguage]}
        onPress={() => handleChangeLanguage('en')}
      >
        <Text style={[styles.languageButtonText, settings.language === 'en' && styles.activeLanguageText]}>
          English
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.languageButton, settings.language === 'ar' && styles.activeLanguage]}
        onPress={() => handleChangeLanguage('ar')}
      >
        <Text style={[styles.languageButtonText, settings.language === 'ar' && styles.activeLanguageText]}>
          العربية
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderFontSizeSelector = () => (
    <View style={styles.fontSizeSelector}>
      <TouchableOpacity
        style={[styles.fontSizeButton, settings.fontSize === 'small' && styles.activeFontSize]}
        onPress={() => handleChangeFontSize('small')}
      >
        <Text style={[styles.fontSizeButtonText, { fontSize: 14 }, settings.fontSize === 'small' && styles.activeFontSizeText]}>
          Klein
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.fontSizeButton, settings.fontSize === 'medium' && styles.activeFontSize]}
        onPress={() => handleChangeFontSize('medium')}
      >
        <Text style={[styles.fontSizeButtonText, { fontSize: 16 }, settings.fontSize === 'medium' && styles.activeFontSizeText]}>
          Normaal
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.fontSizeButton, settings.fontSize === 'large' && styles.activeFontSize]}
        onPress={() => handleChangeFontSize('large')}
      >
        <Text style={[styles.fontSizeButtonText, { fontSize: 18 }, settings.fontSize === 'large' && styles.activeFontSizeText]}>
          Groot
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Instellingen laden...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Instellingen</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Gebruiker profiel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profiel</Text>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{currentUser?.username || 'Gebruiker'}</Text>
            <Text style={styles.profileEmail}>{currentUser?.email || 'Geen e-mail'}</Text>
            <Text style={styles.profileRole}>
              {currentUser?.role === 'admin' ? 'Beheerder' : 
               currentUser?.role === 'teacher' ? 'Docent' : 'Medewerker'}
            </Text>
          </View>
        </View>

        {/* Uiterlijk */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uiterlijk</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Donkere modus</Text>
              <Text style={styles.settingDescription}>Schakel tussen licht en donker thema</Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(value) => handleToggleSetting('darkMode', value)}
              trackColor={{ false: '#E2E8F0', true: '#1e3a8a' }}
              thumbColor={settings.darkMode ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Taal</Text>
              <Text style={styles.settingDescription}>Kies de taal van de applicatie</Text>
            </View>
          </View>
          {renderLanguageSelector()}

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Lettergrootte</Text>
              <Text style={styles.settingDescription}>Pas de grootte van de tekst aan</Text>
            </View>
          </View>
          {renderFontSizeSelector()}
        </View>

        {/* Notificaties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificaties</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Notificaties</Text>
              <Text style={styles.settingDescription}>Ontvang berichten over belangrijke gebeurtenissen</Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={(value) => handleToggleSetting('notifications', value)}
              trackColor={{ false: '#E2E8F0', true: '#1e3a8a' }}
              thumbColor={settings.notifications ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Synchronisatie */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Synchronisatie</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Offline modus</Text>
              <Text style={styles.settingDescription}>Werk volledig offline met lokaal opgeslagen data</Text>
            </View>
            <Switch
              value={settings.offlineMode}
              onValueChange={(value) => handleToggleSetting('offlineMode', value)}
              trackColor={{ false: '#E2E8F0', true: '#1e3a8a' }}
              thumbColor={settings.offlineMode ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Automatisch synchroniseren</Text>
              <Text style={styles.settingDescription}>Synchroniseer data automatisch wanneer online</Text>
            </View>
            <Switch
              value={settings.autoSync}
              onValueChange={(value) => handleToggleSetting('autoSync', value)}
              trackColor={{ false: '#E2E8F0', true: '#1e3a8a' }}
              thumbColor={settings.autoSync ? '#FFFFFF' : '#FFFFFF'}
              disabled={!settings.offlineMode}
            />
          </View>
        </View>

        {/* Over */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Over</Text>
          
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Versie</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Platform</Text>
            <Text style={styles.aboutValue}>{Platform.OS === 'web' ? 'Web/Desktop' : Platform.OS}</Text>
          </View>
          
          <TouchableOpacity style={styles.aboutLink}>
            <Text style={styles.aboutLinkText}>Bekijk licenties</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.aboutLink}>
            <Text style={styles.aboutLinkText}>Privacybeleid</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.aboutLink}>
            <Text style={styles.aboutLinkText}>Gebruiksvoorwaarden</Text>
          </TouchableOpacity>
        </View>

        {/* Knoppen */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSaveSettings}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Instellingen opslaan</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Uitloggen</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Navigatiebalk onderaan */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={styles.navButtonText}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => {}}
        >
          <Text style={styles.navButtonText}>Studenten</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => {}}
        >
          <Text style={styles.navButtonText}>Docenten</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navButton, styles.activeNavButton]} 
          onPress={() => {}}
        >
          <Text style={[styles.navButtonText, styles.activeNavButtonText]}>Instellingen</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FB',
  },
  loadingText: {
    marginTop: 10,
    color: '#1e3a8a',
    fontSize: 16,
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#4a5568',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#718096',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a202c',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#718096',
  },
  languageSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  languageButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    backgroundColor: '#F5F7FB',
    borderRadius: 6,
  },
  activeLanguage: {
    backgroundColor: '#1e3a8a',
  },
  languageButtonText: {
    color: '#4a5568',
    fontWeight: '500',
  },
  activeLanguageText: {
    color: '#FFFFFF',
  },
  fontSizeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  fontSizeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    backgroundColor: '#F5F7FB',
    borderRadius: 6,
  },
  activeFontSize: {
    backgroundColor: '#1e3a8a',
  },
  fontSizeButtonText: {
    color: '#4a5568',
    fontWeight: '500',
  },
  activeFontSizeText: {
    color: '#FFFFFF',
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  aboutLabel: {
    fontSize: 16,
    color: '#4a5568',
  },
  aboutValue: {
    fontSize: 16,
    color: '#1a202c',
    fontWeight: '500',
  },
  aboutLink: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  aboutLinkText: {
    fontSize: 16,
    color: '#1e3a8a',
  },
  buttonsContainer: {
    margin: 16,
  },
  saveButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#E53E3E',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomNav: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  navButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeNavButton: {
    borderTopWidth: 3,
    borderTopColor: '#1e3a8a',
  },
  navButtonText: {
    fontSize: 14,
    color: '#718096',
  },
  activeNavButtonText: {
    color: '#1e3a8a',
    fontWeight: '600',
  },
});

export default SettingsScreen;