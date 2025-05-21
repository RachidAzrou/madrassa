import { db } from "../db";
import { 
  students, 
  teachers, 
  guardians, 
  studentGuardians, 
  programs, 
  courses,
  studentGroups,
  studentGroupEnrollments
} from "../../shared/schema";

async function main() {
  console.log("Adding dummy data for demo purposes...");

  // Add some programs
  const programsData = [
    {
      name: "Arabisch Basis",
      code: "AR-BASIS",
      description: "Basiscursus Arabisch voor beginners",
      duration: 2,
      department: "Talen",
      isActive: true,
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-06-30"),
      fee: 350,
      notes: "Geschikt voor kinderen van 6-9 jaar oud"
    },
    {
      name: "Arabisch Gevorderd",
      code: "AR-GEV",
      description: "Arabisch voor gevorderde studenten",
      duration: 3,
      department: "Talen",
      isActive: true,
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-06-30"),
      fee: 400,
      notes: "Geschikt voor kinderen van 10-13 jaar oud"
    },
    {
      name: "Fiqh Basis",
      code: "FQ-BASIS",
      description: "Introductie tot islamitische jurisprudentie",
      duration: 1,
      department: "Islamitische Studies",
      isActive: true,
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-06-30"),
      fee: 300,
      notes: "Geschikt voor alle leeftijden"
    },
    {
      name: "Koran Recitatie",
      code: "KR-BASIS",
      description: "Basisvaardigheden voor Koran recitatie",
      duration: 2,
      department: "Koran Studies",
      isActive: true,
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-06-30"),
      fee: 375,
      notes: "Geschikt voor kinderen vanaf 8 jaar"
    }
  ];
  
  console.log("Adding programs...");
  for (const program of programsData) {
    await db.insert(programs).values(program).onConflictDoNothing();
  }

  // Add some courses
  const coursesData = [
    {
      name: "Arabische Grammatica",
      code: "AR-GRAM",
      description: "Studie van Arabische grammatica en zinsbouw",
      programId: 1,
      isActive: true,
      credits: 5,
      hoursPerWeek: 3,
      notes: "Focus op praktische taalvaardigheid"
    },
    {
      name: "Arabische Woordenschat",
      code: "AR-WOORD",
      description: "Uitbreiding van Arabische woordenschat",
      programId: 1,
      isActive: true,
      credits: 4,
      hoursPerWeek: 2,
      notes: "Inclusief dagelijkse taalvaardigheden"
    },
    {
      name: "Arabische Conversatie",
      code: "AR-CONV",
      description: "Praktische conversatievaardigheden in het Arabisch",
      programId: 2,
      isActive: true,
      credits: 5,
      hoursPerWeek: 3,
      notes: "Focus op gesprekstechnieken en uitspraak"
    },
    {
      name: "Islamitische Ethiek",
      code: "FQ-ETH",
      description: "Studie van ethische principes in de islam",
      programId: 3,
      isActive: true,
      credits: 4,
      hoursPerWeek: 2,
      notes: "Inclusief casusstudies en discussies"
    },
    {
      name: "Tajweed Basis",
      code: "KR-TAJ",
      description: "Basisregels voor correcte Koran recitatie",
      programId: 4,
      isActive: true,
      credits: 5,
      hoursPerWeek: 3,
      notes: "Focus op praktische recitatie"
    }
  ];
  
  console.log("Adding courses...");
  for (const course of coursesData) {
    await db.insert(courses).values(course).onConflictDoNothing();
  }

  // Add some student groups
  const studentGroupsData = [
    {
      name: "Arabisch Basis Groep 1",
      description: "Basisgroep Arabisch voor jongere kinderen",
      academicYear: "2025-2026",
      programId: 1,
      isActive: true,
      maxCapacity: 20,
      startDate: new Date("2025-09-06"),
      endDate: new Date("2026-06-20"),
      instructor: "Mohammed Youssef"
    },
    {
      name: "Arabisch Gevorderd Groep 1",
      description: "Gevorderde groep Arabisch",
      academicYear: "2025-2026",
      programId: 2,
      isActive: true,
      maxCapacity: 15,
      startDate: new Date("2025-09-06"),
      endDate: new Date("2026-06-20"),
      instructor: "Fatima Azizi"
    },
    {
      name: "Fiqh Basis Groep 1",
      description: "Basisgroep Fiqh voor alle leeftijden",
      academicYear: "2025-2026",
      programId: 3,
      isActive: true,
      maxCapacity: 25,
      startDate: new Date("2025-09-07"),
      endDate: new Date("2026-06-21"),
      instructor: "Youssef El Mansouri"
    },
    {
      name: "Koran Recitatie Groep 1",
      description: "Basisgroep voor Koran recitatie",
      academicYear: "2025-2026",
      programId: 4,
      isActive: true,
      maxCapacity: 20,
      startDate: new Date("2025-09-07"),
      endDate: new Date("2026-06-21"),
      instructor: "Aisha Benali"
    }
  ];
  
  console.log("Adding student groups...");
  for (const group of studentGroupsData) {
    await db.insert(studentGroups).values(group).onConflictDoNothing();
  }

  // Add some students
  const studentsData = [
    {
      studentId: "ST001",
      firstName: "Youssef",
      lastName: "El Hamdi",
      gender: "man",
      email: "youssef.elhamdi@gmail.com",
      phone: "0489123456",
      dateOfBirth: new Date("2014-05-12"),
      street: "Molenbeekstraat",
      houseNumber: "24",
      postalCode: "1080",
      city: "Brussel",
      isActive: true,
      enrollmentDate: new Date("2025-08-15"),
      notes: "Allergisch voor noten, heeft een EpiPen"
    },
    {
      studentId: "ST002",
      firstName: "Fatima",
      lastName: "Amrani",
      gender: "vrouw",
      email: "famrani@outlook.com",
      phone: "0499456789",
      dateOfBirth: new Date("2015-03-22"),
      street: "Leuvenseweg",
      houseNumber: "56",
      postalCode: "1000",
      city: "Brussel",
      isActive: true,
      enrollmentDate: new Date("2025-08-10"),
      notes: "Goede kennis van Arabisch door tweetalige opvoeding"
    },
    {
      studentId: "ST003",
      firstName: "Ibrahim",
      lastName: "El Khatib",
      gender: "man",
      email: "ibrahim.khatib@gmail.com",
      phone: "0478789123",
      dateOfBirth: new Date("2013-11-08"),
      street: "Antwerpselaan",
      houseNumber: "120",
      postalCode: "2000",
      city: "Antwerpen",
      isActive: true,
      enrollmentDate: new Date("2025-08-20"),
      notes: "Heeft bijles Engels op dinsdag"
    },
    {
      studentId: "ST004",
      firstName: "Noor",
      lastName: "Azzaoui",
      gender: "vrouw",
      email: "noor.azzaoui@hotmail.com",
      phone: "0467234567",
      dateOfBirth: new Date("2016-07-30"),
      street: "Gentsesteenweg",
      houseNumber: "78",
      postalCode: "9000",
      city: "Gent",
      isActive: true,
      enrollmentDate: new Date("2025-08-05"),
      notes: "Zeer creatief, houdt van tekenen"
    },
    {
      studentId: "ST005",
      firstName: "Ahmed",
      lastName: "Benali",
      gender: "man",
      email: "ahmed.benali@gmail.com",
      phone: "0493345678",
      dateOfBirth: new Date("2012-12-15"),
      street: "Turnhoutsebaan",
      houseNumber: "210",
      postalCode: "2140",
      city: "Borgerhout",
      isActive: true,
      enrollmentDate: new Date("2025-07-28"),
      notes: "Heeft interesse in informatica"
    },
    {
      studentId: "ST006",
      firstName: "Amina",
      lastName: "El Mouden",
      gender: "vrouw",
      email: "amina.elmouden@gmail.com",
      phone: "0488567890",
      dateOfBirth: new Date("2014-09-03"),
      street: "Mechelsesteenweg",
      houseNumber: "45",
      postalCode: "2018",
      city: "Antwerpen",
      isActive: true,
      enrollmentDate: new Date("2025-08-12"),
      notes: "Speelt graag sport, vooral basketbal"
    },
    {
      studentId: "ST007",
      firstName: "Omar",
      lastName: "Tahiri",
      gender: "man",
      email: "omar.tahiri@outlook.com",
      phone: "0497654321",
      dateOfBirth: new Date("2015-06-18"),
      street: "Brugstraat",
      houseNumber: "67",
      postalCode: "8000",
      city: "Brugge",
      isActive: true,
      enrollmentDate: new Date("2025-08-07"),
      notes: "Heeft een jongere broer die volgend jaar ook zal starten"
    },
    {
      studentId: "ST008",
      firstName: "Layla",
      lastName: "Bouazizi",
      gender: "vrouw",
      email: "layla.bouazizi@gmail.com",
      phone: "0466987654",
      dateOfBirth: new Date("2013-04-25"),
      street: "Liège Laan",
      houseNumber: "34",
      postalCode: "4000",
      city: "Luik",
      isActive: true,
      enrollmentDate: new Date("2025-08-14"),
      notes: "Tweetalig Nederlands-Frans"
    }
  ];
  
  console.log("Adding students...");
  for (const student of studentsData) {
    await db.insert(students).values(student).onConflictDoNothing();
  }

  // Add some student group enrollments
  const enrollmentsData = [
    { studentId: 1, groupId: 1, enrollmentDate: new Date("2025-08-15") },
    { studentId: 2, groupId: 1, enrollmentDate: new Date("2025-08-10") },
    { studentId: 3, groupId: 2, enrollmentDate: new Date("2025-08-20") },
    { studentId: 4, groupId: 1, enrollmentDate: new Date("2025-08-05") },
    { studentId: 5, groupId: 2, enrollmentDate: new Date("2025-07-28") },
    { studentId: 6, groupId: 3, enrollmentDate: new Date("2025-08-12") },
    { studentId: 7, groupId: 4, enrollmentDate: new Date("2025-08-07") },
    { studentId: 8, groupId: 3, enrollmentDate: new Date("2025-08-14") }
  ];
  
  console.log("Adding student group enrollments...");
  for (const enrollment of enrollmentsData) {
    await db.insert(studentGroupEnrollments).values(enrollment).onConflictDoNothing();
  }

  // Add some guardians
  const guardiansData = [
    {
      firstName: "Mohammed",
      lastName: "El Hamdi",
      gender: "man",
      relationship: "vader",
      email: "m.elhamdi@gmail.com",
      phone: "0489111222",
      street: "Molenbeekstraat",
      houseNumber: "24",
      postalCode: "1080",
      city: "Brussel",
      isEmergencyContact: true,
      isFinancialResponsible: true,
      profession: "Software engineer",
      notes: "Werkt in shifts, bereikbaar na 16u"
    },
    {
      firstName: "Rachida",
      lastName: "Amrani",
      gender: "vrouw",
      relationship: "moeder",
      email: "r.amrani@outlook.com",
      phone: "0499333444",
      street: "Leuvenseweg",
      houseNumber: "56",
      postalCode: "1000",
      city: "Brussel",
      isEmergencyContact: true,
      isFinancialResponsible: false,
      profession: "Verpleegster",
      notes: "Werkt in UZ Brussel, wisselende diensten"
    },
    {
      firstName: "Ahmed",
      lastName: "El Khatib",
      gender: "man",
      relationship: "vader",
      email: "a.elkhatib@gmail.com",
      phone: "0478555666",
      street: "Antwerpselaan",
      houseNumber: "120",
      postalCode: "2000",
      city: "Antwerpen",
      isEmergencyContact: true,
      isFinancialResponsible: true,
      profession: "Accountant",
      notes: "Kan helpen met financiële administratie"
    },
    {
      firstName: "Fatima",
      lastName: "Azzaoui",
      gender: "vrouw",
      relationship: "moeder",
      email: "f.azzaoui@hotmail.com",
      phone: "0467777888",
      street: "Gentsesteenweg",
      houseNumber: "78",
      postalCode: "9000",
      city: "Gent",
      isEmergencyContact: true,
      isFinancialResponsible: true,
      profession: "Lerares",
      notes: "Werkt op een basisschool in Gent"
    },
    {
      firstName: "Karim",
      lastName: "Benali",
      gender: "man",
      relationship: "vader",
      email: "k.benali@gmail.com",
      phone: "0493999000",
      street: "Turnhoutsebaan",
      houseNumber: "210",
      postalCode: "2140",
      city: "Borgerhout",
      isEmergencyContact: false,
      isFinancialResponsible: true,
      profession: "Zelfstandige",
      notes: "Eigen restaurant in Antwerpen"
    },
    {
      firstName: "Yasmine",
      lastName: "El Mouden",
      gender: "vrouw",
      relationship: "moeder",
      email: "y.elmouden@gmail.com",
      phone: "0488112233",
      street: "Mechelsesteenweg",
      houseNumber: "45",
      postalCode: "2018",
      city: "Antwerpen",
      isEmergencyContact: true,
      isFinancialResponsible: false,
      profession: "Juriste",
      notes: "Kan juridisch advies geven wanneer nodig"
    }
  ];
  
  console.log("Adding guardians...");
  for (const guardian of guardiansData) {
    await db.insert(guardians).values(guardian).onConflictDoNothing();
  }

  // Link guardians to students
  const guardianLinksData = [
    { studentId: 1, guardianId: 1 },  // Youssef's father
    { studentId: 2, guardianId: 2 },  // Fatima's mother
    { studentId: 3, guardianId: 3 },  // Ibrahim's father
    { studentId: 4, guardianId: 4 },  // Noor's mother
    { studentId: 5, guardianId: 5 },  // Ahmed's father
    { studentId: 6, guardianId: 6 },  // Amina's mother
    // Add some secondary guardians
    { studentId: 1, guardianId: 2 },  // Youssef's second guardian
    { studentId: 3, guardianId: 4 },  // Ibrahim's second guardian
  ];
  
  console.log("Linking guardians to students...");
  for (const link of guardianLinksData) {
    await db.insert(studentGuardians).values(link).onConflictDoNothing();
  }

  // Add some teachers
  const teachersData = [
    {
      teacherId: "TCH001",
      firstName: "Mohammed",
      lastName: "Youssef",
      gender: "man",
      email: "myoussef@mymadrassa.nl",
      phone: "0612345678",
      dateOfBirth: new Date("1975-05-15"),
      street: "Moskeelaan",
      houseNumber: "15",
      postalCode: "1066 KB",
      city: "Amsterdam",
      isActive: true,
      hireDate: new Date("2024-01-15"),
      notes: "Expert in klassiek Arabisch met 15 jaar onderwijservaring",
    },
    {
      teacherId: "TCH002",
      firstName: "Aisha",
      lastName: "Benali",
      gender: "vrouw",
      email: "abenali@mymadrassa.nl",
      phone: "0623456789",
      dateOfBirth: new Date("1982-09-23"),
      street: "Islamitische Straat",
      houseNumber: "42",
      postalCode: "1010 AB",
      city: "Amsterdam",
      isActive: true,
      hireDate: new Date("2024-02-01"),
      notes: "Gespecialiseerd in Koran recitatie en tajweed",
    },
    {
      teacherId: "TCH003",
      firstName: "Youssef",
      lastName: "El Mansouri",
      gender: "man",
      email: "yelmansouri@mymadrassa.nl",
      phone: "0634567890",
      dateOfBirth: new Date("1978-12-10"),
      street: "Koranweg",
      houseNumber: "78",
      postalCode: "3045 CA",
      city: "Rotterdam",
      isActive: true,
      hireDate: new Date("2024-01-20"),
      notes: "Docent Fiqh met achtergrond in islamitische jurisprudentie",
    },
    {
      teacherId: "TCH004",
      firstName: "Fatima",
      lastName: "Azizi",
      gender: "vrouw",
      email: "fazizi@mymadrassa.nl",
      phone: "0645678901",
      dateOfBirth: new Date("1985-03-18"),
      street: "Madrassalaan",
      houseNumber: "25",
      postalCode: "5611 DM",
      city: "Eindhoven",
      isActive: true,
      hireDate: new Date("2024-03-01"),
      notes: "Gespecialiseerd in onderwijs aan jonge kinderen",
    }
  ];
  
  console.log("Adding teachers...");
  for (const teacher of teachersData) {
    await db.insert(teachers).values(teacher).onConflictDoNothing();
  }

  console.log("Dummy data added successfully!");
}

main()
  .catch((e) => {
    console.error("Error adding dummy data:", e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });