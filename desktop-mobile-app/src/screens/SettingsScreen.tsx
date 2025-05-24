import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  Platform,
  useWindowDimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

// Dummy icon component - zou vervangen worden door echte iconen
const Icon = ({ name }: { name: string }) => (
  <View style={{ width: 20, height: 20, backgroundColor: '#1e40af', borderRadius: 4 }} />
);

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

// Setting item component
interface SettingItemProps {
  icon: string;
  title: string;
  description?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({ 
  icon, 
  title, 
  description, 
  onPress, 
  rightElement 
}) => {
  return (
    <TouchableOpacity 
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingIcon}>
        <Icon name={icon} />
      </View>
      
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      
      {rightElement && (
        <View style={styles.settingRight}>
          {rightElement}
        </View>
      )}
    </TouchableOpacity>
  );
};

// Setting group component
interface SettingGroupProps {
  title: string;
  children: React.ReactNode;
}

const SettingGroup: React.FC<SettingGroupProps> = ({ title, children }) => {
  return (
    <View style={styles.settingGroup}>
      <Text style={styles.settingGroupTitle}>{title}</Text>
      <View style={styles.settingGroupContent}>
        {children}
      </View>
    </View>
  );
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;
  
  // States voor de switches
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  
  // Dummy functies voor de instellingen
  const handleAccountSettings = () => {
    console.log('Navigate to account settings');
  };
  
  const handleLanguageSettings = () => {
    console.log('Navigate to language settings');
  };
  
  const handleSecuritySettings = () => {
    console.log('Navigate to security settings');
  };
  
  const handleDataBackup = () => {
    console.log('Navigate to data backup settings');
  };
  
  const handleSyncSettings = () => {
    console.log('Navigate to sync settings');
  };
  
  const handleHelpCenter = () => {
    console.log('Navigate to help center');
  };
  
  const handleAbout = () => {
    console.log('Navigate to about page');
  };
  
  const handleLogout = () => {
    // In een echte app zou dit een bevestigingsdialoog tonen
    if (Platform.OS === 'web') {
      // Voor de Electron versie
      const confirmLogout = window.confirm('Weet je zeker dat je wilt uitloggen?');
      if (confirmLogout) {
        console.log('User logged out');
        navigation.replace('Login');
      }
    } else {
      // Voor de mobiele versie
      Alert.alert(
        'Uitloggen',
        'Weet je zeker dat je wilt uitloggen?',
        [
          { text: 'Annuleren', style: 'cancel' },
          { 
            text: 'Uitloggen', 
            style: 'destructive',
            onPress: () => {
              console.log('User logged out');
              navigation.replace('Login');
            }
          }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Instellingen</Text>
          <Text style={styles.headerSubtitle}>Pas de applicatie aan</Text>
        </View>

        <View style={styles.content}>
          {/* Profiel sectie */}
          <View style={styles.profileSection}>
            <View style={styles.profileAvatar}>
              {/* Hier zou een echte avatar/profielfoto komen */}
              <Text style={styles.avatarText}>AB</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Ahmed Ben Ali</Text>
              <Text style={styles.profileEmail}>ahmed@example.com</Text>
              <Text style={styles.profileRole}>Administrator</Text>
            </View>
          </View>

          {/* Account instellingen */}
          <SettingGroup title="Account">
            <SettingItem
              icon="user"
              title="Profielinstellingen"
              description="Beheer je persoonlijke informatie"
              onPress={handleAccountSettings}
            />
            <SettingItem
              icon="globe"
              title="Taal"
              description="Selecteer de taal van de applicatie"
              onPress={handleLanguageSettings}
              rightElement={<Text style={styles.settingValue}>Nederlands</Text>}
            />
            <SettingItem
              icon="lock"
              title="Beveiliging"
              description="Wachtwoord en authenticatie instellingen"
              onPress={handleSecuritySettings}
            />
          </SettingGroup>

          {/* Applicatie instellingen */}
          <SettingGroup title="Applicatie">
            <SettingItem
              icon="moon"
              title="Donkere modus"
              description="Schakel donkere modus in"
              rightElement={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                  thumbColor={darkMode ? '#1e40af' : '#f3f4f6'}
                />
              }
            />
            <SettingItem
              icon="bell"
              title="Notificaties"
              description="Beheer notificatie-instellingen"
              rightElement={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                  thumbColor={notifications ? '#1e40af' : '#f3f4f6'}
                />
              }
            />
          </SettingGroup>

          {/* Data en synchronisatie */}
          <SettingGroup title="Data en synchronisatie">
            <SettingItem
              icon="database"
              title="Data back-up"
              description="Beheer je data back-ups"
              onPress={handleDataBackup}
            />
            <SettingItem
              icon="refresh"
              title="Automatisch synchroniseren"
              description="Synchroniseer data automatisch"
              rightElement={
                <Switch
                  value={autoSync}
                  onValueChange={setAutoSync}
                  trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                  thumbColor={autoSync ? '#1e40af' : '#f3f4f6'}
                />
              }
            />
            <SettingItem
              icon="wifi-off"
              title="Offline modus"
              description="Werk offline en synchroniseer later"
              rightElement={
                <Switch
                  value={offlineMode}
                  onValueChange={setOfflineMode}
                  trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                  thumbColor={offlineMode ? '#1e40af' : '#f3f4f6'}
                />
              }
            />
            <SettingItem
              icon="settings"
              title="Synchronisatie instellingen"
              description="Geavanceerde synchronisatie opties"
              onPress={handleSyncSettings}
            />
          </SettingGroup>

          {/* Ondersteuning en info */}
          <SettingGroup title="Ondersteuning en info">
            <SettingItem
              icon="help-circle"
              title="Help centrum"
              description="Krijg hulp en ondersteuning"
              onPress={handleHelpCenter}
            />
            <SettingItem
              icon="info"
              title="Over myMadrassa"
              description="Versie informatie en credits"
              onPress={handleAbout}
              rightElement={<Text style={styles.settingValue}>v0.1.0</Text>}
            />
          </SettingGroup>

          {/* Uitloggen knop */}
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Icon name="log-out" />
            <Text style={styles.logoutButtonText}>Uitloggen</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  profileRole: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
    marginTop: 4,
  },
  settingGroup: {
    marginBottom: 24,
  },
  settingGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    paddingLeft: 4,
  },
  settingGroupContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#ebf5ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  settingRight: {
    marginLeft: 8,
  },
  settingValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  logoutButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;