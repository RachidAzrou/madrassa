import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';

// Schermen importeren
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import StudentsScreen from '../screens/StudentsScreen';
import TeachersScreen from '../screens/TeachersScreen';
import ClassesScreen from '../screens/ClassesScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  // Platform-specifieke stijlen toepassen
  const headerStyle = Platform.OS === 'web' ? {
    backgroundColor: '#1e3a8a',
    height: 64,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  } : {
    backgroundColor: '#1e3a8a',
    height: 100,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  };

  const headerTitleStyle = {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  };

  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle,
        headerTitleStyle,
        headerTintColor: '#FFFFFF',
        cardStyle: { backgroundColor: '#F5F7FB' },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Stack.Screen 
        name="Students" 
        component={StudentsScreen}
        options={{ title: 'Studenten' }}
      />
      <Stack.Screen 
        name="Teachers" 
        component={TeachersScreen}
        options={{ title: 'Docenten' }}
      />
      <Stack.Screen 
        name="Classes" 
        component={ClassesScreen}
        options={{ title: 'Klassen' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Instellingen' }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;