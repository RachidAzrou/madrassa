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

type ClassesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Classes'>;

interface ClassesScreenProps {
  navigation: ClassesScreenNavigationProp;
}

// Klasse type definitie
interface Class {
  id: string;
  name: string;
  year: string;
  program: string;
  teacherName?: string;
  studentCount: number;
  schedule?: string;
  room?: string;
  isActive: boolean;
}

// Klasse lijst item component
interface ClassItemProps {
  classItem: Class;
  onView: (classItem: Class) => void;
  onEdit: (classItem: Class) => void;
  onDelete: (classItem: Class) => void;
  isWideScreen: boolean;
}

const ClassItem: React.FC<ClassItemProps> = ({ 
  classItem, 
  onView, 
  onEdit, 
  onDelete, 
  isWideScreen 
}) => {
  return (
    <View style={styles.classItem}>
      <View style={styles.classInfo}>
        <Text style={styles.className}>{classItem.name}</Text>
        <Text style={styles.classDetail}>Programma: {classItem.program}</Text>
        <Text style={styles.classDetail}>Jaar: {classItem.year}</Text>
        
        {isWideScreen && (
          <>
            {classItem.teacherName && (
              <Text style={styles.classDetail}>Docent: {classItem.teacherName}</Text>
            )}
            <Text style={styles.classDetail}>Aantal studenten: {classItem.studentCount}</Text>
            {classItem.schedule && (
              <Text style={styles.classDetail}>Rooster: {classItem.schedule}</Text>
            )}
            {classItem.room && (
              <Text style={styles.classDetail}>Lokaal: {classItem.room}</Text>
            )}
          </>
        )}
        
        <View style={styles.statusBadge}>
          <Text style={[
            styles.statusText, 
            { color: classItem.isActive ? '#059669' : '#dc2626' }
          ]}>
            {classItem.isActive ? 'Actief' : 'Inactief'}
          </Text>
        </View>
      </View>
      
      <View style={styles.classActions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => onView(classItem)}
        >
          <Icon name="eye" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => onEdit(classItem)}
        >
          <Icon name="edit" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={() => onDelete(classItem)}
        >
          <Icon name="trash" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ClassesScreen: React.FC<ClassesScreenProps> = ({ navigation }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;

  // Dummy data laden - in een echte app zou dit van de backend komen
  useEffect(() => {
    // Simuleer een API call
    setTimeout(() => {
      const dummyData: Class[] = [
        {
          id: '1',
          name: 'Klas 1A',
          year: '2024-2025',
          program: 'Islamitische Studies',
          teacherName: 'Ahmed Ben Ali',
          studentCount: 24,
          schedule: 'Ma, Wo, Vr 09:00-12:00',
          room: 'Lokaal 101',
          isActive: true
        },
        {
          id: '2',
          name: 'Klas 2B',
          year: '2024-2025',
          program: 'Arabische Taal',
          teacherName: 'Fatima El Amrani',
          studentCount: 18,
          schedule: 'Di, Do 13:00-16:00',
          room: 'Lokaal 102',
          isActive: true
        },
        {
          id: '3',
          name: 'Klas 3C',
          year: '2024-2025',
          program: 'Hafiz Programma',
          teacherName: 'Karim Bouazza',
          studentCount: 12,
          schedule: 'Za, Zo 09:00-13:00',
          room: 'Lokaal 103',
          isActive: true
        },
        {
          id: '4',
          name: 'Klas 1D',
          year: '2024-2025',
          program: 'Islamitische Studies',
          teacherName: 'Nora Khalidi',
          studentCount: 22,
          schedule: 'Ma, Wo, Vr 13:00-16:00',
          room: 'Lokaal 104',
          isActive: false
        },
        {
          id: '5',
          name: 'Klas 2E',
          year: '2024-2025',
          program: 'Arabische Taal',
          teacherName: 'Youssef Idrissi',
          studentCount: 15,
          schedule: 'Di, Do 09:00-12:00',
          room: 'Lokaal 105',
          isActive: true
        }
      ];
      
      setClasses(dummyData);
      setFilteredClasses(dummyData);
      setLoading(false);
    }, 1000);
  }, []);

  // Zoekfunctionaliteit
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClasses(classes);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = classes.filter(
        classItem => 
          classItem.name.toLowerCase().includes(query) ||
          classItem.program.toLowerCase().includes(query) ||
          classItem.year.toLowerCase().includes(query) ||
          (classItem.teacherName && classItem.teacherName.toLowerCase().includes(query)) ||
          (classItem.room && classItem.room.toLowerCase().includes(query))
      );
      setFilteredClasses(filtered);
    }
  }, [searchQuery, classes]);

  const handleViewClass = (classItem: Class) => {
    // In een echte app zou dit naar een detailpagina navigeren
    console.log('View class:', classItem);
  };

  const handleEditClass = (classItem: Class) => {
    // In een echte app zou dit naar een bewerkingspagina navigeren
    console.log('Edit class:', classItem);
  };

  const handleDeleteClass = (classItem: Class) => {
    // In een echte app zou dit een bevestigingsdialoog tonen
    console.log('Delete class:', classItem);
  };

  const handleAddClass = () => {
    // In een echte app zou dit naar een toevoegingspagina navigeren
    console.log('Add new class');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={styles.loadingText}>Klassen laden...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Klassen</Text>
        <Text style={styles.headerSubtitle}>Beheer alle klassen</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" />
          <TextInput
            style={styles.searchInput}
            placeholder="Zoek op naam, programma, docent..."
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
          onPress={handleAddClass}
        >
          <Icon name="plus" />
          <Text style={styles.addButtonText}>Nieuwe Klas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {filteredClasses.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="folder-x" />
            <Text style={styles.emptyStateTitle}>Geen klassen gevonden</Text>
            <Text style={styles.emptyStateText}>
              Er zijn geen klassen die overeenkomen met je zoekopdracht.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredClasses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ClassItem
                classItem={item}
                onView={handleViewClass}
                onEdit={handleEditClass}
                onDelete={handleDeleteClass}
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
  classItem: {
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
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  classDetail: {
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
  classActions: {
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

export default ClassesScreen;