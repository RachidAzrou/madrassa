import { db } from '../db';
import { lessons, studentGroups, teacherCourseAssignments, teachers, courses } from '../../shared/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Starting to add teacher assignments...');

  try {
    // Fetch existing teachers
    const existingTeachers = await db.select().from(teachers);
    if (existingTeachers.length === 0) {
      console.log('No teachers found. Please run add-dummy-data.ts first.');
      return;
    }

    // Fetch existing courses
    const existingCourses = await db.select().from(courses);
    if (existingCourses.length === 0) {
      console.log('No courses found. Please run add-dummy-data.ts first.');
      return;
    }

    // Fetch existing groups
    const existingGroups = await db.select().from(studentGroups);
    if (existingGroups.length === 0) {
      console.log('No student groups found. Please run add-dummy-data.ts first.');
      return;
    }

    // Maak teacher-course assignments
    console.log('Creating teacher course assignments...');
    const assignments = [
      {
        teacherId: existingTeachers[0].id, // Mohammed Youssef
        courseId: existingCourses[0].id, // Arabische Grammatica
        isPrimary: true,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2025-12-31'),
        notes: 'Hoofddocent voor Arabische grammatica',
      },
      {
        teacherId: existingTeachers[0].id, // Mohammed Youssef
        courseId: existingCourses[2].id, // Koran Recitatie
        isPrimary: false,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2025-12-31'),
        notes: 'Hulpdocent voor Koran recitatie',
      },
      {
        teacherId: existingTeachers[1].id, // Aisha Benali
        courseId: existingCourses[2].id, // Koran Recitatie
        isPrimary: true,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2025-12-31'),
        notes: 'Hoofddocent voor Koran recitatie',
      },
      {
        teacherId: existingTeachers[1].id, // Aisha Benali
        courseId: existingCourses[3].id, // Tajweed
        isPrimary: true,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2025-12-31'),
        notes: 'Gespecialiseerd in tajweed',
      },
      {
        teacherId: existingTeachers[2].id, // Youssef El Mansouri
        courseId: existingCourses[1].id, // Islamitische Studies
        isPrimary: true,
        startDate: new Date('2024-01-20'),
        endDate: new Date('2025-12-31'),
        notes: 'Hoofddocent voor Islamitische studies',
      },
      {
        teacherId: existingTeachers[2].id, // Youssef El Mansouri
        courseId: existingCourses[4].id, // Fiqh
        isPrimary: true,
        startDate: new Date('2024-01-20'),
        endDate: new Date('2025-12-31'),
        notes: 'Gespecialiseerd in fiqh',
      },
      {
        teacherId: existingTeachers[3].id, // Fatima Azizi
        courseId: existingCourses[5].id, // Arabische Conversatie
        isPrimary: true,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2025-12-31'),
        notes: 'Hoofddocent voor Arabische conversatie',
      },
      {
        teacherId: existingTeachers[3].id, // Fatima Azizi
        courseId: existingCourses[0].id, // Arabische Grammatica
        isPrimary: false,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2025-12-31'),
        notes: 'Hulpdocent voor Arabische grammatica',
      },
    ];

    // Create the assignments
    for (const assignment of assignments) {
      // Check if it already exists to avoid duplicates
      const existing = await db.select().from(teacherCourseAssignments).where(
        eq(teacherCourseAssignments.teacherId, assignment.teacherId)
        // Je zou hier ook courseId kunnen toevoegen voor extra controle
      ).limit(1);

      if (existing.length === 0) {
        await db.insert(teacherCourseAssignments).values(assignment);
        console.log(`Created assignment for Teacher ID ${assignment.teacherId} to Course ID ${assignment.courseId}`);
      } else {
        console.log(`Assignment for Teacher ID ${assignment.teacherId} already exists. Skipping.`);
      }
    }

    // Voeg lessen toe aan het rooster
    const lessonEntries = [
      {
        title: 'Introductie Arabische Grammatica',
        description: 'Basisbeginselen van de Arabische grammatica',
        scheduledDate: new Date('2024-05-22T10:00:00'),
        startTime: '10:00',
        endTime: '11:30',
        teacherId: existingTeachers[0].id,
        courseId: existingCourses[0].id,
        studentGroupId: existingGroups[0].id,
        roomId: 101,
        status: 'gepland',
        notes: '',
        lessonMaterials: 'Handboek Arabische Grammatica, hoofdstuk 1-3',
      },
      {
        title: 'Koran Recitatie - Surah Al-Fatiha',
        description: 'Oefenen van correcte uitspraak van Surah Al-Fatiha',
        scheduledDate: new Date('2024-05-22T13:00:00'),
        startTime: '13:00',
        endTime: '14:30',
        teacherId: existingTeachers[1].id,
        courseId: existingCourses[2].id,
        studentGroupId: existingGroups[1].id,
        roomId: 102,
        status: 'gepland',
        notes: '',
        lessonMaterials: 'Koran exemplaren',
      },
      {
        title: 'Islamitische Geschiedenis',
        description: 'Het leven van de Profeet (vzmh)',
        scheduledDate: new Date('2024-05-23T10:00:00'),
        startTime: '10:00',
        endTime: '11:30',
        teacherId: existingTeachers[2].id,
        courseId: existingCourses[1].id,
        studentGroupId: existingGroups[2].id,
        roomId: 103,
        status: 'gepland',
        notes: '',
        lessonMaterials: 'Handboek Islamitische Geschiedenis deel 1',
      },
      {
        title: 'Arabische Conversatie voor Beginners',
        description: 'Praktische oefeningen voor dagelijkse conversatie',
        scheduledDate: new Date('2024-05-23T13:00:00'),
        startTime: '13:00',
        endTime: '14:30',
        teacherId: existingTeachers[3].id,
        courseId: existingCourses[5].id,
        studentGroupId: existingGroups[0].id,
        roomId: 104,
        status: 'gepland',
        notes: '',
        lessonMaterials: 'Audiobestanden en werkbladen',
      },
      {
        title: 'Tajweed Regels',
        description: 'Regels voor correct reciteren van de Koran',
        scheduledDate: new Date('2024-05-24T10:00:00'),
        startTime: '10:00',
        endTime: '11:30',
        teacherId: existingTeachers[1].id,
        courseId: existingCourses[3].id,
        studentGroupId: existingGroups[1].id,
        roomId: 102,
        status: 'gepland',
        notes: '',
        lessonMaterials: 'Tajweed handleiding en oefenbladen',
      },
      {
        title: 'Fiqh - Basisprincipes',
        description: 'Introductie tot islamitische jurisprudentie',
        scheduledDate: new Date('2024-05-24T13:00:00'),
        startTime: '13:00',
        endTime: '14:30',
        teacherId: existingTeachers[2].id,
        courseId: existingCourses[4].id,
        studentGroupId: existingGroups[2].id,
        roomId: 103,
        status: 'gepland',
        notes: '',
        lessonMaterials: 'Handboek Fiqh voor beginners',
      },
      {
        title: 'Arabische Grammatica Vervolg',
        description: 'Vervolgles over Arabische grammatica',
        scheduledDate: new Date('2024-05-27T10:00:00'),
        startTime: '10:00',
        endTime: '11:30',
        teacherId: existingTeachers[0].id,
        courseId: existingCourses[0].id,
        studentGroupId: existingGroups[0].id,
        roomId: 101,
        status: 'gepland',
        notes: '',
        lessonMaterials: 'Handboek Arabische Grammatica, hoofdstuk 4-6',
      },
      {
        title: 'Koran Recitatie - Oefensessie',
        description: 'Praktisch oefenen van recitatie',
        scheduledDate: new Date('2024-05-27T13:00:00'),
        startTime: '13:00',
        endTime: '14:30',
        teacherId: existingTeachers[1].id,
        courseId: existingCourses[2].id,
        studentGroupId: existingGroups[1].id,
        roomId: 102,
        status: 'gepland',
        notes: '',
        lessonMaterials: 'Koran exemplaren en audio-opnames',
      },
    ];

    // Voeg de lessen toe aan de database
    for (const lesson of lessonEntries) {
      // Check if a similar lesson already exists
      const existing = await db.select().from(lessons)
        .where(
          eq(lessons.title, lesson.title)
        ).limit(1);

      if (existing.length === 0) {
        await db.insert(lessons).values(lesson);
        console.log(`Created lesson: ${lesson.title}`);
      } else {
        console.log(`Lesson '${lesson.title}' already exists. Skipping.`);
      }
    }

    console.log('Teacher assignments and lessons added successfully!');
  } catch (error) {
    console.error('Error adding teacher assignments and lessons:', error);
  }
}

main().catch(console.error);