import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  // Op Electron detecteren en platform-specifieke logica uitvoeren
  React.useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.electron) {
      console.log('Electron-omgeving gedetecteerd');
      // Electron-specifieke instellingen hier
    }
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}