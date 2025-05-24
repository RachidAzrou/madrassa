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

// Type definitie voor de navigatie parameters
export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Students: undefined;
  Teachers: undefined;
  Classes: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  isElectron: boolean;
}

const AppNavigator: React.FC<AppNavigatorProps> = ({ isElectron }) => {
  // Bepaal de juiste header styling op basis van platform
  const getHeaderStyle = () => {
    // Desktop styling voor Electron
    if (isElectron) {
      return {
        headerStyle: {
          backgroundColor: '#1e3a8a',
          height: 64,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      };
    }
    
    // Mobile styling
    return {
      headerStyle: {
        backgroundColor: '#1e3a8a',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    };
  };

  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={getHeaderStyle()}
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