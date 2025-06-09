import { db } from '../db';
import { users, teachers, students, guardians, programs, academicYears, studentGroups } from '../../shared/schema';
import bcrypt from 'bcryptjs';

async function createTestUsers() {
  console.log('🔧 Creating test users for RBAC integration testing...');
  
  try {
    // Hash voor test wachtwoorden
    const testPasswordHash = await bcrypt.hash('test123', 10);
    
    // 1. Maak Academic Year aan (vereist voor andere data)
    const [academicYear] = await db.insert(academicYears).values({
      name: '2024-2025',
      startDate: '2024-09-01',
      endDate: '2025-07-31',
      isActive: true
    }).returning();
    console.log('✅ Academic year created');
    
    // 2. Maak een test programma aan
    const [program] = await db.insert(programs).values({
      name: 'Basis Islamitische Studies',
      code: 'BIS-101',
      description: 'Basis programma voor islamitische studies',
      duration: 1,
      department: 'Islamitische Studies',
      isActive: true
    }).returning();
    console.log('✅ Test program created');
    
    // 3. Maak test klassen aan
    const [studentGroup] = await db.insert(studentGroups).values({
      name: 'Test Klas 1A',
      academicYear: academicYear.name,
      description: 'Test klas voor integratie testing',
      maxCapacity: 25,
      programId: program.id
    }).returning();
    console.log('✅ Test class created');
    
    // 4. Secretariat gebruiker
    const [secretariatUser] = await db.insert(users).values({
      email: 'secretariat@mymadrassa.nl',
      password: testPasswordHash,
      role: 'secretariat',
      firstName: 'Sara',
      lastName: 'Secretariaat',
      isActive: true
    }).returning();
    console.log('✅ Secretariat user created');
    
    // 5. Teacher gebruiker
    const [teacherUser] = await db.insert(users).values({
      email: 'teacher@mymadrassa.nl',
      password: testPasswordHash,
      role: 'teacher',
      firstName: 'Ahmed',
      lastName: 'Docent',
      isActive: true
    }).returning();
    
    // Maak teacher profiel aan
    const [teacher] = await db.insert(teachers).values({
      teacherId: 'TCH-2024-001',
      firstName: 'Ahmed',
      lastName: 'Docent',
      email: 'teacher@mymadrassa.nl',
      phone: '0612345678',
      specialization: 'Arabische Taal',
      qualifications: 'Master Arabische Taal en Letterkunde',
      hireDate: '2024-01-01',
      isActive: true,
      userId: teacherUser.id
    }).returning();
    console.log('✅ Teacher user and profile created');
    
    // 6. Guardian gebruiker
    const [guardianUser] = await db.insert(users).values({
      email: 'guardian@mymadrassa.nl',
      password: testPasswordHash,
      role: 'guardian',
      firstName: 'Fatima',
      lastName: 'Ouder',
      isActive: true
    }).returning();
    
    // Maak guardian profiel aan
    const [guardian] = await db.insert(guardians).values({
      firstName: 'Fatima',
      lastName: 'Ouder',
      email: 'guardian@mymadrassa.nl',
      phone: '0687654321',
      relationship: 'moeder',
      address: 'Teststraat 123',
      postalCode: '1234AB',
      city: 'Amsterdam',
      isEmergencyContact: true,
      userId: guardianUser.id
    }).returning();
    console.log('✅ Guardian user and profile created');
    
    // 7. Student gebruiker
    const [studentUser] = await db.insert(users).values({
      email: 'student@mymadrassa.nl',
      password: testPasswordHash,
      role: 'student',
      firstName: 'Yusuf',
      lastName: 'Student',
      isActive: true
    }).returning();
    
    // Maak student profiel aan
    const [student] = await db.insert(students).values({
      studentId: 'STU-2024-001',
      firstName: 'Yusuf',
      lastName: 'Student',
      email: 'student@mymadrassa.nl',
      phone: '0698765432',
      dateOfBirth: '2010-05-15',
      address: 'Studentenstraat 456',
      postalCode: '5678CD',
      city: 'Rotterdam',
      status: 'active',
      gender: 'man'
    }).returning();
    console.log('✅ Student user and profile created');
    
    console.log('\n🎉 All test users created successfully!');
    console.log('\n📋 Test Account Details:');
    console.log('Admin: admin@mymadrassa.nl (already exists)');
    console.log('Secretariat: secretariat@mymadrassa.nl');
    console.log('Teacher: teacher@mymadrassa.nl');
    console.log('Guardian: guardian@mymadrassa.nl');
    console.log('Student: student@mymadrassa.nl');
    console.log('All passwords: test123');
    console.log('\n🔐 Ready for RBAC integration testing!');
    
  } catch (error) {
    console.error('❌ Error creating test users:', error);
    throw error;
  }
}

createTestUsers()
  .then(() => {
    console.log('✅ Test user creation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test user creation failed:', error);
    process.exit(1);
  });