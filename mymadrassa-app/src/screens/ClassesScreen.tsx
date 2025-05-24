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
  Classes: undefined;
  ClassDetail: { classId: string };
};

type ClassesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Classes'>;

type Props = {
  navigation: ClassesScreenNavigationProp;
};

// Type definitie voor klassen
type Class = {
  id: string;
  classId: string;
  name: string;
  gradeLevel: string;
  academicYear: string;
  studentsCount: number;
  teacherName: string;
  schedule: string;
  room: string;
  status: 'active' | 'inactive' | 'planned';
};

// Dummy data voor klassen
const dummyClasses: Class[] = [
  {
    id: '1',
    classId: 'CLS001',
    name: 'Arabische Taal - Beginner',
    gradeLevel: 'Niveau 1',
    academicYear: '2024-2025',
    studentsCount: 18,
    teacherName: 'Mohammed Al Farsi',
    schedule: 'Zaterdag 10:00 - 12:00',
    room: 'Lokaal A1',
    status: 'active'
  },
  {
    id: '2',
    classId: 'CLS002',
    name: 'Koranrecitatie - Gevorderd',
    gradeLevel: 'Niveau 3',
    academicYear: '2024-2025',
    studentsCount: 12,
    teacherName: 'Ahmed Bouali',
    schedule: 'Zondag 13:00 - 15:00',
    room: 'Lokaal B2',
    status: 'active'
  },
  {
    id: '3',
    classId: 'CLS003',
    name: 'Islamitische Geschiedenis',
    gradeLevel: 'Niveau 2',
    academicYear: '2024-2025',
    studentsCount: 15,
    teacherName: 'Nadia Benali',
    schedule: 'Woensdag 16:00 - 18:00',
    room: 'Lokaal C3',
    status: 'inactive'
  },
  {
    id: '4',
    classId: 'CLS004',
    name: 'Islamitische Filosofie',
    gradeLevel: 'Niveau 4',
    academicYear: '2024-2025',
    studentsCount: 8,
    teacherName: 'Youssef El Mansouri',
    schedule: 'Maandag 18:00 - 20:00',
    room: 'Lokaal A2',
    status: 'planned'
  },
  {
    id: '5',
    classId: 'CLS005',
    name: 'Arabische Grammatica',
    gradeLevel: 'Niveau 2',
    academicYear: '2024-2025',
    studentsCount: 20,
    teacherName: 'Fatima El Amrani',
    schedule: 'Zaterdag 14:00 - 16:00',
    room: 'Lokaal B1',
    status: 'active'
  }
];

const ClassesScreen: React.FC<Props> = ({ navigation }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'planned'>('all');

  // Laden van klassen
  useEffect(() => {
    // Simuleren van API-call
    const fetchClasses = async () => {
      try {
        // In een echte app zou dit een API-call zijn
        await new Promise(resolve => setTimeout(resolve, 1000));
        setClasses(dummyClasses);
        setFilteredClasses(dummyClasses);
      } catch (error) {
        console.error('Error fetching classes:', error);
        Alert.alert('Fout', 'Er is een fout opgetreden bij het ophalen van klasgegevens.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Filteren van klassen op basis van zoekopdracht en statusfilter
  useEffect(() => {
    let result = classes;
    
    // Filter op status
    if (filterStatus !== 'all') {
      result = result.filter(classItem => classItem.status === filterStatus);
    }
    
    // Filter op zoektekst
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(
        classItem => 
          classItem.name.toLowerCase().includes(searchLower) ||
          classItem.classId.toLowerCase().includes(searchLower) ||
          classItem.teacherName.toLowerCase().includes(searchLower) ||
          classItem.room.toLowerCase().includes(searchLower) ||
          classItem.gradeLevel.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredClasses(result);
  }, [searchText, filterStatus, classes]);

  const handleAddClass = () => {
    // In een echte app zou dit navigeren naar een formulier
    Alert.alert('Nieuwe klas', 'Deze functionaliteit wordt binnenkort toegevoegd.');
  };

  const handleViewClass = (classItem: Class) => {
    // In een echte app zou dit navigeren naar het detailscherm
    Alert.alert(
      `${classItem.name}`,
      `Klas ID: ${classItem.classId}\nDocent: ${classItem.teacherName}\nLokaal: ${classItem.room}\nRooster: ${classItem.schedule}\nAantal studenten: ${classItem.studentsCount}`
    );
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actief';
      case 'inactive':
        return 'Inactief';
      case 'planned':
        return 'Gepland';
      default:
        return 'Onbekend';
    }
  };

  const renderClassItem = ({ item }: { item: Class }) => (
    <TouchableOpacity 
      style={styles.classItem}
      onPress={() => handleViewClass(item)}
    >
      <View style={styles.classInfo}>
        <Text style={styles.className}>{item.name}</Text>
        <Text style={styles.classId}>ID: {item.classId} | {item.gradeLevel}</Text>
        <Text style={styles.classTeacher}>Docent: {item.teacherName}</Text>
        <Text style={styles.classSchedule}>{item.schedule} | {item.room}</Text>
      </View>
      <View style={styles.classMeta}>
        <View style={[
          styles.statusIndicator, 
          item.status === 'active' ? styles.activeStatus : 
          item.status === 'inactive' ? styles.inactiveStatus : 
          styles.plannedStatus
        ]} />
        <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        <View style={styles.studentCountContainer}>
          <Text style={styles.studentCount}>{item.studentsCount}</Text>
          <Text style={styles.studentCountLabel}>studenten</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Klassen laden...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Klassenbeheer</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddClass}>
          <Text style={styles.addButtonText}>+ Nieuwe klas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Zoek op naam, ID, docent of lokaal"
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
          style={[styles.filterButton, filterStatus === 'planned' && styles.activeFilterButton]}
          onPress={() => setFilterStatus('planned')}
        >
          <Text style={[styles.filterButtonText, filterStatus === 'planned' && styles.activeFilterText]}>
            Gepland
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

      {filteredClasses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Geen klassen gevonden</Text>
          <Text style={styles.emptySubText}>Pas uw zoekcriteria aan of voeg nieuwe klassen toe</Text>
        </View>
      ) : (
        <FlatList
          data={filteredClasses}
          renderItem={renderClassItem}
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
          onPress={() => {}}
        >
          <Text style={styles.navButtonText}>Studenten</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => {}}
        >
          <Text style={styles.navButtonText}>Docenten</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navButton, styles.activeNavButton]} 
          onPress={() => {}}
        >
          <Text style={[styles.navButtonText, styles.activeNavButtonText]}>Klassen</Text>
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
  classItem: {
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
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 4,
  },
  classId: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 2,
  },
  classTeacher: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 2,
  },
  classSchedule: {
    fontSize: 13,
    color: '#718096',
    fontStyle: 'italic',
  },
  classMeta: {
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
  plannedStatus: {
    backgroundColor: '#ecc94b',
  },
  statusText: {
    fontSize: 12,
    color: '#4a5568',
    marginBottom: 4,
  },
  studentCountContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  studentCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  studentCountLabel: {
    fontSize: 11,
    color: '#718096',
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

export default ClassesScreen;