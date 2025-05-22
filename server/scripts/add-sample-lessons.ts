import { db } from "../db";
import { lessons, events } from "../../shared/schema";

async function main() {
  console.log("Adding lessen en evenementen voor deze week...");

  try {
    // Huidige datum
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    // Datums voor deze week
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date.toISOString().split('T')[0]);
    }

    // Voeg lessen toe voor deze week
    await db.execute(`
      INSERT INTO lessons (title, description, scheduled_date, course_id, end_time, location, status)
      VALUES 
      ('Arabische grammatica - Voornaamwoorden', 'Basis van Arabische voornaamwoorden en hun gebruik', '${weekDates[1]}T09:00:00Z', 1, '${weekDates[1]}T10:30:00Z', 'Klaslokaal 1', 'scheduled'),
      ('Koran recitatie - Soera Al-Fatiha', 'Oefenen van correcte uitspraak en tajweed-regels', '${weekDates[2]}T13:00:00Z', 2, '${weekDates[2]}T14:30:00Z', 'Klaslokaal 2', 'scheduled'),
      ('Islamitische Ethiek - Introductie', 'Basisbegrippen en principes van islamitische ethiek', '${weekDates[3]}T10:00:00Z', 5, '${weekDates[3]}T11:30:00Z', 'Klaslokaal 3', 'scheduled'),
      ('Arabische Woordenschat - Familie', 'Woordenschat rondom familie en relaties', '${weekDates[4]}T09:00:00Z', 3, '${weekDates[4]}T10:30:00Z', 'Klaslokaal 1', 'scheduled')
    `);
    
    // Voeg evenementen toe
    await db.execute(`
      INSERT INTO events (title, description, start_date, end_date, location, type, is_all_day)
      VALUES 
      ('Ouderavond', 'Informatieavond voor alle ouders over het nieuwe schooljaar', '${weekDates[4]}T19:00:00Z', '${weekDates[4]}T21:00:00Z', 'Grote zaal', 'meeting', false),
      ('Eid al-Adha viering', 'Schoolviering van Eid al-Adha met speciale activiteiten', '${weekDates[6]}T10:00:00Z', '${weekDates[6]}T16:00:00Z', 'Hele school', 'celebration', true)
    `);

    // Bekijk de toegevoegde lessen
    const addedLessons = await db.select().from(lessons);
    console.log("Toegevoegde lessen:", addedLessons);

    // Bekijk de toegevoegde evenementen
    const addedEvents = await db.select().from(events);
    console.log("Toegevoegde evenementen:", addedEvents);

    console.log("Lesrooster en evenementen succesvol toegevoegd!");
  } catch (error) {
    console.error("Fout bij toevoegen van lesrooster en evenementen:", error);
  }
}

main()
  .catch((e) => {
    console.error("Fout in hoofdfunctie:", e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });