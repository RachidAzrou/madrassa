import { db } from '../db';
import { events, teachers, studentGroups, courses } from '../../shared/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Starting to add calendar data...');

  try {
    // Fetch existing teachers
    const existingTeachers = await db.select().from(teachers);
    if (existingTeachers.length === 0) {
      console.log('No teachers found. Please run add-dummy-data.ts first.');
      return;
    }

    // Fetch existing student groups
    const existingGroups = await db.select().from(studentGroups);
    if (existingGroups.length === 0) {
      console.log('No student groups found. Please run add-dummy-data.ts first.');
      return;
    }

    // Fetch existing courses
    const existingCourses = await db.select().from(courses);
    if (existingCourses.length === 0) {
      console.log('No courses found. Please run add-dummy-data.ts first.');
      return;
    }

    // Voeg kalenderevenementen toe
    console.log('Creating calendar events...');
    
    const calendarEvents = [
      {
        title: 'Ouderavond',
        description: 'Algemene ouderavond voor alle ouders en verzorgers',
        type: 'meeting',
        startDate: new Date('2024-06-15T19:00:00'),
        endDate: new Date('2024-06-15T21:00:00'),
        location: 'Grote Zaal - Hoofdgebouw',
        isAllDay: false,
        isPublic: true,
        notes: 'Betreft voortgang en plannen voor het volgende semester'
      },
      {
        title: 'Ramadan Viering',
        description: 'Gezamenlijke iftar voor alle studenten en hun families',
        type: 'event',
        startDate: new Date('2024-05-30T19:30:00'),
        endDate: new Date('2024-05-30T22:00:00'),
        location: 'Grote Zaal - Hoofdgebouw',
        isAllDay: false,
        isPublic: true,
        notes: 'Breng een gerecht mee voor de potluck iftar'
      },
      {
        title: 'Docenten Vergadering',
        description: 'Maandelijkse vergadering van alle docenten',
        type: 'meeting',
        startDate: new Date('2024-05-28T15:00:00'),
        endDate: new Date('2024-05-28T16:30:00'),
        location: 'Vergaderzaal 2 - Administratiegebouw',
        isAllDay: false,
        isPublic: false,
        notes: 'Bespreking van studentvoortgang en curriculum updates'
      },
      {
        title: 'Eid al-Fitr',
        description: 'Eid-viering - school gesloten',
        type: 'holiday',
        startDate: new Date('2024-06-05'),
        endDate: new Date('2024-06-05'),
        location: '',
        isAllDay: true,
        isPublic: true,
        notes: 'Alle lessen geannuleerd'
      },
      {
        title: 'Zomervakantie',
        description: 'Schoolvakantie',
        type: 'holiday',
        startDate: new Date('2024-07-15'),
        endDate: new Date('2024-08-20'),
        location: '',
        isAllDay: true,
        isPublic: true,
        notes: 'School gesloten voor de zomervakantie'
      },
      {
        title: 'Arabische Taalwedstrijd',
        description: 'Jaarlijkse taalwedstrijd voor alle niveaus',
        type: 'competition',
        startDate: new Date('2024-06-10T13:00:00'),
        endDate: new Date('2024-06-10T16:00:00'),
        location: 'Auditorium',
        isAllDay: false,
        isPublic: true,
        notes: 'Prijzen voor de beste prestaties per niveau'
      },
      {
        title: 'Koran Recitatie Examen',
        description: 'Eindexamen Koran recitatie voor gevorderde studenten',
        type: 'exam',
        startDate: new Date('2024-06-12T10:00:00'),
        endDate: new Date('2024-06-12T12:00:00'),
        location: 'Gebedsruimte',
        isAllDay: false,
        isPublic: true,
        notes: 'Voorbereid zijn op recitatie van toegewezen passages'
      },
      {
        title: 'Eindexamens Arabisch',
        description: 'Eindexamens voor alle Arabische taalklassen',
        type: 'exam',
        startDate: new Date('2024-06-20'),
        endDate: new Date('2024-06-22'),
        location: 'Diverse lokalen',
        isAllDay: true,
        isPublic: true,
        notes: 'Zie rooster voor specifieke tijden per klas'
      }
    ];

    // Voeg de evenementen toe aan de database
    for (const eventData of calendarEvents) {
      // Check if an event with this title and date already exists
      const existing = await db.select().from(events)
        .where(
          eq(events.title, eventData.title)
        ).limit(1);

      if (existing.length === 0) {
        await db.insert(events).values(eventData);
        console.log(`Created event: ${eventData.title}`);
      } else {
        console.log(`Event '${eventData.title}' already exists. Skipping.`);
      }
    }

    console.log('Calendar data added successfully!');
  } catch (error) {
    console.error('Error adding calendar data:', error);
  }
}

main().catch(console.error);