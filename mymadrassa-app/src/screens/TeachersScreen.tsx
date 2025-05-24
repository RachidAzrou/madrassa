import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';

// Type definitie voor navigatieparameters
type RootStackParamList = {
  Dashboard: undefined;
  Teachers: undefined;
  TeacherDetail: { teacherId: string };
};

type TeachersScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Teachers'>;

type Props = {
  navigation: TeachersScreenNavigationProp;
};

// Type definitie voor docenten
type Teacher = {
  id: string;
  teacherId: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  email: string;
  phoneNumber: string;
  specialization: string;
  joiningDate: string;
  status: 'active' | 'inactive' | 'on_leave';
  assignedCourses: number;
};

// Dummy data voor docenten
const dummyTeachers: Teacher[] = [
  {
    id: '1',
    teacherId: 'TCH001',
    firstName: 'Mohammed',
    lastName: 'Al Farsi',
    gender: 'M',
    email: 'mohammed.alfarsi@mymadrassa.nl',
    phoneNumber: '0612345678',
    specialization: 'Arabische taal',
    joiningDate: '2020-08-15',
    status: 'active',
    assignedCourses: 3
  },
  {
    id: '2',
    teacherId: 'TCH002',
    firstName: 'Fatima',
    lastName: 'El Amrani',
    gender: 'F',
    email: 'fatima.elamrani@mymadrassa.nl',
    phoneNumber: '0623456789',
    specialization: 'Islamitische studies',
    joiningDate: '2019-09-01',
    status: 'active',
    assignedCourses: 4
  },
  {
    id: '3',
    teacherId: 'TCH003',
    firstName: 'Ahmed',
    lastName: 'Bouali',
    gender: 'M',
    email: 'ahmed.bouali@mymadrassa.nl',
    phoneNumber: '0634567890',
    specialization: 'Koran recitatie',
    joiningDate: '2018-01-10',
    status: 'on_leave',
    assignedCourses: 2
  },
  {
    id: '4',
    teacherId: 'TCH004',
    firstName: 'Nadia',
    lastName: 'Benali',
    gender: 'F',
    email: 'nadia.benali@mymadrassa.nl',
    phoneNumber: '0645678901',
    specialization: 'Geschiedenis',
    joiningDate: '2021-03-15',
    status: 'active',
    assignedCourses: 3
  },
  {
    id: '5',
    teacherId: 'TCH005',
    firstName: 'Youssef',
    lastName: 'El Mansouri',
    gender: 'M',
    email: 'youssef.elmansouri@mymadrassa.nl',
    phoneNumber: '0656789012',
    specialization: 'Islamitische filosofie',
    joiningDate: '2017-09-01',
    status: 'inactive',
    assignedCourses: 0
  }
];

const TeachersScreen: React.FC<Props> = ({ navigation }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'on_leave'>('all');

  // Laden van docenten
  useEffect(() => {
    // Simuleren van API-call
    const fetchTeachers = async () => {
      try {
        // In een echte app zou dit een API-call zijn
        await new Promise(resolve => setTimeout(resolve, 1000));
        setTeachers(dummyTeachers);
        setFilteredTeachers(dummyTeachers);
      } catch (error) {
        console.error('Error fetching teachers:', error);
        Alert.alert('Fout', 'Er is een fout opgetreden bij het ophalen van docentgegevens.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  // Filteren van docenten op basis van zoekopdracht en statusfilter
  useEffect(() => {
    let result = teachers;
    
    // Filter op status
    if (filterStatus !== 'all') {
      result = result.filter(teacher => teacher.status === filterStatus);
    }
    
    // Filter op zoektekst
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(
        teacher => 
          teacher.firstName.toLowerCase().includes(searchLower) ||
          teacher.lastName.toLowerCase().includes(searchLower) ||
          teacher.teacherId.toLowerCase().includes(searchLower) ||
          teacher.email.toLowerCase().includes(searchLower) ||
          teacher.specialization.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredTeachers(result);
  }, [searchText, filterStatus, teachers]);

  const handleAddTeacher = () => {
    // In een echte app zou dit navigeren naar een formulier
    Alert.alert('Nieuwe docent', 'Deze functionaliteit wordt binnenkort toegevoegd.');
  };

  const handleViewTeacher = (teacher: Teacher) => {
    // In een echte app zou dit navigeren naar het detailscherm
    Alert.alert(
      `${teacher.firstName} ${teacher.lastName}`,
      `DocentID: ${teacher.teacherId}\nEmail: ${teacher.email}\nSpecialisatie: ${teacher.specialization}\nStatus: ${
        teacher.status === 'active' ? 'Actief' : 
        teacher.status === 'inactive' ? 'Inactief' : 
        'Met verlof'
      }`
    );
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actief';
      case 'inactive':
        return 'Inactief';
      case 'on_leave':
        return 'Met verlof';
      default:
        return 'Onbekend';
    }
  };

  const renderTeacherItem = ({ item }: { item: Teacher }) => (
    <TouchableOpacity 
      style={styles.teacherItem}
      onPress={() => handleViewTeacher(item)}
    >
      <View style={styles.teacherInfo}>
        <Text style={styles.teacherName}>{item.firstName} {item.lastName}</Text>
        <Text style={styles.teacherId}>ID: {item.teacherId}</Text>
        <Text style={styles.teacherSpecialization}>{item.specialization}</Text>
      </View>
      <View style={styles.teacherMeta}>
        <View style={[
          styles.statusIndicator, 
          item.status === 'active' ? styles.activeStatus : 
          item.status === 'inactive' ? styles.inactiveStatus : 
          styles.onLeaveStatus
        ]} />
        <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        <Text style={styles.courseCount}>{item.assignedCourses} cursussen</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Docenten laden...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Docentenbeheer</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddTeacher}>
          <Text style={styles.addButtonText}>+ Nieuwe docent</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Zoek op naam, ID, of specialisatie"
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, filterStatus === 'all' && styles.activeFilterButton]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterButtonText, filterStatus === 'all' && styles.activeFilterText]}>
            Alle
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, filterStatus === 'active' && styles.activeFilterButton]}
          onPress={() => setFilterStatus('active')}
        >
          <Text style={[styles.filterButtonText, filterStatus === 'active' && styles.activeFilterText]}>
            Actief
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, filterStatus === 'on_leave' && styles.activeFilterButton]}
          onPress={() => setFilterStatus('on_leave')}
        >
          <Text style={[styles.filterButtonText, filterStatus === 'on_leave' && styles.activeFilterText]}>
            Verlof
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, filterStatus === 'inactive' && styles.activeFilterButton]}
          onPress={() => setFilterStatus('inactive')}
        >
          <Text style={[styles.filterButtonText, filterStatus === 'inactive' && styles.activeFilterText]}>
            Inactief
          </Text>
        </TouchableOpacity>
      </View>

      {filteredTeachers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Geen docenten gevonden</Text>
          <Text style={styles.emptySubText}>Pas uw zoekcriteria aan of voeg nieuwe docenten toe</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTeachers}
          renderItem={renderTeacherItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

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
          onPress={() => navigation.navigate('Teachers')}
        >
          <Text style={styles.navButtonText}>Studenten</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navButton, styles.activeNavButton]} 
          onPress={() => {}}
        >
          <Text style={[styles.navButtonText, styles.activeNavButtonText]}>Docenten</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => {}}
        >
          <Text style={styles.navButtonText}>Instellingen</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    height: 40,
    backgroundColor: '#F5F7FB',
    borderRadius: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F5F7FB',
  },
  activeFilterButton: {
    backgroundColor: '#1e3a8a',
  },
  filterButtonText: {
    color: '#4a5568',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Extra padding voor bottom nav
  },
  teacherItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 4,
  },
  teacherId: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 2,
  },
  teacherSpecialization: {
    fontSize: 14,
    color: '#4a5568',
    fontStyle: 'italic',
  },
  teacherMeta: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  activeStatus: {
    backgroundColor: '#48bb78',
  },
  inactiveStatus: {
    backgroundColor: '#e53e3e',
  },
  onLeaveStatus: {
    backgroundColor: '#ed8936',
  },
  statusText: {
    fontSize: 12,
    color: '#4a5568',
    marginBottom: 4,
  },
  courseCount: {
    fontSize: 12,
    color: '#4a5568',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
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

export default TeachersScreen;