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

type TeachersScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Teachers'>;

interface TeachersScreenProps {
  navigation: TeachersScreenNavigationProp;
}

// Docent type definitie
interface Teacher {
  id: string;
  teacherId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization?: string;
  subjects?: string[];
  isActive: boolean;
}

// Docent lijst item component
interface TeacherItemProps {
  teacher: Teacher;
  onView: (teacher: Teacher) => void;
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
  isWideScreen: boolean;
}

const TeacherItem: React.FC<TeacherItemProps> = ({ 
  teacher, 
  onView, 
  onEdit, 
  onDelete, 
  isWideScreen 
}) => {
  return (
    <View style={styles.teacherItem}>
      <View style={styles.teacherInfo}>
        <Text style={styles.teacherName}>
          {teacher.firstName} {teacher.lastName}
        </Text>
        <Text style={styles.teacherId}>{teacher.teacherId}</Text>
        
        {isWideScreen && (
          <>
            <Text style={styles.teacherDetail}>{teacher.email}</Text>
            <Text style={styles.teacherDetail}>{teacher.phone}</Text>
            {teacher.specialization && (
              <Text style={styles.teacherDetail}>Specialisatie: {teacher.specialization}</Text>
            )}
            {teacher.subjects && teacher.subjects.length > 0 && (
              <Text style={styles.teacherDetail}>
                Vakken: {teacher.subjects.join(', ')}
              </Text>
            )}
          </>
        )}
        
        <View style={styles.statusBadge}>
          <Text style={[
            styles.statusText, 
            { color: teacher.isActive ? '#059669' : '#dc2626' }
          ]}>
            {teacher.isActive ? 'Actief' : 'Inactief'}
          </Text>
        </View>
      </View>
      
      <View style={styles.teacherActions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => onView(teacher)}
        >
          <Icon name="eye" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => onEdit(teacher)}
        >
          <Icon name="edit" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={() => onDelete(teacher)}
        >
          <Icon name="trash" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const TeachersScreen: React.FC<TeachersScreenProps> = ({ navigation }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;

  // Dummy data laden - in een echte app zou dit van de backend komen
  useEffect(() => {
    // Simuleer een API call
    setTimeout(() => {
      const dummyData: Teacher[] = [
        {
          id: '1',
          teacherId: 'TCH001',
          firstName: 'Ahmed',
          lastName: 'Ben Ali',
          email: 'ahmed@example.com',
          phone: '0612345678',
          specialization: 'Islamitische Studies',
          subjects: ['Koran', 'Tafseer', 'Hadith'],
          isActive: true
        },
        {
          id: '2',
          teacherId: 'TCH002',
          firstName: 'Fatima',
          lastName: 'El Amrani',
          email: 'fatima@example.com',
          phone: '0623456789',
          specialization: 'Arabische Taal',
          subjects: ['Arabische Grammatica', 'Arabische Literatuur'],
          isActive: true
        },
        {
          id: '3',
          teacherId: 'TCH003',
          firstName: 'Youssef',
          lastName: 'Idrissi',
          email: 'youssef@example.com',
          phone: '0634567890',
          specialization: 'Islamitische Geschiedenis',
          subjects: ['Seerah', 'Islamitische Geschiedenis'],
          isActive: false
        },
        {
          id: '4',
          teacherId: 'TCH004',
          firstName: 'Nora',
          lastName: 'Khalidi',
          email: 'nora@example.com',
          phone: '0645678901',
          specialization: 'Islamitische Jurisprudentie',
          subjects: ['Fiqh', 'Usul al-Fiqh'],
          isActive: true
        },
        {
          id: '5',
          teacherId: 'TCH005',
          firstName: 'Karim',
          lastName: 'Bouazza',
          email: 'karim@example.com',
          phone: '0656789012',
          specialization: 'Hafiz Training',
          subjects: ['Koran Memorisatie', 'Tajweed'],
          isActive: true
        }
      ];
      
      setTeachers(dummyData);
      setFilteredTeachers(dummyData);
      setLoading(false);
    }, 1000);
  }, []);

  // Zoekfunctionaliteit
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTeachers(teachers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = teachers.filter(
        teacher => 
          teacher.firstName.toLowerCase().includes(query) ||
          teacher.lastName.toLowerCase().includes(query) ||
          teacher.teacherId.toLowerCase().includes(query) ||
          teacher.email.toLowerCase().includes(query) ||
          (teacher.specialization && teacher.specialization.toLowerCase().includes(query)) ||
          (teacher.subjects && teacher.subjects.some(subject => subject.toLowerCase().includes(query)))
      );
      setFilteredTeachers(filtered);
    }
  }, [searchQuery, teachers]);

  const handleViewTeacher = (teacher: Teacher) => {
    // In een echte app zou dit naar een detailpagina navigeren
    console.log('View teacher:', teacher);
  };

  const handleEditTeacher = (teacher: Teacher) => {
    // In een echte app zou dit naar een bewerkingspagina navigeren
    console.log('Edit teacher:', teacher);
  };

  const handleDeleteTeacher = (teacher: Teacher) => {
    // In een echte app zou dit een bevestigingsdialoog tonen
    console.log('Delete teacher:', teacher);
  };

  const handleAddTeacher = () => {
    // In een echte app zou dit naar een toevoegingspagina navigeren
    console.log('Add new teacher');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={styles.loadingText}>Docenten laden...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Docenten</Text>
        <Text style={styles.headerSubtitle}>Beheer alle docenten</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" />
          <TextInput
            style={styles.searchInput}
            placeholder="Zoek op naam, ID, specialisatie..."
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
          onPress={handleAddTeacher}
        >
          <Icon name="plus" />
          <Text style={styles.addButtonText}>Nieuwe Docent</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {filteredTeachers.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="user-x" />
            <Text style={styles.emptyStateTitle}>Geen docenten gevonden</Text>
            <Text style={styles.emptyStateText}>
              Er zijn geen docenten die overeenkomen met je zoekopdracht.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredTeachers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TeacherItem
                teacher={item}
                onView={handleViewTeacher}
                onEdit={handleEditTeacher}
                onDelete={handleDeleteTeacher}
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
  teacherItem: {
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
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  teacherId: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  teacherDetail: {
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
  teacherActions: {
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

export default TeachersScreen;