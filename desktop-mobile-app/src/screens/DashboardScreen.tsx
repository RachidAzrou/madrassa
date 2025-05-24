import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

// Icons importeren - in een echte app zouden we SVG of iconfonts gebruiken
// Deze dummycomponent wordt later vervangen met echte iconen
const Icon = ({ name }: { name: string }) => (
  <View style={{ width: 24, height: 24, backgroundColor: '#1e40af', borderRadius: 4 }} />
);

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

interface DashboardScreenProps {
  navigation: DashboardScreenNavigationProp;
}

// Statistiek kaart component
interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onPress }) => (
  <TouchableOpacity 
    style={[styles.statCard, { borderLeftColor: color }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.statCardContent}>
      <View>
        <Text style={styles.statCardTitle}>{title}</Text>
        <Text style={styles.statCardValue}>{value}</Text>
      </View>
      <View style={[styles.statCardIcon, { backgroundColor: color + '20' }]}>
        <Icon name={icon} />
      </View>
    </View>
  </TouchableOpacity>
);

// Menu item component
interface MenuItemProps {
  title: string;
  icon: string;
  onPress: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ title, icon, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.menuItemIcon}>
      <Icon name={icon} />
    </View>
    <Text style={styles.menuItemTitle}>{title}</Text>
  </TouchableOpacity>
);

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;
  
  // Dummy statistieken - in een echte app zouden deze van de backend komen
  const stats = [
    { id: 1, title: 'Studenten', value: '243', icon: 'users', color: '#3b82f6' },
    { id: 2, title: 'Docenten', value: '18', icon: 'teacher', color: '#10b981' },
    { id: 3, title: 'Klassen', value: '12', icon: 'classroom', color: '#f59e0b' },
    { id: 4, title: 'Actieve Cursussen', value: '24', icon: 'book', color: '#8b5cf6' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welkom bij myMadrassa</Text>
        </View>

        {/* Statistieken */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Overzicht</Text>
          <View style={[styles.statsGrid, isWideScreen && styles.wideStatsGrid]}>
            {stats.map((stat) => (
              <StatCard
                key={stat.id}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                onPress={() => {
                  // Navigeer naar de juiste pagina op basis van de statistiek
                  if (stat.title === 'Studenten') navigation.navigate('Students');
                  else if (stat.title === 'Docenten') navigation.navigate('Teachers');
                  else if (stat.title === 'Klassen') navigation.navigate('Classes');
                }}
              />
            ))}
          </View>
        </View>

        {/* Snelle Navigatie */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Snelle Navigatie</Text>
          <View style={[styles.menuGrid, isWideScreen && styles.wideMenuGrid]}>
            <MenuItem 
              title="Studenten" 
              icon="users" 
              onPress={() => navigation.navigate('Students')} 
            />
            <MenuItem 
              title="Docenten" 
              icon="teacher" 
              onPress={() => navigation.navigate('Teachers')} 
            />
            <MenuItem 
              title="Klassen" 
              icon="classroom" 
              onPress={() => navigation.navigate('Classes')} 
            />
            <MenuItem 
              title="Aanmeldingen" 
              icon="enrollment" 
              onPress={() => {}} 
            />
            <MenuItem 
              title="Curriculum" 
              icon="books" 
              onPress={() => {}} 
            />
            <MenuItem 
              title="Rapport" 
              icon="report" 
              onPress={() => {}} 
            />
            <MenuItem 
              title="Aanwezigheid" 
              icon="attendance" 
              onPress={() => {}} 
            />
            <MenuItem 
              title="Instellingen" 
              icon="settings" 
              onPress={() => navigation.navigate('Settings')} 
            />
          </View>
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
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  statsContainer: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  wideStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    flex: 1,
    minWidth: Platform.OS === 'web' ? 240 : undefined,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  statCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCardTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    marginBottom: 24,
  },
  menuGrid: {
    flexDirection: 'column',
  },
  wideMenuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  menuItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flex: Platform.OS === 'web' ? 0 : 1,
    minWidth: Platform.OS === 'web' ? 240 : undefined,
    maxWidth: Platform.OS === 'web' ? 300 : undefined,
    marginRight: 12,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#ebf5ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
});

export default DashboardScreen;