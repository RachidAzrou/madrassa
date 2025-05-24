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
  Students: undefined;
  StudentDetail: { studentId: string };
};

type StudentsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Students'>;

type Props = {
  navigation: StudentsScreenNavigationProp;
};

// Type definitie voor studenten
type Student = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'pending';
  grade: string;
  guardianName: string;
};

// Dummy data voor studenten
const dummyStudents: Student[] = [
  {
    id: '1',
    studentId: 'STD001',
    firstName: 'Ahmed',
    lastName: 'El Mansouri',
    gender: 'M',
    email: 'ahmed.elmansouri@example.com',
    phoneNumber: '0612345678',
    dateOfBirth: '2010-05-15',
    enrollmentDate: '2022-09-01',
    status: 'active',
    grade: '8',
    guardianName: 'Mohammed El Mansouri'
  },
  {
    id: '2',
    studentId: 'STD002',
    firstName: 'Fatima',
    lastName: 'Benali',
    gender: 'F',
    email: 'fatima.benali@example.com',
    phoneNumber: '0623456789',
    dateOfBirth: '2011-03-20',
    enrollmentDate: '2022-09-01',
    status: 'active',
    grade: '7',
    guardianName: 'Hassan Benali'
  },
  {
    id: '3',
    studentId: 'STD003',
    firstName: 'Yousef',
    lastName: 'El Amrani',
    gender: 'M',
    email: 'yousef.elamrani@example.com',
    phoneNumber: '0634567890',
    dateOfBirth: '2010-11-10',
    enrollmentDate: '2022-09-01',
    status: 'inactive',
    grade: '8',
    guardianName: 'Karim El Amrani'
  },
  {
    id: '4',
    studentId: 'STD004',
    firstName: 'Noor',
    lastName: 'Aziz',
    gender: 'F',
    email: 'noor.aziz@example.com',
    phoneNumber: '0645678901',
    dateOfBirth: '2012-01-25',
    enrollmentDate: '2022-09-01',
    status: 'active',
    grade: '6',
    guardianName: 'Yasmin Aziz'
  },
  {
    id: '5',
    studentId: 'STD005',
    firstName: 'Ibrahim',
    lastName: 'El Idrissi',
    gender: 'M',
    email: 'ibrahim.elidrissi@example.com',
    phoneNumber: '0656789012',
    dateOfBirth: '2009-07-30',
    enrollmentDate: '2022-09-01',
    status: 'active',
    grade: '9',
    guardianName: 'Ali El Idrissi'
  }
];

const StudentsScreen: React.FC<Props> = ({ navigation }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Laden van studenten
  useEffect(() => {
    // Simuleren van API-call
    const fetchStudents = async () => {
      try {
        // In een echte app zou dit een API-call zijn
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStudents(dummyStudents);
        setFilteredStudents(dummyStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
        Alert.alert('Fout', 'Er is een fout opgetreden bij het ophalen van studentengegevens.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Filteren van studenten op basis van zoekopdracht en statusfilter
  useEffect(() => {
    let result = students;
    
    // Filter op status
    if (filterStatus !== 'all') {
      result = result.filter(student => student.status === filterStatus);
    }
    
    // Filter op zoektekst
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(
        student => 
          student.firstName.toLowerCase().includes(searchLower) ||
          student.lastName.toLowerCase().includes(searchLower) ||
          student.studentId.toLowerCase().includes(searchLower) ||
          student.email.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredStudents(result);
  }, [searchText, filterStatus, students]);

  const handleAddStudent = () => {
    // In een echte app zou dit navigeren naar een formulier
    Alert.alert('Nieuwe student', 'Deze functionaliteit wordt binnenkort toegevoegd.');
  };

  const handleViewStudent = (student: Student) => {
    // In een echte app zou dit navigeren naar het detailscherm
    Alert.alert(
      `${student.firstName} ${student.lastName}`,
      `StudentID: ${student.studentId}\nEmail: ${student.email}\nStatus: ${student.status}\nKlas: ${student.grade}`
    );
  };

  const renderStudentItem = ({ item }: { item: Student }) => (
    <TouchableOpacity 
      style={styles.studentItem}
      onPress={() => handleViewStudent(item)}
    >
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.firstName} {item.lastName}</Text>
        <Text style={styles.studentId}>ID: {item.studentId}</Text>
        <Text style={styles.studentClass}>Klas: {item.grade}</Text>
      </View>
      <View style={styles.studentStatusContainer}>
        <View style={[
          styles.statusIndicator, 
          item.status === 'active' ? styles.activeStatus : 
          item.status === 'inactive' ? styles.inactiveStatus : 
          styles.pendingStatus
        ]} />
        <Text style={styles.statusText}>
          {item.status === 'active' ? 'Actief' : 
           item.status === 'inactive' ? 'Inactief' : 
           'In afwachting'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Studenten laden...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Studentenbeheer</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddStudent}>
          <Text style={styles.addButtonText}>+ Nieuwe student</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Zoek op naam, ID of email"
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
          style={[styles.filterButton, filterStatus === 'inactive' && styles.activeFilterButton]}
          onPress={() => setFilterStatus('inactive')}
        >
          <Text style={[styles.filterButtonText, filterStatus === 'inactive' && styles.activeFilterText]}>
            Inactief
          </Text>
        </TouchableOpacity>
      </View>

      {filteredStudents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Geen studenten gevonden</Text>
          <Text style={styles.emptySubText}>Pas uw zoekcriteria aan of voeg nieuwe studenten toe</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          renderItem={renderStudentItem}
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
          style={[styles.navButton, styles.activeNavButton]} 
          onPress={() => {}}
        >
          <Text style={[styles.navButtonText, styles.activeNavButtonText]}>Studenten</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => {}}
        >
          <Text style={styles.navButtonText}>Docenten</Text>
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
  studentItem: {
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
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 4,
  },
  studentId: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 2,
  },
  studentClass: {
    fontSize: 14,
    color: '#4a5568',
  },
  studentStatusContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
  pendingStatus: {
    backgroundColor: '#ed8936',
  },
  statusText: {
    fontSize: 12,
    color: '#4a5568',
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

export default StudentsScreen;