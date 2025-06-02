import { db } from "../db";
import { 
  programs, courses, students, teachers, guardians, studentGuardians,
  studentGroups, studentGroupEnrollments, teacherCourseAssignments
} from "@shared/schema";

async function seedDatabase() {
  console.log("Starting database seeding...");
  
  try {
    // Clear all existing data
    console.log("Clearing existing data...");
    await db.delete(teacherCourseAssignments);
    await db.delete(studentGroupEnrollments);
    await db.delete(studentGuardians);
    await db.delete(studentGroups);
    await db.delete(guardians);
    await db.delete(students);
    await db.delete(courses);
    await db.delete(teachers);
    await db.delete(programs);
    
    // Insert Programs (Vakken)
    console.log("Inserting programs...");
    const insertedPrograms = await db.insert(programs).values([
      {
        name: "Arabische Taal",
        code: "AR-101",
        description: "Basis Arabische taal en grammatica voor beginners",
        duration: 1,
        department: "Taalonderwijs",
        isActive: true,
        entryRequirements: "Geen voorkennis vereist"
      },
      {
        name: "Koran Studies",
        code: "QS-101", 
        description: "Koranrecitatie en basis tafsir",
        duration: 1,
        department: "Islamitische Studies",
        isActive: true,
        entryRequirements: "Basis Arabische leesvaardigheid"
      },
      {
        name: "Islamitische Geschiedenis",
        code: "IH-101",
        description: "Geschiedenis van de Islam vanaf de profeet tot heden",
        duration: 1,
        department: "Islamitische Studies", 
        isActive: true,
        entryRequirements: "Geen voorkennis vereist"
      },
      {
        name: "Fiqh Basics",
        code: "FQ-101",
        description: "Islamitische jurisprudentie en praktische religie",
        duration: 1,
        department: "Islamitische Studies",
        isActive: true,
        entryRequirements: "Basis kennis van Islam"
      },
      {
        name: "Nederlandse Taal",
        code: "NL-101",
        description: "Nederlandse taal voor nieuwe migranten",
        duration: 1,
        department: "Taalonderwijs",
        isActive: true,
        entryRequirements: "Geen voorkennis vereist"
      }
    ]).returning();
    
    // Insert Teachers (Docenten)
    console.log("Inserting teachers...");
    const insertedTeachers = await db.insert(teachers).values([
      {
        teacherId: "DOC-001",
        firstName: "Ahmed",
        lastName: "Al-Rashid",
        email: "ahmed@mymadrassa.be",
        phone: "0471234567",
        specialization: "Arabische Taal",
        qualification: "Master Arabische Taal & Literatuur",
        isActive: true,
        hireDate: "2023-09-01"
      },
      {
        teacherId: "DOC-002", 
        firstName: "Fatima",
        lastName: "Hassan",
        email: "fatima@mymadrassa.be",
        phone: "0472345678",
        specialization: "Islamitische Studies",
        qualification: "Master Islamitische Theologie",
        isActive: true,
        hireDate: "2023-09-01"
      },
      {
        teacherId: "DOC-003",
        firstName: "Omar",
        lastName: "Benali",
        email: "omar@mymadrassa.be", 
        phone: "0473456789",
        specialization: "Koran Studies",
        qualification: "Hafiz en Bachelor Islamitische Studies",
        isActive: true,
        hireDate: "2023-09-15"
      },
      {
        teacherId: "DOC-004",
        firstName: "Mariam",
        lastName: "El-Amiri",
        email: "mariam@mymadrassa.be",
        phone: "0474567890",
        specialization: "Nederlandse Taal",
        qualification: "Master Nederlands als Tweede Taal",
        isActive: true,
        hireDate: "2023-10-01"
      }
    ]).returning();
    
    // Insert Student Groups (Klassen)
    console.log("Inserting student groups...");
    const insertedGroups = await db.insert(studentGroups).values([
      {
        name: "Klas 1A",
        academicYear: "2024-2025",
        capacity: 25,
        currentSize: 18,
        programId: insertedPrograms[0].id,
        courseId: null,
        gradeLevel: "Basis",
        classroom: "Lokaal A1"
      },
      {
        name: "Klas 1B", 
        academicYear: "2024-2025",
        capacity: 25,
        currentSize: 20,
        programId: insertedPrograms[1].id,
        courseId: null,
        gradeLevel: "Basis",
        classroom: "Lokaal B1"
      },
      {
        name: "Klas 2A",
        academicYear: "2024-2025", 
        capacity: 30,
        currentSize: 22,
        programId: insertedPrograms[2].id,
        courseId: null,
        gradeLevel: "Gevorderd",
        classroom: "Lokaal A2"
      },
      {
        name: "Klas 2B",
        academicYear: "2024-2025",
        capacity: 30,
        currentSize: 15,
        programId: insertedPrograms[3].id,
        courseId: null,
        gradeLevel: "Gevorderd", 
        classroom: "Lokaal B2"
      }
    ]).returning();
    
    // Insert Guardians (Voogden)
    console.log("Inserting guardians...");
    const insertedGuardians = await db.insert(guardians).values([
      {
        firstName: "Mohammed",
        lastName: "Al-Zahra", 
        relationship: "Vader",
        email: "mohammed.alzahra@email.com",
        phone: "0481234567",
        address: "Lange Nieuwstraat 45",
        street: "Lange Nieuwstraat",
        houseNumber: "45",
        postalCode: "2000",
        city: "Antwerpen",
        isEmergencyContact: true,
        occupation: "Ingenieur"
      },
      {
        firstName: "Aisha",
        lastName: "Al-Zahra",
        relationship: "Moeder", 
        email: "aisha.alzahra@email.com",
        phone: "0482345678",
        address: "Lange Nieuwstraat 45",
        street: "Lange Nieuwstraat",
        houseNumber: "45",
        postalCode: "2000",
        city: "Antwerpen",
        isEmergencyContact: true,
        occupation: "Verpleegkundige"
      },
      {
        firstName: "Yusuf",
        lastName: "Benali",
        relationship: "Vader",
        email: "yusuf.benali@email.com", 
        phone: "0483456789",
        address: "Korte Gasthuisstraat 12",
        street: "Korte Gasthuisstraat",
        houseNumber: "12",
        postalCode: "2000",
        city: "Antwerpen",
        isEmergencyContact: true,
        occupation: "Leraar"
      },
      {
        firstName: "Khadija",
        lastName: "El-Mansouri",
        relationship: "Moeder",
        email: "khadija.elmansouri@email.com",
        phone: "0484567890",
        address: "Groenplaats 8",
        street: "Groenplaats", 
        houseNumber: "8",
        postalCode: "2000",
        city: "Antwerpen",
        isEmergencyContact: true,
        occupation: "Accountant"
      }
    ]).returning();
    
    // Insert Students (Leerlingen)
    console.log("Inserting students...");
    const insertedStudents = await db.insert(students).values([
      {
        studentId: "STU-001",
        firstName: "Zaynab",
        lastName: "Al-Zahra",
        email: "zaynab.alzahra@student.mymadrassa.be",
        phone: null,
        dateOfBirth: "2010-03-15",
        address: "Lange Nieuwstraat 45",
        street: "Lange Nieuwstraat",
        houseNumber: "45", 
        postalCode: "2000",
        city: "Antwerpen",
        nationality: "Belgisch",
        emergencyContactName: "Mohammed Al-Zahra",
        emergencyContactPhone: "0481234567",
        emergencyContactRelation: "Vader",
        enrollmentDate: "2024-09-01",
        status: "Actief",
        academicYear: "2024-2025"
      },
      {
        studentId: "STU-002",
        firstName: "Hassan",
        lastName: "Benali", 
        email: "hassan.benali@student.mymadrassa.be",
        phone: null,
        dateOfBirth: "2009-07-22",
        address: "Korte Gasthuisstraat 12",
        street: "Korte Gasthuisstraat",
        houseNumber: "12",
        postalCode: "2000",
        city: "Antwerpen",
        nationality: "Belgisch",
        emergencyContactName: "Yusuf Benali",
        emergencyContactPhone: "0483456789",
        emergencyContactRelation: "Vader",
        enrollmentDate: "2024-09-01",
        status: "Actief",
        academicYear: "2024-2025"
      },
      {
        studentId: "STU-003",
        firstName: "Amina",
        lastName: "El-Mansouri",
        email: "amina.elmansouri@student.mymadrassa.be",
        phone: null,
        dateOfBirth: "2011-11-08",
        address: "Groenplaats 8",
        street: "Groenplaats",
        houseNumber: "8",
        postalCode: "2000", 
        city: "Antwerpen",
        nationality: "Belgisch",
        emergencyContactName: "Khadija El-Mansouri",
        emergencyContactPhone: "0484567890",
        emergencyContactRelation: "Moeder",
        enrollmentDate: "2024-09-01", 
        status: "Actief",
        academicYear: "2024-2025"
      },
      {
        studentId: "STU-004",
        firstName: "Ibrahim",
        lastName: "Al-Zahra",
        email: "ibrahim.alzahra@student.mymadrassa.be",
        phone: null,
        dateOfBirth: "2012-05-30",
        address: "Lange Nieuwstraat 45",
        street: "Lange Nieuwstraat",
        houseNumber: "45",
        postalCode: "2000",
        city: "Antwerpen", 
        nationality: "Belgisch",
        emergencyContactName: "Aisha Al-Zahra",
        emergencyContactPhone: "0482345678", 
        emergencyContactRelation: "Moeder",
        enrollmentDate: "2024-09-01",
        status: "Actief",
        academicYear: "2024-2025"
      },
      {
        studentId: "STU-005",
        firstName: "Maryam",
        lastName: "Benali",
        email: "maryam.benali@student.mymadrassa.be",
        phone: null,
        dateOfBirth: "2013-01-12",
        address: "Korte Gasthuisstraat 12",
        street: "Korte Gasthuisstraat", 
        houseNumber: "12",
        postalCode: "2000",
        city: "Antwerpen",
        nationality: "Belgisch",
        emergencyContactName: "Yusuf Benali",
        emergencyContactPhone: "0483456789",
        emergencyContactRelation: "Vader",
        enrollmentDate: "2024-09-01",
        status: "Actief",
        academicYear: "2024-2025"
      }
    ]).returning();
    
    // Link Students to Guardians
    console.log("Linking students to guardians...");
    await db.insert(studentGuardians).values([
      { studentId: insertedStudents[0].id, guardianId: insertedGuardians[0].id, isPrimary: true },
      { studentId: insertedStudents[0].id, guardianId: insertedGuardians[1].id, isPrimary: false },
      { studentId: insertedStudents[3].id, guardianId: insertedGuardians[0].id, isPrimary: true },
      { studentId: insertedStudents[3].id, guardianId: insertedGuardians[1].id, isPrimary: false },
      { studentId: insertedStudents[1].id, guardianId: insertedGuardians[2].id, isPrimary: true },
      { studentId: insertedStudents[4].id, guardianId: insertedGuardians[2].id, isPrimary: true },
      { studentId: insertedStudents[2].id, guardianId: insertedGuardians[3].id, isPrimary: true }
    ]);
    
    // Enroll Students in Groups 
    console.log("Enrolling students in groups...");
    await db.insert(studentGroupEnrollments).values([
      { studentId: insertedStudents[0].id, groupId: insertedGroups[0].id, enrollmentDate: "2024-09-01", status: "Actief" },
      { studentId: insertedStudents[1].id, groupId: insertedGroups[1].id, enrollmentDate: "2024-09-01", status: "Actief" },
      { studentId: insertedStudents[2].id, groupId: insertedGroups[2].id, enrollmentDate: "2024-09-01", status: "Actief" },
      { studentId: insertedStudents[3].id, groupId: insertedGroups[0].id, enrollmentDate: "2024-09-01", status: "Actief" },
      { studentId: insertedStudents[4].id, groupId: insertedGroups[3].id, enrollmentDate: "2024-09-01", status: "Actief" }
    ]);
    
    // Assign Teachers to Programs
    console.log("Assigning teachers to programs...");
    await db.insert(teacherCourseAssignments).values([
      { teacherId: insertedTeachers[0].id, courseId: insertedPrograms[0].id, isPrimary: true, startDate: "2024-09-01" },
      { teacherId: insertedTeachers[1].id, courseId: insertedPrograms[2].id, isPrimary: true, startDate: "2024-09-01" },
      { teacherId: insertedTeachers[2].id, courseId: insertedPrograms[1].id, isPrimary: true, startDate: "2024-09-01" },
      { teacherId: insertedTeachers[1].id, courseId: insertedPrograms[3].id, isPrimary: true, startDate: "2024-09-01" },
      { teacherId: insertedTeachers[3].id, courseId: insertedPrograms[4].id, isPrimary: true, startDate: "2024-09-01" }
    ]);
    
    console.log("Database seeding completed successfully!");
    console.log(`Created:`);
    console.log(`- ${insertedPrograms.length} programs`);
    console.log(`- ${insertedTeachers.length} teachers`);
    console.log(`- ${insertedGroups.length} student groups`);
    console.log(`- ${insertedGuardians.length} guardians`);
    console.log(`- ${insertedStudents.length} students`);
    
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run the seeding immediately
seedDatabase()
  .then(() => {
    console.log("Seeding completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });

export { seedDatabase };