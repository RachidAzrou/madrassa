import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Detecteer of we in een Electron/web-omgeving zijn
const isElectron = () => {
  return Platform.OS === 'web' && 
    typeof window !== 'undefined' && 
    window.electronAPI !== undefined;
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator isElectron={isElectron()} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}