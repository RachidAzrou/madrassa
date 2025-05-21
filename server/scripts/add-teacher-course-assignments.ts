import { db } from '../db';
import { teacherCourseAssignments } from '@shared/schema';

async function main() {
  console.log('Toevoegen van voorbeeld docent-vak toewijzingen...');

  // Eerst controleren of er al toewijzingen zijn
  const existingAssignments = await db.select().from(teacherCourseAssignments);
  if (existingAssignments.length > 0) {
    console.log(`Er zijn al ${existingAssignments.length} docent-vak toewijzingen in de database. Geen nieuwe data toegevoegd.`);
    return;
  }

  // Docent 1 (Mohammed Youssef) toewijzingen
  const teacher1Assignments = [
    {
      teacherId: 1,
      courseId: 1, // Arabische Grammatica - Basis
      isPrimary: true,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-12-31'),
      notes: 'Hoofddocent voor Arabische Grammatica'
    },
    {
      teacherId: 1,
      courseId: 2, // Arabische Grammatica
      isPrimary: true,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-12-31'),
      notes: 'Vervolg op basisgrammatica'
    },
    {
      teacherId: 1,
      courseId: 3, // Arabische Woordenschat
      isPrimary: false,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-12-31'),
      notes: 'Ondersteuning bij woordenschat ontwikkeling'
    }
  ];

  // Docent 2 (Aisha Benali) toewijzingen
  const teacher2Assignments = [
    {
      teacherId: 3,
      courseId: 6, // Tajweed Basis
      isPrimary: true,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-12-31'),
      notes: 'Specialist in Koran recitatie en tajweed regels'
    },
    {
      teacherId: 3,
      courseId: 4, // Arabische Conversatie
      isPrimary: true,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-12-31'),
      notes: 'Focus op praktische gespreksvaardigheid'
    }
  ];

  // Docent 3 (Youssef El Mansouri) toewijzingen
  const teacher3Assignments = [
    {
      teacherId: 4,
      courseId: 5, // Islamitische Ethiek
      isPrimary: true,
      startDate: new Date('2024-01-20'),
      endDate: new Date('2024-12-31'),
      notes: 'Expert in islamitische jurisprudentie en ethiek'
    }
  ];

  // Docent 4 (Fatima Azizi) toewijzingen
  const teacher4Assignments = [
    {
      teacherId: 5,
      courseId: 3, // Arabische Woordenschat
      isPrimary: true,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-12-31'),
      notes: 'Gespecialiseerd in het onderwijzen van basiswoordenschat'
    },
    {
      teacherId: 5,
      courseId: 4, // Arabische Conversatie
      isPrimary: false,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-12-31'),
      notes: 'Assisteert bij conversatieoefeningen'
    }
  ];

  // Alle toewijzingen samenvoegen
  const allAssignments = [
    ...teacher1Assignments,
    ...teacher2Assignments,
    ...teacher3Assignments,
    ...teacher4Assignments
  ];

  // Toewijzingen toevoegen aan de database
  try {
    const insertedAssignments = await db.insert(teacherCourseAssignments).values(allAssignments).returning();
    console.log(`Succesvol ${insertedAssignments.length} docent-vak toewijzingen toegevoegd.`);
    
    // Toon samenvatting van toegevoegde toewijzingen per docent
    const teacherCounts = allAssignments.reduce((acc, curr) => {
      acc[curr.teacherId] = (acc[curr.teacherId] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    Object.entries(teacherCounts).forEach(([teacherId, count]) => {
      console.log(`Docent ID ${teacherId}: ${count} vakken toegewezen`);
    });
    
  } catch (error) {
    console.error('Fout bij het toevoegen van docent-vak toewijzingen:', error);
  }
}

main()
  .catch(e => {
    console.error('Fout bij uitvoeren van script:', e);
  })
  .finally(async () => {
    // Sluit de database verbinding
    await db.pool.end();
    console.log('Database verbinding afgesloten');
  });