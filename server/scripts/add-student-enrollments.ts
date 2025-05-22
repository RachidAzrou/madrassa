import { db } from "../db";
import { studentGroupEnrollments } from "../../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Adding student enrollments for demo...");

  try {
    // Direct SQL approach to add student enrollments
    await db.execute(`
      INSERT INTO student_group_enrollments (student_id, group_id, enrollment_date, status, notes)
      VALUES 
      (7, 1, '2025-08-15', 'Actief', 'Toegevoegd aan Arabisch Basis Groep 1'),
      (8, 1, '2025-08-10', 'Actief', 'Toegevoegd aan Arabisch Basis Groep 1'),
      (9, 2, '2025-08-20', 'Actief', 'Toegevoegd aan Arabisch Gevorderd Groep 1'),
      (10, 1, '2025-08-05', 'Actief', 'Toegevoegd aan Arabisch Basis Groep 1'),
      (11, 2, '2025-07-28', 'Actief', 'Toegevoegd aan Arabisch Gevorderd Groep 1'),
      (12, 3, '2025-08-12', 'Actief', 'Toegevoegd aan Koranrecitatie Groep 1'),
      (13, 4, '2025-08-07', 'Actief', 'Toegevoegd aan Islamitische Ethiek Groep 1'),
      (14, 3, '2025-08-14', 'Actief', 'Toegevoegd aan Koranrecitatie Groep 1')
      ON CONFLICT (student_id, group_id) DO NOTHING;
    `);
    
    // Verify the enrollments were added
    const allEnrollments = await db.select().from(studentGroupEnrollments);
    console.log("Current student enrollments:", allEnrollments);

    console.log("Student enrollments added successfully!");
  } catch (error) {
    console.error("Error adding student enrollments:", error);
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