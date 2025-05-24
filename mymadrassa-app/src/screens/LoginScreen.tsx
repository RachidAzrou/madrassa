import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppContext } from '../store/AppContext';

// Hier zou je later je logo importeren
// import Logo from '../assets/images/logo.png';

// Type definitie voor navigatieparameters
type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  
  // Haal de context op
  const { login, auth, error: contextError, clearError } = useAppContext();

  // Effect voor het doorsturen naar Dashboard bij succesvol inloggen
  useEffect(() => {
    if (auth.isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      });
    }
  }, [auth.isAuthenticated, navigation]);

  // Effect voor het afhandelen van context errors
  useEffect(() => {
    if (contextError) {
      setLocalError(contextError);
      clearError();
    }
  }, [contextError, clearError]);

  const handleLogin = async () => {
    // Valideren van invoervelden
    if (!username || !password) {
      setLocalError('Vul alstublieft alle velden in');
      return;
    }

    setLocalError('');
    
    // Gebruik de login functie van de context
    const success = await login(username, password);
    
    if (!success && !contextError) {
      setLocalError('Ongeldige gebruikersnaam of wachtwoord');
    }
  };

  // Detecteren of we in Electron draaien
  const isElectron = Platform.OS === 'web' && typeof window !== 'undefined' && window.electron;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.logoContainer}>
            {/* Hier zou je later je logo tonen */}
            <Text style={styles.logoText}>MyMadrassa</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Inloggen</Text>
            
            {localError ? <Text style={styles.errorText}>{localError}</Text> : null}
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Gebruikersnaam</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Voer uw gebruikersnaam in"
                autoCapitalize="none"
                testID="usernameInput"
                editable={!auth.isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Wachtwoord</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Voer uw wachtwoord in"
                secureTextEntry
                testID="passwordInput"
                editable={!auth.isLoading}
              />
            </View>

            <TouchableOpacity 
              style={styles.forgotPasswordContainer}
              onPress={() => Alert.alert('Wachtwoord vergeten', 'Neem contact op met de beheerder om uw wachtwoord te resetten.')}
              disabled={auth.isLoading}
            >
              <Text style={styles.forgotPasswordText}>Wachtwoord vergeten?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
              disabled={auth.isLoading}
              testID="loginButton"
            >
              {auth.isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.loginButtonText}>Inloggen</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>© {new Date().getFullYear()} MyMadrassa - Alle rechten voorbehouden</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorText: {
    color: '#e53e3e',
    marginBottom: 10,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1A202C',
    backgroundColor: '#FFFFFF',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: '#4299e1',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#1e3a8a',
    borderRadius: 6,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#718096',
    fontSize: 12,
  },
});

export default LoginScreen;