import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  useWindowDimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

// Dummy icon component - zou vervangen worden door echte iconen
const Icon = ({ name }: { name: string }) => (
  <View style={{ width: 20, height: 20, backgroundColor: '#1e40af', borderRadius: 4 }} />
);

type StudentsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Students'>;

interface StudentsScreenProps {
  navigation: StudentsScreenNavigationProp;
}

// Student type definitie
interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  programName?: string;
  className?: string;
  status: 'active' | 'inactive';
}

// Student lijst item component
interface StudentItemProps {
  student: Student;
  onView: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  isWideScreen: boolean;
}

const StudentItem: React.FC<StudentItemProps> = ({ 
  student, 
  onView, 
  onEdit, 
  onDelete, 
  isWideScreen 
}) => {
  return (
    <View style={styles.studentItem}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>
          {student.firstName} {student.lastName}
        </Text>
        <Text style={styles.studentId}>{student.studentId}</Text>
        
        {isWideScreen && (
          <>
            <Text style={styles.studentDetail}>{student.email}</Text>
            <Text style={styles.studentDetail}>{student.phone}</Text>
            {student.programName && (
              <Text style={styles.studentDetail}>{student.programName}</Text>
            )}
            {student.className && (
              <Text style={styles.studentDetail}>{student.className}</Text>
            )}
          </>
        )}
        
        <View style={styles.statusBadge}>
          <Text style={[
            styles.statusText, 
            { color: student.status === 'active' ? '#059669' : '#dc2626' }
          ]}>
            {student.status === 'active' ? 'Actief' : 'Inactief'}
          </Text>
        </View>
      </View>
      
      <View style={styles.studentActions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => onView(student)}
        >
          <Icon name="eye" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => onEdit(student)}
        >
          <Icon name="edit" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={() => onDelete(student)}
        >
          <Icon name="trash" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const StudentsScreen: React.FC<StudentsScreenProps> = ({ navigation }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;

  // Dummy data laden - in een echte app zou dit van de backend komen
  useEffect(() => {
    // Simuleer een API call
    setTimeout(() => {
      const dummyData: Student[] = [
        {
          id: '1',
          studentId: 'STD001',
          firstName: 'Zaina',
          lastName: 'El Mouden',
          email: 'zaina@example.com',
          phone: '0612345678',
          programName: 'Islamitische Studies',
          className: 'Klas 3A',
          status: 'active'
        },
        {
          id: '2',
          studentId: 'STD002',
          firstName: 'Yousef',
          lastName: 'Amrani',
          email: 'yousef@example.com',
          phone: '0623456789',
          programName: 'Arabische Taal',
          className: 'Klas 2B',
          status: 'active'
        },
        {
          id: '3',
          studentId: 'STD003',
          firstName: 'Aisha',
          lastName: 'Bouali',
          email: 'aisha@example.com',
          phone: '0634567890',
          programName: 'Islamitische Studies',
          className: 'Klas 3A',
          status: 'inactive'
        },
        {
          id: '4',
          studentId: 'STD004',
          firstName: 'Mohammed',
          lastName: 'El Haddioui',
          email: 'mohammed@example.com',
          phone: '0645678901',
          programName: 'Hafiz Programma',
          className: 'Klas 1C',
          status: 'active'
        },
        {
          id: '5',
          studentId: 'STD005',
          firstName: 'Fatima',
          lastName: 'Moussaoui',
          email: 'fatima@example.com',
          phone: '0656789012',
          programName: 'Arabische Taal',
          className: 'Klas 2B',
          status: 'active'
        }
      ];
      
      setStudents(dummyData);
      setFilteredStudents(dummyData);
      setLoading(false);
    }, 1000);
  }, []);

  // Zoekfunctionaliteit
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = students.filter(
        student => 
          student.firstName.toLowerCase().includes(query) ||
          student.lastName.toLowerCase().includes(query) ||
          student.studentId.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query) ||
          (student.className && student.className.toLowerCase().includes(query)) ||
          (student.programName && student.programName.toLowerCase().includes(query))
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  const handleViewStudent = (student: Student) => {
    // In een echte app zou dit naar een detailpagina navigeren
    console.log('View student:', student);
  };

  const handleEditStudent = (student: Student) => {
    // In een echte app zou dit naar een bewerkingspagina navigeren
    console.log('Edit student:', student);
  };

  const handleDeleteStudent = (student: Student) => {
    // In een echte app zou dit een bevestigingsdialoog tonen
    console.log('Delete student:', student);
  };

  const handleAddStudent = () => {
    // In een echte app zou dit naar een toevoegingspagina navigeren
    console.log('Add new student');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={styles.loadingText}>Studenten laden...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Studenten</Text>
        <Text style={styles.headerSubtitle}>Beheer alle studenten</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" />
          <TextInput
            style={styles.searchInput}
            placeholder="Zoek op naam, ID, klas..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="x" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddStudent}
        >
          <Icon name="plus" />
          <Text style={styles.addButtonText}>Nieuwe Student</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {filteredStudents.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="user-x" />
            <Text style={styles.emptyStateTitle}>Geen studenten gevonden</Text>
            <Text style={styles.emptyStateText}>
              Er zijn geen studenten die overeenkomen met je zoekopdracht.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <StudentItem
                student={item}
                onView={handleViewStudent}
                onEdit={handleEditStudent}
                onDelete={handleDeleteStudent}
                isWideScreen={isWideScreen}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#1e40af',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  studentItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  studentId: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  studentDetail: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#f3f4f6',
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  studentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    maxWidth: 300,
  },
});

export default StudentsScreen;