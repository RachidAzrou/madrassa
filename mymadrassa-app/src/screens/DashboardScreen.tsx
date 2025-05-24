import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppContext } from '../store/AppContext';

// Type definitie voor navigatieparameters
type RootStackParamList = {
  Dashboard: undefined;
  Students: undefined;
  Teachers: undefined;
  Classes: undefined;
  Settings: undefined;
  Login: undefined;
};

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

type Props = {
  navigation: DashboardScreenNavigationProp;
};

// Type definitie voor event en notificatie
type Event = {
  id: number;
  title: string;
  date: string;
  type: 'exam' | 'meeting' | 'holiday';
};

type Notification = {
  id: number;
  title: string;
  time: string;
  read: boolean;
};

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  // Haal context data en functies op
  const { auth, students, teachers, classes, isLoading: contextLoading, fetchStudents, fetchTeachers, fetchClasses } = useAppContext();
  
  // Lokale state voor aanvullende data
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  
  // Controleer authenticatie
  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }]
      });
    }
  }, [auth.isAuthenticated, navigation]);
  
  // Laad data wanneer component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Haal data op via context
        await Promise.all([
          fetchStudents(),
          fetchTeachers(),
          fetchClasses()
        ]);
        
        // Laad aanvullende data (in een echte app zou dit via API gaan)
        // Voor nu gebruiken we hardcoded data
        setUpcomingEvents([
          { id: 1, title: 'Eindexamens', date: '15-06-2025', type: 'exam' },
          { id: 2, title: 'Ouderavond', date: '22-06-2025', type: 'meeting' },
          { id: 3, title: 'Zomervakantie', date: '01-07-2025', type: 'holiday' }
        ]);
        
        setRecentNotifications([
          { id: 1, title: 'Nieuw lesprogramma geüpload', time: '2 uur geleden', read: false },
          { id: 2, title: 'Vergadering verplaatst naar vrijdag', time: '4 uur geleden', read: true },
          { id: 3, title: 'Nieuwe leerling ingeschreven', time: '1 dag geleden', read: true }
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        Alert.alert('Fout', 'Er is een fout opgetreden bij het laden van de dashboard gegevens.');
      } finally {
        setIsLoading(false);
      }
    };

    if (auth.isAuthenticated) {
      loadData();
    }
  }, [auth.isAuthenticated, fetchStudents, fetchTeachers, fetchClasses]);

  if (isLoading || contextLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Dashboard laden...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Welkom bij MyMadrassa</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        </View>

        <View style={styles.statsContainer}>
          {/* Studenten kaart */}
          <TouchableOpacity 
            style={[styles.card, styles.studentCard]} 
            onPress={() => navigation.navigate('Students')}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Studenten</Text>
              <Text style={styles.cardNumber}>{students.filter(s => s.status === 'active').length}</Text>
              <Text style={styles.cardDescription}>van {students.length} ingeschreven</Text>
            </View>
          </TouchableOpacity>

          {/* Docenten kaart */}
          <TouchableOpacity 
            style={[styles.card, styles.teacherCard]} 
            onPress={() => navigation.navigate('Teachers')}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Docenten</Text>
              <Text style={styles.cardNumber}>{teachers.filter(t => t.status === 'active').length}</Text>
              <Text style={styles.cardDescription}>van {teachers.length} ingeschreven</Text>
            </View>
          </TouchableOpacity>

          {/* Klassen kaart */}
          <TouchableOpacity 
            style={[styles.card, styles.classCard]} 
            onPress={() => navigation.navigate('Classes')}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Klassen</Text>
              <Text style={styles.cardNumber}>{classes.filter(c => c.status === 'active').length}</Text>
              <Text style={styles.cardDescription}>van {classes.length} aangemaakt</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Aankomende Evenementen</Text>
          {upcomingEvents.map(event => (
            <View key={event.id} style={styles.eventItem}>
              <View style={[styles.eventIndicator, styles[`${event.type}Indicator`]]} />
              <View style={styles.eventDetails}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDate}>{event.date}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recente Notificaties</Text>
          {recentNotifications.map(notification => (
            <View key={notification.id} style={styles.notificationItem}>
              {!notification.read && <View style={styles.unreadDot} />}
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Navigatiebalk onderaan */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navButton, styles.activeNavButton]} 
          onPress={() => {}}
        >
          <Text style={[styles.navButtonText, styles.activeNavButtonText]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigation.navigate('Students')}
        >
          <Text style={styles.navButtonText}>Studenten</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigation.navigate('Teachers')}
        >
          <Text style={styles.navButtonText}>Docenten</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.navButtonText}>Instellingen</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Dynamische stijlen afhankelijk van platformgrootte
const { width } = Dimensions.get('window');
const isTablet = width > 768;

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80, // Extra padding voor bottom nav
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  subtitle: {
    fontSize: 16,
    color: '#4a5568',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#718096',
  },
  statsContainer: {
    flexDirection: isTablet ? 'row' : 'column',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    width: isTablet ? '31%' : '100%',
  },
  studentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4299e1',
  },
  teacherCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#48bb78',
  },
  classCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ed8936',
  },
  cardContent: {
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 8,
  },
  cardNumber: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#718096',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 16,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  eventIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  examIndicator: {
    backgroundColor: '#e53e3e',
  },
  meetingIndicator: {
    backgroundColor: '#4299e1',
  },
  holidayIndicator: {
    backgroundColor: '#48bb78',
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a202c',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#718096',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4299e1',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a202c',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 14,
    color: '#718096',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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

export default DashboardScreen;