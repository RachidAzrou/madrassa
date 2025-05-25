import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Electron API type definitie voor TypeScript
declare global {
  interface Window {
    electronAPI?: any;
  }
}

// Detecteer of we in een Electron/web-omgeving zijn
const isElectron = () => {
  return Platform.OS === 'web' && 
    typeof window !== 'undefined' && 
    typeof window.electronAPI !== 'undefined';
};

export default function App() {
  // Basic error handling
  const [isError, setIsError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    // Voeg basic error handling toe
    try {
      console.log('App starting...');
      console.log('Platform:', Platform.OS);
      console.log('Is Electron:', isElectron());
    } catch (error) {
      console.error('Error in app initialization:', error);
      setIsError(true);
      setErrorMessage(error.message);
    }
  }, []);

  // Toon een eenvoudige fallback bij fouten
  if (isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Er is een fout opgetreden</Text>
        <Text style={styles.error}>{errorMessage}</Text>
      </View>
    );
  }

  // Toon een eenvoudige test UI als het niet lukt om de navigatie te laden
  try {
    return (
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator isElectron={isElectron()} />
        </NavigationContainer>
      </SafeAreaProvider>
    );
  } catch (error) {
    console.error('Error rendering navigation:', error);
    return (
      <View style={styles.container}>
        <Text style={styles.title}>MyMadrassa App</Text>
        <Text style={styles.subtitle}>Welkom bij de desktop versie</Text>
        <Text style={styles.info}>Er was een probleem bij het laden van de navigatie.</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1e3a8a',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 24,
    color: '#333',
  },
  info: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginBottom: 20,
  },
  error: {
    color: 'red',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ffeeee',
    borderRadius: 5,
  }
});