import { db } from "../db";
import { studentGroupEnrollments } from "../../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Adding new student group enrollments...");

  try {
    // Add new enrollments for our students if they don't exist yet
    const enrollmentData = [
      { studentId: 7, groupId: 1, enrollmentDate: new Date('2025-08-15'), status: 'Actief', notes: 'Toegevoegd aan Arabisch Basis Groep 1' },
      { studentId: 8, groupId: 1, enrollmentDate: new Date('2025-08-10'), status: 'Actief', notes: 'Toegevoegd aan Arabisch Basis Groep 1' },
      { studentId: 9, groupId: 2, enrollmentDate: new Date('2025-08-20'), status: 'Actief', notes: 'Toegevoegd aan Arabisch Gevorderd Groep 1' },
      { studentId: 10, groupId: 1, enrollmentDate: new Date('2025-08-05'), status: 'Actief', notes: 'Toegevoegd aan Arabisch Basis Groep 1' },
      { studentId: 11, groupId: 2, enrollmentDate: new Date('2025-07-28'), status: 'Actief', notes: 'Toegevoegd aan Arabisch Gevorderd Groep 1' },
      { studentId: 12, groupId: 3, enrollmentDate: new Date('2025-08-12'), status: 'Actief', notes: 'Toegevoegd aan Koranrecitatie Groep 1' },
      { studentId: 13, groupId: 4, enrollmentDate: new Date('2025-08-07'), status: 'Actief', notes: 'Toegevoegd aan Islamitische Ethiek Groep 1' },
      { studentId: 14, groupId: 3, enrollmentDate: new Date('2025-08-14'), status: 'Actief', notes: 'Toegevoegd aan Koranrecitatie Groep 1' }
    ];
    
    // For each enrollment data, check if it exists already
    for (const data of enrollmentData) {
      const existing = await db.select().from(studentGroupEnrollments)
        .where(eq(studentGroupEnrollments.studentId, data.studentId))
        .where(eq(studentGroupEnrollments.groupId, data.groupId));
      
      // If no existing enrollment found, insert a new one
      if (existing.length === 0) {
        await db.insert(studentGroupEnrollments).values(data);
        console.log(`Added enrollment for student ${data.studentId} to group ${data.groupId}`);
      } else {
        console.log(`Enrollment for student ${data.studentId} in group ${data.groupId} already exists`);
      }
    }
    
    // Check all enrollments
    const updatedEnrollments = await db.select().from(studentGroupEnrollments);
    console.log("All enrollments:", updatedEnrollments);

    console.log("Student group enrollments updated successfully!");
  } catch (error) {
    console.error("Error updating student enrollments:", error);
  }
}

main()
  .catch((e) => {
    console.error("Error in main function:", e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });