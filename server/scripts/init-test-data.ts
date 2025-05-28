import { db } from "../db";
import { schools, users, students, teachers } from "../../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function initializeTestData() {
  try {
    console.log("🔄 Checking and initializing test data...");

    // Check if data already exists
    const existingSchools = await db.select().from(schools).limit(1);
    if (existingSchools.length > 0) {
      console.log("✅ Test data already exists, skipping initialization");
      return;
    }

    // Create schools
    console.log("🏫 Creating test schools...");
    const [schoolA] = await db.insert(schools).values({
      name: "School A",
      location: "Amsterdam",
      features: {
        allowDeletion: true,
        enablePayments: true,
        enableMessaging: true,
        enableReports: true
      }
    }).returning();

    const [schoolB] = await db.insert(schools).values({
      name: "School B", 
      location: "Rotterdam",
      features: {
        allowDeletion: false,
        enablePayments: true,
        enableMessaging: true,
        enableReports: false
      }
    }).returning();

    // Create users with hashed passwords
    console.log("👤 Creating test users...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const hashedPassSchoolA = await bcrypt.hash("pass123", 10);
    const hashedPassSchoolB = await bcrypt.hash("pass123", 10);

    // Superadmin
    await db.insert(users).values({
      username: "superadmin",
      email: "superadmin@example.com",
      password: hashedPassword,
      firstName: "Super",
      lastName: "Admin",
      role: "superadmin",
      schoolId: null // null voor superadmin
    });

    // School A users
    const [directeurA] = await db.insert(users).values({
      username: "directeur.schoola",
      email: "directeur.schoola@example.com", 
      password: hashedPassSchoolA,
      firstName: "Directeur",
      lastName: "School A",
      role: "directeur",
      schoolId: schoolA.id
    }).returning();

    const [docentA] = await db.insert(users).values({
      username: "docent.schoola",
      email: "docent.schoola@example.com",
      password: hashedPassSchoolA,
      firstName: "Docent",
      lastName: "School A", 
      role: "docent",
      schoolId: schoolA.id
    }).returning();

    const [studentA] = await db.insert(users).values({
      username: "student.schoola",
      email: "student.schoola@example.com",
      password: hashedPassSchoolA,
      firstName: "Student",
      lastName: "School A",
      role: "student", 
      schoolId: schoolA.id
    }).returning();

    const [ouderA] = await db.insert(users).values({
      username: "ouder.schoola",
      email: "ouder.schoola@example.com",
      password: hashedPassSchoolA,
      firstName: "Ouder",
      lastName: "School A",
      role: "ouder",
      schoolId: schoolA.id
    }).returning();

    // School B users  
    const [directeurB] = await db.insert(users).values({
      username: "directeur.schoolb",
      email: "directeur.schoolb@example.com",
      password: hashedPassSchoolB,
      firstName: "Directeur", 
      lastName: "School B",
      role: "directeur",
      schoolId: schoolB.id
    }).returning();

    const [docentB] = await db.insert(users).values({
      username: "docent.schoolb", 
      email: "docent.schoolb@example.com",
      password: hashedPassSchoolB,
      firstName: "Docent",
      lastName: "School B",
      role: "docent",
      schoolId: schoolB.id
    }).returning();

    const [studentB] = await db.insert(users).values({
      username: "student.schoolb",
      email: "student.schoolb@example.com", 
      password: hashedPassSchoolB,
      firstName: "Student",
      lastName: "School B",
      role: "student",
      schoolId: schoolB.id
    }).returning();

    const [ouderB] = await db.insert(users).values({
      username: "ouder.schoolb",
      email: "ouder.schoolb@example.com",
      password: hashedPassSchoolB,
      firstName: "Ouder",
      lastName: "School B", 
      role: "ouder",
      schoolId: schoolB.id
    }).returning();

    // Create some test students
    console.log("🎓 Creating test student records...");
    await db.insert(students).values({
      studentId: "SA001",
      firstName: "Test",
      lastName: "Student A",
      email: "teststudent.a@example.com",
      status: "active",
      schoolId: schoolA.id
    });

    await db.insert(students).values({
      studentId: "SB001", 
      firstName: "Test",
      lastName: "Student B",
      email: "teststudent.b@example.com",
      status: "active",
      schoolId: schoolB.id
    });

    // Create some test teachers
    console.log("👨‍🏫 Creating test teacher records...");
    await db.insert(teachers).values({
      teacherId: "TA001",
      firstName: "Test",
      lastName: "Teacher A",
      email: "testteacher.a@example.com",
      isActive: true,
      schoolId: schoolA.id
    });

    await db.insert(teachers).values({
      teacherId: "TB001",
      firstName: "Test", 
      lastName: "Teacher B",
      email: "testteacher.b@example.com",
      isActive: true,
      schoolId: schoolB.id
    });

    console.log("✅ Test data initialization completed!");
    console.log("\n📋 Test Accounts:");
    console.log("🔧 Superadmin: superadmin@example.com / admin123");
    console.log("🏫 School A:");
    console.log("  👤 Directeur: directeur.schoola@example.com / pass123");
    console.log("  👨‍🏫 Docent: docent.schoola@example.com / pass123");
    console.log("  🎓 Student: student.schoola@example.com / pass123");
    console.log("  👨‍👩‍👧‍👦 Ouder: ouder.schoola@example.com / pass123");
    console.log("🏫 School B:");
    console.log("  👤 Directeur: directeur.schoolb@example.com / pass123");
    console.log("  👨‍🏫 Docent: docent.schoolb@example.com / pass123");
    console.log("  🎓 Student: student.schoolb@example.com / pass123");
    console.log("  👨‍👩‍👧‍👦 Ouder: ouder.schoolb@example.com / pass123");

  } catch (error) {
    console.error("❌ Error initializing test data:", error);
    throw error;
  }
}