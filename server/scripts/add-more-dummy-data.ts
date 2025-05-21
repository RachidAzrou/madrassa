import { db } from "../db";
import { 
  attendance, 
  teacherAttendance, 
  lessons, 
  events,
  grades,
  assessments,
  examinations
} from "../../shared/schema";

async function main() {
  console.log("Adding more dummy data for calendar, attendance, and grading...");

  // Voeg lessen toe
  const lessonsData = [
    {
      title: "Introductie tot Arabische Grammatica",
      description: "Eerste les voor de basis grammatica",
      date: "2025-09-06", // Gebruik string formaat voor datums
      startTime: "10:00",
      endTime: "11:30",
      teacherId: 1, // Mohammed Youssef
      courseId: 1, // Arabische Grammatica
      studentGroupId: 1, // Arabisch Basis Groep 1
      roomId: 1, // Klaslokaal 1 (zal automatisch toegevoegd worden)
      lessonType: "regular",
      notes: "Introductie, kennismaking en eerste grammaticaregels",
      status: "scheduled"
    },
    {
      title: "Arabische Werkwoorden",
      description: "Uitleg over reguliere werkwoorden",
      date: new Date("2025-09-13T10:00:00Z"),
      startTime: "10:00",
      endTime: "11:30",
      teacherId: 1, // Mohammed Youssef
      courseId: 1, // Arabische Grammatica
      studentGroupId: 1, // Arabisch Basis Groep 1
      roomId: 1, // Klaslokaal 1
      lessonType: "regular",
      notes: "Focus op basiswerkwoorden en conjugatie",
      status: "scheduled"
    },
    {
      title: "Arabische Woordenschat: Familie",
      description: "Woordenschat rondom familie en relaties",
      date: new Date("2025-09-06T13:00:00Z"),
      startTime: "13:00",
      endTime: "14:30",
      teacherId: 1, // Mohammed Youssef
      courseId: 2, // Arabische Woordenschat
      studentGroupId: 1, // Arabisch Basis Groep 1
      roomId: 2, // Klaslokaal 2
      lessonType: "regular",
      notes: "Woorden gerelateerd aan familie, oefeningen en rollenspel",
      status: "scheduled"
    },
    {
      title: "Gevorderde conversatietechnieken",
      description: "Verbeter je conversatievaardigheden",
      date: new Date("2025-09-06T13:00:00Z"),
      startTime: "13:00",
      endTime: "14:30",
      teacherId: 1, // Mohammed Youssef
      courseId: 3, // Arabische Conversatie
      studentGroupId: 2, // Arabisch Gevorderd Groep 1
      roomId: 3, // Klaslokaal 3
      lessonType: "regular",
      notes: "Discussie over actuele onderwerpen in het Arabisch",
      status: "scheduled"
    },
    {
      title: "Introductie tot Islamitische Ethiek",
      description: "Eerste les Islamitische Ethiek",
      date: new Date("2025-09-07T10:00:00Z"),
      startTime: "10:00",
      endTime: "11:30",
      teacherId: 4, // Youssef El Mansouri
      courseId: 4, // Islamitische Ethiek
      studentGroupId: 3, // Fiqh Basis Groep 1
      roomId: 4, // Klaslokaal 4
      lessonType: "regular",
      notes: "Introductie tot basisprincipes van islamitische ethiek",
      status: "scheduled"
    },
    {
      title: "Tajweed Basisregels",
      description: "Leer de basis tajweed regels",
      date: new Date("2025-09-07T13:00:00Z"),
      startTime: "13:00",
      endTime: "14:30",
      teacherId: 3, // Aisha Benali
      courseId: 5, // Tajweed Basis
      studentGroupId: 4, // Koran Recitatie Groep 1
      roomId: 5, // Klaslokaal 5
      lessonType: "regular",
      notes: "Inleiding tot tajweed regels en praktische oefeningen",
      status: "scheduled"
    }
  ];

  console.log("Adding lessons...");
  for (const lesson of lessonsData) {
    await db.insert(lessons).values(lesson).onConflictDoNothing();
  }

  // Voeg evenementen toe
  const eventsData = [
    {
      title: "Ouderavond",
      description: "Informatieavond voor ouders",
      startDate: new Date("2025-09-20T19:00:00Z"),
      endDate: new Date("2025-09-20T21:00:00Z"),
      location: "Hoofdgebouw, Aula",
      eventType: "parent_meeting",
      isWholeDay: false,
      notes: "Presentatie van curriculum en kennismaking met docenten",
      isPublic: true
    },
    {
      title: "Eid al-Adha viering",
      description: "Schoolviering voor Eid al-Adha",
      startDate: new Date("2025-10-15"),
      endDate: new Date("2025-10-15"),
      location: "Schoolplein",
      eventType: "celebration",
      isWholeDay: true,
      notes: "Feestelijke activiteiten en gezamenlijke maaltijd",
      isPublic: true
    },
    {
      title: "Arabische Cultuur Workshop",
      description: "Workshop over Arabische cultuur en tradities",
      startDate: new Date("2025-09-27T13:00:00Z"),
      endDate: new Date("2025-09-27T16:00:00Z"),
      location: "Activiteitenruimte",
      eventType: "workshop",
      isWholeDay: false,
      notes: "Gastspreker uit Marokko",
      isPublic: true
    },
    {
      title: "Docententraining",
      description: "Professionele ontwikkeling voor docenten",
      startDate: new Date("2025-09-15T09:00:00Z"),
      endDate: new Date("2025-09-15T15:00:00Z"),
      location: "Docentenkamer",
      eventType: "training",
      isWholeDay: false,
      notes: "Training over moderne onderwijsmethoden",
      isPublic: false
    }
  ];

  console.log("Adding events...");
  for (const event of eventsData) {
    await db.insert(events).values(event).onConflictDoNothing();
  }

  // Voeg aanwezigheid toe voor studenten
  // We gebruiken de eerste les als basis
  const attendanceData = [
    { 
      studentId: 1, // Youssef El Hamdi
      lessonId: 1, 
      date: new Date("2025-09-06"),
      status: "present",
      arrivalTime: "09:55", 
      notes: "Op tijd en goed voorbereid"
    },
    { 
      studentId: 2, // Fatima Amrani
      lessonId: 1, 
      date: new Date("2025-09-06"),
      status: "present",
      arrivalTime: "10:05", 
      notes: "5 minuten te laat, had moeite met vervoer"
    },
    { 
      studentId: 3, // Ibrahim El Khatib
      lessonId: 4, 
      date: new Date("2025-09-06"),
      status: "present",
      arrivalTime: "12:55", 
      notes: "Goed voorbereid, had huiswerk af"
    },
    { 
      studentId: 4, // Noor Azzaoui
      lessonId: 1, 
      date: new Date("2025-09-06"),
      status: "absent",
      notes: "Ziek gemeld door ouders"
    },
    { 
      studentId: 5, // Ahmed Benali
      lessonId: 4,  
      date: new Date("2025-09-06"),
      status: "present",
      arrivalTime: "13:10", 
      notes: "Te laat, geen reden opgegeven"
    }
  ];
  
  console.log("Adding student attendance...");
  for (const record of attendanceData) {
    await db.insert(attendance).values(record).onConflictDoNothing();
  }

  // Voeg aanwezigheid toe voor docenten
  const teacherAttendanceData = [
    { 
      teacherId: 1, // Mohammed Youssef
      date: new Date("2025-09-06"),
      lessonId: 1,
      status: "present",
      arrivalTime: "09:30", 
      departureTime: "11:45",
      notes: "Goed voorbereid, alle materialen klaar"
    },
    { 
      teacherId: 1, // Mohammed Youssef
      date: new Date("2025-09-06"),
      lessonId: 3,
      status: "present",
      arrivalTime: "12:45", 
      departureTime: "14:45",
      notes: "Tweede les van de dag"
    },
    { 
      teacherId: 3, // Aisha Benali
      date: new Date("2025-09-07"),
      lessonId: 6,
      status: "present",
      arrivalTime: "12:30", 
      departureTime: "15:00",
      notes: "Extra tijd besteed aan individuele hulp na de les"
    }
  ];
  
  console.log("Adding teacher attendance...");
  for (const record of teacherAttendanceData) {
    await db.insert(teacherAttendance).values(record).onConflictDoNothing();
  }

  // Voeg examens toe
  const examinationsData = [
    {
      title: "Proefexamen Arabische Grammatica",
      description: "Eerste toets over basisbegrippen",
      courseId: 1, // Arabische Grammatica
      date: new Date("2025-09-27T10:00:00Z"),
      duration: 60, // in minuten
      maxScore: 100,
      location: "Klaslokaal 1",
      examType: "written",
      isPublished: true,
      academicYear: "2025-2026"
    },
    {
      title: "Mondeling Examen Woordenschat",
      description: "Mondelinge toets over familie-gerelateerde woorden",
      courseId: 2, // Arabische Woordenschat
      date: new Date("2025-09-27T13:00:00Z"),
      duration: 15, // in minuten per student
      maxScore: 50,
      location: "Taallokaal",
      examType: "oral",
      isPublished: true,
      academicYear: "2025-2026"
    },
    {
      title: "Halfjaarlijkse Evaluatie Fiqh",
      description: "Theoretische toets over ethische principes",
      courseId: 4, // Islamitische Ethiek
      date: new Date("2025-10-15T10:00:00Z"),
      duration: 90, // in minuten
      maxScore: 100,
      location: "Klaslokaal 4",
      examType: "written",
      isPublished: false, // nog niet gepubliceerd
      academicYear: "2025-2026"
    }
  ];

  console.log("Adding examinations...");
  for (const exam of examinationsData) {
    await db.insert(examinations).values(exam).onConflictDoNothing();
  }

  // Voeg beoordelingen toe
  const assessmentsData = [
    {
      title: "Huiswerk - Arabische werkwoorden",
      description: "Oefeningen over regelmatige werkwoorden",
      courseId: 1, // Arabische Grammatica
      date: new Date("2025-09-13"),
      maxScore: 20,
      weight: 1.0,
      assessmentType: "homework",
      deadline: new Date("2025-09-20"),
      isPublished: true
    },
    {
      title: "Klasopdracht - Conversatie",
      description: "Dialoog voeren in het Arabisch",
      courseId: 3, // Arabische Conversatie
      date: new Date("2025-09-13"),
      maxScore: 30,
      weight: 1.5,
      assessmentType: "classwork",
      isPublished: true
    },
    {
      title: "Project - Islamitische ethiek in het dagelijks leven",
      description: "Onderzoeksproject en presentatie",
      courseId: 4, // Islamitische Ethiek
      date: new Date("2025-09-21"),
      maxScore: 50,
      weight: 2.0,
      assessmentType: "project",
      deadline: new Date("2025-10-12"),
      isPublished: true
    }
  ];

  console.log("Adding assessments...");
  for (const assessment of assessmentsData) {
    await db.insert(assessments).values(assessment).onConflictDoNothing();
  }

  // Voeg cijfers toe voor studenten
  const gradesData = [
    {
      studentId: 1, // Youssef El Hamdi
      assessmentId: 1, // Huiswerk - Arabische werkwoorden
      score: 17, // van 20
      comments: "Goed werk, kleine fouten in vervoegingen",
      isPublished: true,
      gradedBy: 1, // Mohammed Youssef
      gradedDate: new Date("2025-09-22")
    },
    {
      studentId: 2, // Fatima Amrani
      assessmentId: 1, // Huiswerk - Arabische werkwoorden
      score: 19, // van 20
      comments: "Uitstekend werk, zeer nauwkeurig",
      isPublished: true,
      gradedBy: 1, // Mohammed Youssef
      gradedDate: new Date("2025-09-22")
    },
    {
      studentId: 3, // Ibrahim El Khatib
      assessmentId: 2, // Klasopdracht - Conversatie
      score: 25, // van 30
      comments: "Goede vloeiendheid, kan vocabulaire verbeteren",
      isPublished: true,
      gradedBy: 1, // Mohammed Youssef
      gradedDate: new Date("2025-09-13")
    },
    {
      studentId: 6, // Amina El Mouden
      assessmentId: 3, // Project - Islamitische ethiek
      score: 45, // van 50
      comments: "Uitstekende presentatie, diepgaand onderzoek",
      isPublished: true,
      gradedBy: 4, // Youssef El Mansouri
      gradedDate: new Date("2025-10-15")
    }
  ];

  console.log("Adding grades...");
  for (const grade of gradesData) {
    await db.insert(grades).values(grade).onConflictDoNothing();
  }

  console.log("Additional dummy data added successfully!");
}

main()
  .catch((e) => {
    console.error("Error adding more dummy data:", e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });