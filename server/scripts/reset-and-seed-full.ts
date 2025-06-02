import { db } from "../db";
import { 
  students, 
  guardians, 
  studentGuardians, 
  teachers, 
  studentGroups, 
  studentGroupEnrollments,
  courses,
  programs,
  teacherCourseAssignments,
  studentSiblings
} from "../../shared/schema";

async function resetAndSeedDatabase() {
  console.log("🔄 Database reset en volledige data seed gestart...");

  try {
    // 1. Verwijder alle bestaande data
    console.log("🗑️  Verwijderen bestaande data...");
    await db.delete(studentSiblings);
    await db.delete(teacherCourseAssignments);
    await db.delete(studentGroupEnrollments);
    await db.delete(studentGuardians);
    await db.delete(students);
    await db.delete(guardians);
    await db.delete(teachers);
    await db.delete(courses);
    await db.delete(studentGroups);
    await db.delete(programs);

    console.log("✅ Bestaande data verwijderd");

    // 2. Voeg programma's toe
    console.log("📚 Toevoegen programma's...");
    const programsData = [
      {
        name: "Arabische Taal en Literatuur",
        code: "ARL-2024",
        description: "Uitgebreide studie van de Arabische taal, grammatica, en klassieke literatuur. Inclusief moderne Arabische dialects en poëzie.",
        duration: 2,
        department: "Taalonderwijs",
        isActive: true
      },
      {
        name: "Koran Studies en Tafsir",
        code: "KST-2024", 
        description: "Diepgaande studie van de Heilige Koran, exegese, recitatie-technieken en interpretaties door klassieke geleerden.",
        duration: 3,
        department: "Islamitische Studies",
        isActive: true
      },
      {
        name: "Islamitische Jurisprudentie (Fiqh)",
        code: "IJF-2024",
        description: "Studie van islamitische rechtsleer, handelingsrichtlijnen voor het dagelijks leven en vergelijkende jurisprudentie.",
        duration: 2,
        department: "Islamitische Studies", 
        isActive: true
      },
      {
        name: "Hadith Studies",
        code: "HDS-2024",
        description: "Studie van de overgeleverde uitspraken en handelingen van Profeet Mohammed (vzmh), inclusief authenticiteitsonderzoek.",
        duration: 2,
        department: "Islamitische Studies",
        isActive: true
      }
    ];

    const insertedPrograms = await db.insert(programs).values(programsData).returning();
    console.log(`✅ ${insertedPrograms.length} programma's toegevoegd`);

    // 3. Voeg vakken toe
    console.log("📖 Toevoegen vakken...");
    const coursesData = [
      {
        name: "Arabische Grammatica Basis",
        code: "AGB-101",
        description: "Fundamenten van Arabische grammatica, werkwoorden, zelfstandige naamwoorden en zinsbouw.",
        credits: 6,
        semester: "Semester 1",
        programId: insertedPrograms[0].id,
        isActive: true,
        prerequisites: null
      },
      {
        name: "Koran Recitatie (Tajweed)",
        code: "KRT-101", 
        description: "Correcte uitspraak en recitatie van de Koran volgens de regels van Tajweed.",
        credits: 4,
        semester: "Semester 1",
        programId: insertedPrograms[1].id,
        isActive: true,
        prerequisites: null
      },
      {
        name: "Islamitische Geschiedenis",
        code: "IGS-201",
        description: "Geschiedenis van de Islam vanaf de profetische periode tot de moderne tijd.",
        credits: 5,
        semester: "Semester 2", 
        programId: insertedPrograms[1].id,
        isActive: true,
        prerequisites: null
      },
      {
        name: "Fiqh al-Ibadat (Gebedsrecht)",
        code: "FIB-101",
        description: "Islamitische voorschriften betreffende gebed, rituele reiniging en andere erediensten.",
        credits: 4,
        semester: "Semester 1",
        programId: insertedPrograms[2].id,
        isActive: true,
        prerequisites: null
      },
      {
        name: "Hadith Methodologie",
        code: "HMT-201",
        description: "Wetenschappelijke methoden voor het beoordelen van de authenticiteit van Hadith overlevering.",
        credits: 5,
        semester: "Semester 2",
        programId: insertedPrograms[3].id,
        isActive: true,
        prerequisites: null
      }
    ];

    const insertedCourses = await db.insert(courses).values(coursesData).returning();
    console.log(`✅ ${insertedCourses.length} vakken toegevoegd`);

    // 4. Voeg studentgroepen/klassen toe
    console.log("🏫 Toevoegen klassen...");
    const studentGroupsData = [
      {
        name: "Klas 1A",
        description: "Beginners Arabische taal en basis Islamitische studies",
        academicYear: "2024-2025",
        maxStudents: 25,
        currentStudents: 0,
        isActive: true
      },
      {
        name: "Klas 1B", 
        description: "Beginners Koran studies en Tajweed",
        academicYear: "2024-2025",
        maxStudents: 20,
        currentStudents: 0,
        isActive: true
      },
      {
        name: "Klas 2A",
        description: "Gevorderden Arabische grammatica en literatuur",
        academicYear: "2024-2025", 
        maxStudents: 22,
        currentStudents: 0,
        isActive: true
      },
      {
        name: "Klas 2B",
        description: "Gevorderden Fiqh en Hadith studies",
        academicYear: "2024-2025",
        maxStudents: 18,
        currentStudents: 0,
        isActive: true
      }
    ];

    const insertedGroups = await db.insert(studentGroups).values(studentGroupsData).returning();
    console.log(`✅ ${insertedGroups.length} klassen toegevoegd`);

    // 5. Voeg docenten toe
    console.log("👩‍🏫 Toevoegen docenten...");
    const teachersData = [
      {
        teacherId: "DOC-001",
        firstName: "Ahmed",
        lastName: "Al-Mansouri", 
        email: "ahmed.almansouri@mymadrassa.be",
        phone: "03 234 56 78",
        dateOfBirth: "1975-03-15",
        address: "Turnhoutsebaan 142, 2140 Borgerhout",
        street: "Turnhoutsebaan",
        houseNumber: "142",
        postalCode: "2140",
        city: "Borgerhout",
        qualification: "Master Arabische Taal en Literatuur, Universiteit Cairo",
        specialization: "Arabische grammatica en klassieke literatuur",
        experience: 15,
        status: "active",
        hireDate: "2010-09-01",
        salary: 3200.00,
        notes: "Specialist in klassieke Arabische poëzie en moderne onderwijsmethoden",
        gender: "man",
        nationality: "Egyptisch-Belgisch",
        emergencyContact: "Fatima Al-Mansouri - 0478 12 34 56"
      },
      {
        teacherId: "DOC-002", 
        firstName: "Khadija",
        lastName: "Bennani",
        email: "khadija.bennani@mymadrassa.be",
        phone: "09 345 67 89",
        dateOfBirth: "1982-07-22",
        address: "Sint-Michielsplein 8, 9000 Gent", 
        street: "Sint-Michielsplein",
        houseNumber: "8",
        postalCode: "9000",
        city: "Gent",
        qualification: "Master Islamitische Studies, KU Leuven + Ijaza Koran Recitatie",
        specialization: "Koran studies en Tajweed",
        experience: 12,
        status: "active",
        hireDate: "2012-09-01", 
        salary: 3000.00,
        notes: "Gecertificeerd Qari met internationale Tajweed certificering",
        gender: "vrouw",
        nationality: "Marokkaans-Belgisch",
        emergencyContact: "Omar Bennani - 0456 78 90 12"
      },
      {
        teacherId: "DOC-003",
        firstName: "Yusuf",
        lastName: "Al-Shafi'i",
        email: "yusuf.alshafii@mymadrassa.be", 
        phone: "02 456 78 90",
        dateOfBirth: "1978-11-08",
        address: "Chaussée de Louvain 234, 1210 Sint-Joost-ten-Node",
        street: "Chaussée de Louvain", 
        houseNumber: "234",
        postalCode: "1210",
        city: "Sint-Joost-ten-Node",
        qualification: "Doctor Islamitische Jurisprudentie, Al-Azhar Universiteit",
        specialization: "Fiqh en islamitische rechtsleer",
        experience: 18,
        status: "active",
        hireDate: "2008-09-01",
        salary: 3500.00,
        notes: "Deskundige in vergelijkende Fiqh scholen en moderne islamitische ethiek", 
        gender: "man",
        nationality: "Syrisch-Belgisch",
        emergencyContact: "Amina Al-Shafi'i - 0487 65 43 21"
      },
      {
        teacherId: "DOC-004",
        firstName: "Amina",
        lastName: "Idrissi",
        email: "amina.idrissi@mymadrassa.be",
        phone: "04 567 89 01",
        dateOfBirth: "1985-05-14",
        address: "Rue de la Paix 67, 4000 Luik",
        street: "Rue de la Paix",
        houseNumber: "67", 
        postalCode: "4000",
        city: "Luik",
        qualification: "Master Hadith Studies + Pedagogie Diploma",
        specialization: "Hadith wetenschap en islamitische geschiedenis",
        experience: 8,
        status: "active",
        hireDate: "2016-09-01",
        salary: 2800.00,
        notes: "Gespecialiseerd in authenticiteitsbeoordeling van Hadith verzamelingen",
        gender: "vrouw", 
        nationality: "Belgisch",
        emergencyContact: "Hassan Idrissi - 0498 76 54 32"
      }
    ];

    const insertedTeachers = await db.insert(teachers).values(teachersData).returning();
    console.log(`✅ ${insertedTeachers.length} docenten toegevoegd`);

    // 6. Voeg voogden toe
    console.log("👨‍👩‍👧‍👦 Toevoegen voogden...");
    const guardiansData = [
      {
        firstName: "Mohammed",
        lastName: "El Amrani",
        email: "mohammed.elamrani@email.com",
        phone: "0478 123 456",
        address: "Antwerpsestraat 45, 2800 Mechelen",
        street: "Antwerpsestraat", 
        houseNumber: "45",
        postalCode: "2800",
        city: "Mechelen",
        relationship: "Vader",
        occupation: "Software Engineer bij IBM",
        isEmergencyContact: true,
        notes: "Spreekt Arabisch, Nederlands en Frans"
      },
      {
        firstName: "Fatima",
        lastName: "El Amrani", 
        email: "fatima.elamrani@email.com",
        phone: "0456 789 012",
        address: "Antwerpsestraat 45, 2800 Mechelen",
        street: "Antwerpsestraat",
        houseNumber: "45", 
        postalCode: "2800",
        city: "Mechelen",
        relationship: "Moeder",
        occupation: "Verpleegkundige UZ Leuven",
        isEmergencyContact: true,
        notes: "Beschikbaar tijdens werkdagen 8-16u"
      },
      {
        firstName: "Omar",
        lastName: "Benali",
        email: "omar.benali@email.com",
        phone: "0487 654 321",
        address: "Grote Markt 12, 2000 Antwerpen",
        street: "Grote Markt",
        houseNumber: "12",
        postalCode: "2000", 
        city: "Antwerpen",
        relationship: "Vader",
        occupation: "Eigenaar restaurant Al-Andalus",
        isEmergencyContact: true,
        notes: "Werkzaam in de avonduren, best bereikbaar 's ochtends"
      },
      {
        firstName: "Aicha",
        lastName: "Benali",
        email: "aicha.benali@email.com",
        phone: "0498 765 432",
        address: "Grote Markt 12, 2000 Antwerpen", 
        street: "Grote Markt",
        houseNumber: "12",
        postalCode: "2000",
        city: "Antwerpen",
        relationship: "Moeder",
        occupation: "Lerares Nederlandse taal",
        isEmergencyContact: true,
        notes: "Onderwijsachtergrond, helpt graag bij huiswerk"
      },
      {
        firstName: "Hassan",
        lastName: "Yilmaz",
        email: "hassan.yilmaz@email.com",
        phone: "0467 543 210",
        address: "Leopoldstraat 89, 9000 Gent",
        street: "Leopoldstraat",
        houseNumber: "89",
        postalCode: "9000",
        city: "Gent",
        relationship: "Vader", 
        occupation: "Ingenieur bij Volvo Cars",
        isEmergencyContact: true,
        notes: "Reist regelmatig voor werk, partner is primair contact"
      },
      {
        firstName: "Zeynep",
        lastName: "Yilmaz",
        email: "zeynep.yilmaz@email.com",
        phone: "0478 432 109",
        address: "Leopoldstraat 89, 9000 Gent",
        street: "Leopoldstraat",
        houseNumber: "89",
        postalCode: "9000", 
        city: "Gent",
        relationship: "Moeder",
        occupation: "Psychologe in eigen praktijk",
        isEmergencyContact: true,
        notes: "Primair contactpersoon, flexibele werktijden"
      }
    ];

    const insertedGuardians = await db.insert(guardians).values(guardiansData).returning();
    console.log(`✅ ${insertedGuardians.length} voogden toegevoegd`);

    // 7. Voeg studenten toe
    console.log("👨‍🎓 Toevoegen studenten...");
    const studentsData = [
      {
        studentId: "STU-001",
        firstName: "Yusuf", 
        lastName: "El Amrani",
        email: "yusuf.elamrani@student.mymadrassa.be",
        phone: "0456 111 222",
        dateOfBirth: "2008-03-15",
        address: "Antwerpsestraat 45, 2800 Mechelen",
        street: "Antwerpsestraat",
        houseNumber: "45",
        postalCode: "2800",
        city: "Mechelen", 
        status: "ingeschreven",
        enrollmentDate: "2024-09-01",
        notes: "Leergierige student met interesse in Arabische poëzie",
        gender: "man",
        photoUrl: null
      },
      {
        studentId: "STU-002",
        firstName: "Maryam",
        lastName: "Benali",
        email: "maryam.benali@student.mymadrassa.be", 
        phone: "0467 222 333",
        dateOfBirth: "2009-07-22",
        address: "Grote Markt 12, 2000 Antwerpen",
        street: "Grote Markt",
        houseNumber: "12",
        postalCode: "2000",
        city: "Antwerpen",
        status: "ingeschreven",
        enrollmentDate: "2024-09-01",
        notes: "Uitstekende Koran recitatie, deelname aan wedstrijden",
        gender: "vrouw",
        photoUrl: null
      },
      {
        studentId: "STU-003",
        firstName: "Ali",
        lastName: "Benali",
        email: "ali.benali@student.mymadrassa.be",
        phone: "0478 333 444", 
        dateOfBirth: "2010-11-08",
        address: "Grote Markt 12, 2000 Antwerpen",
        street: "Grote Markt",
        houseNumber: "12",
        postalCode: "2000",
        city: "Antwerpen",
        status: "ingeschreven",
        enrollmentDate: "2024-09-01",
        notes: "Broer van Maryam, interesse in islamitische geschiedenis",
        gender: "man",
        photoUrl: null
      },
      {
        studentId: "STU-004",
        firstName: "Zara",
        lastName: "Yilmaz",
        email: "zara.yilmaz@student.mymadrassa.be",
        phone: "0489 444 555",
        dateOfBirth: "2008-12-03",
        address: "Leopoldstraat 89, 9000 Gent",
        street: "Leopoldstraat", 
        houseNumber: "89",
        postalCode: "9000",
        city: "Gent",
        status: "ingeschreven",
        enrollmentDate: "2024-09-01",
        notes: "Tweetalig opgevoed, sterke analytische vaardigheden",
        gender: "vrouw",
        photoUrl: null
      },
      {
        studentId: "STU-005",
        firstName: "Omer",
        lastName: "Yilmaz",
        email: "omer.yilmaz@student.mymadrassa.be",
        phone: "0490 555 666",
        dateOfBirth: "2011-05-18",
        address: "Leopoldstraat 89, 9000 Gent",
        street: "Leopoldstraat",
        houseNumber: "89", 
        postalCode: "9000",
        city: "Gent",
        status: "ingeschreven",
        enrollmentDate: "2024-09-01",
        notes: "Broer van Zara, creatief en artistiek ingesteld",
        gender: "man",
        photoUrl: null
      }
    ];

    const insertedStudents = await db.insert(students).values(studentsData).returning();
    console.log(`✅ ${insertedStudents.length} studenten toegevoegd`);

    // 8. Koppel studenten aan voogden
    console.log("🔗 Koppelen studenten aan voogden...");
    const studentGuardiansData = [
      // Yusuf El Amrani
      { studentId: insertedStudents[0].id, guardianId: insertedGuardians[0].id, relationshipType: "Vader", isPrimary: true },
      { studentId: insertedStudents[0].id, guardianId: insertedGuardians[1].id, relationshipType: "Moeder", isPrimary: false },
      // Maryam Benali
      { studentId: insertedStudents[1].id, guardianId: insertedGuardians[2].id, relationshipType: "Vader", isPrimary: true },
      { studentId: insertedStudents[1].id, guardianId: insertedGuardians[3].id, relationshipType: "Moeder", isPrimary: false },
      // Ali Benali
      { studentId: insertedStudents[2].id, guardianId: insertedGuardians[2].id, relationshipType: "Vader", isPrimary: true },
      { studentId: insertedStudents[2].id, guardianId: insertedGuardians[3].id, relationshipType: "Moeder", isPrimary: false },
      // Zara Yilmaz
      { studentId: insertedStudents[3].id, guardianId: insertedGuardians[4].id, relationshipType: "Vader", isPrimary: true },
      { studentId: insertedStudents[3].id, guardianId: insertedGuardians[5].id, relationshipType: "Moeder", isPrimary: false },
      // Omer Yilmaz
      { studentId: insertedStudents[4].id, guardianId: insertedGuardians[4].id, relationshipType: "Vader", isPrimary: true },
      { studentId: insertedStudents[4].id, guardianId: insertedGuardians[5].id, relationshipType: "Moeder", isPrimary: false }
    ];

    await db.insert(studentGuardians).values(studentGuardiansData);
    console.log(`✅ ${studentGuardiansData.length} student-voogd koppelingen toegevoegd`);

    // 9. Koppel studenten aan klassen
    console.log("🏫 Inschrijven studenten in klassen...");
    const enrollmentsData = [
      { studentId: insertedStudents[0].id, groupId: insertedGroups[0].id, status: "active" },
      { studentId: insertedStudents[1].id, groupId: insertedGroups[1].id, status: "active" },
      { studentId: insertedStudents[2].id, groupId: insertedGroups[0].id, status: "active" },
      { studentId: insertedStudents[3].id, groupId: insertedGroups[2].id, status: "active" },
      { studentId: insertedStudents[4].id, groupId: insertedGroups[1].id, status: "active" }
    ];

    await db.insert(studentGroupEnrollments).values(enrollmentsData);
    console.log(`✅ ${enrollmentsData.length} student inschrijvingen toegevoegd`);

    // 10. Koppel docenten aan vakken
    console.log("👩‍🏫 Toewijzen docenten aan vakken...");
    const teacherAssignmentsData = [
      { teacherId: insertedTeachers[0].id, courseId: insertedCourses[0].id, isPrimary: true, notes: "Hoofddocent Arabische grammatica" },
      { teacherId: insertedTeachers[1].id, courseId: insertedCourses[1].id, isPrimary: true, notes: "Hoofddocent Tajweed en recitatie" },
      { teacherId: insertedTeachers[2].id, courseId: insertedCourses[3].id, isPrimary: true, notes: "Hoofddocent Fiqh" },
      { teacherId: insertedTeachers[3].id, courseId: insertedCourses[4].id, isPrimary: true, notes: "Hoofddocent Hadith methodologie" },
      { teacherId: insertedTeachers[1].id, courseId: insertedCourses[2].id, isPrimary: false, notes: "Ondersteunende docent geschiedenis" }
    ];

    await db.insert(teacherCourseAssignments).values(teacherAssignmentsData);
    console.log(`✅ ${teacherAssignmentsData.length} docent-vak toewijzingen toegevoegd`);

    // 11. Voeg familie relaties toe (broers/zussen)
    console.log("👫 Toevoegen familie relaties...");
    const siblingsData = [
      // Maryam en Ali Benali zijn broer en zus
      { studentId: insertedStudents[1].id, siblingId: insertedStudents[2].id, relationship: "sibling" },
      { studentId: insertedStudents[2].id, siblingId: insertedStudents[1].id, relationship: "sibling" },
      // Zara en Omer Yilmaz zijn broer en zus
      { studentId: insertedStudents[3].id, siblingId: insertedStudents[4].id, relationship: "sibling" },
      { studentId: insertedStudents[4].id, siblingId: insertedStudents[3].id, relationship: "sibling" }
    ];

    await db.insert(studentSiblings).values(siblingsData);
    console.log(`✅ ${siblingsData.length} familie relaties toegevoegd`);

    console.log("\n🎉 Database reset en volledige seed succesvol voltooid!");
    console.log("\n📊 Overzicht toegevoegde data:");
    console.log(`- ${insertedPrograms.length} programma's`);
    console.log(`- ${insertedCourses.length} vakken`);
    console.log(`- ${insertedGroups.length} klassen`);
    console.log(`- ${insertedTeachers.length} docenten`);
    console.log(`- ${insertedGuardians.length} voogden`);
    console.log(`- ${insertedStudents.length} studenten`);
    console.log(`- ${studentGuardiansData.length} student-voogd koppelingen`);
    console.log(`- ${enrollmentsData.length} klas inschrijvingen`);
    console.log(`- ${teacherAssignmentsData.length} docent-vak toewijzingen`);
    console.log(`- ${siblingsData.length} familie relaties\n`);

  } catch (error) {
    console.error("❌ Fout tijdens database reset en seed:", error);
    throw error;
  }
}

// Voer het script uit als het direct wordt aangeroepen
if (import.meta.url === `file://${process.argv[1]}`) {
  resetAndSeedDatabase()
    .then(() => {
      console.log("✅ Script voltooid");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script gefaald:", error);
      process.exit(1);
    });
}

export { resetAndSeedDatabase };