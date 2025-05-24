import { db } from '../db';
import { rooms } from '../../shared/schema';

async function main() {
  try {
    console.log('Toevoegen van voorbeeld lokalen...');

    // Voorbeeldlokalen
    const sampleRooms = [
      {
        name: 'Lokaal A1.01',
        capacity: 25,
        location: '1e verdieping, A-vleugel',
        status: 'available',
        notes: 'Uitgerust met smartboard en 25 werkplekken'
      },
      {
        name: 'Lokaal A1.02',
        capacity: 30,
        location: '1e verdieping, A-vleugel',
        status: 'available',
        notes: 'Geschikt voor grotere groepen, inclusief beamer'
      },
      {
        name: 'Lokaal B2.03',
        capacity: 20,
        location: '2e verdieping, B-vleugel',
        status: 'occupied',
        notes: 'Computerlokaal met 20 werkstations'
      },
      {
        name: 'Lokaal C1.05',
        capacity: 15,
        location: '1e verdieping, C-vleugel',
        status: 'available',
        notes: 'Klein lokaal voor kleinere groepen of bijlessen'
      },
      {
        name: 'Gebedsruimte',
        capacity: 35,
        location: 'Begane grond, naast kantine',
        status: 'available',
        notes: 'Speciale ruimte voor gebeden, toegankelijk voor alle studenten'
      },
      {
        name: 'Aula',
        capacity: 150,
        location: 'Begane grond, hoofdingang',
        status: 'reserved',
        notes: 'Grote ruimte voor evenementen en bijeenkomsten'
      },
      {
        name: 'Bibliotheek',
        capacity: 40,
        location: '2e verdieping, centraal',
        status: 'available',
        notes: 'Studieruimte met toegang tot boeken en digitale middelen'
      },
      {
        name: 'Lokaal D3.01',
        capacity: 28,
        location: '3e verdieping, D-vleugel',
        status: 'available',
        notes: 'Taallokaal met audiovisuele apparatuur'
      }
    ];

    // Voeg lokalen toe aan de database
    const now = new Date().toISOString();
    for (const room of sampleRooms) {
      await db.insert(rooms).values({
        ...room,
        createdAt: now,
        updatedAt: now
      }).onConflictDoNothing();
    }

    console.log('Voorbeeld lokalen succesvol toegevoegd!');
  } catch (error) {
    console.error('Fout bij het toevoegen van voorbeeldlokalen:', error);
  } finally {
    process.exit(0);
  }
}

main();