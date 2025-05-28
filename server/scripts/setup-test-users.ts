import { db } from '../db';
import { schools, systemUsers } from '../../shared/schema';
import { hashPassword } from '../middleware/auth';

export async function setupTestData() {
  console.log('Setting up test schools and users...');
  
  try {
    // Create test schools
    const [schoolA] = await db.insert(schools).values({
      name: 'Islamitische School Amsterdam',
      code: 'SCHOOL_A',
      address: 'Schoolstraat 1, 1000 AA Amsterdam',
      phone: '020-1234567',
      email: 'info@school-a.nl'
    }).returning();

    const [schoolB] = await db.insert(schools).values({
      name: 'Al-Noor School Rotterdam', 
      code: 'SCHOOL_B',
      address: 'Educatieweg 10, 3000 BB Rotterdam',
      phone: '010-7654321',
      email: 'info@school-b.nl'
    }).returning();

    console.log('Created schools:', schoolA.name, schoolB.name);

    // Hash password for all test users
    const hashedPassword = await hashPassword('pass123');

    // Create test users for each role
    const testUsers = [
      // Superadmin (no school)
      {
        email: 'superadmin@example.com',
        password: await hashPassword('admin123'),
        role: 'superadmin',
        schoolId: null
      },
      // Directeur
      {
        email: 'directeur@example.com',
        password: hashedPassword,
        role: 'directeur',
        schoolId: schoolA.id
      },
      // Docent
      {
        email: 'docent@example.com',
        password: hashedPassword,
        role: 'docent', 
        schoolId: schoolA.id
      },
      // Student
      {
        email: 'student@example.com',
        password: hashedPassword,
        role: 'student',
        schoolId: schoolA.id
      },
      // Ouder
      {
        email: 'ouder@example.com',
        password: hashedPassword,
        role: 'ouder',
        schoolId: schoolA.id
      }
    ];

    // Insert test users
    for (const user of testUsers) {
      await db.insert(systemUsers).values(user);
      console.log(`Created ${user.role}: ${user.email}`);
    }

    console.log('Test data setup completed!');
    console.log('\nLogin credentials:');
    console.log('Superadmin: superadmin@example.com / admin123');
    console.log('Directeur: directeur@example.com / pass123');
    console.log('Docent: docent@example.com / pass123');
    console.log('Student: student@example.com / pass123');
    console.log('Ouder: ouder@example.com / pass123');

  } catch (error) {
    console.error('Error setting up test data:', error);
  }
}