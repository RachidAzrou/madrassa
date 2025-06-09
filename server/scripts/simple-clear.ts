import { db } from '../db';
import { sql } from 'drizzle-orm';

async function clearAllData() {
  console.log("🧹 Clearing all mock data from database...");
  
  try {
    // Simple approach: clear all tables with raw SQL to avoid dependency issues
    await db.execute(sql`
      -- Disable foreign key checks temporarily
      SET session_replication_role = replica;
      
      -- Clear all data from tables (keeping structure)
      TRUNCATE TABLE academic_progress CASCADE;
      TRUNCATE TABLE assessments CASCADE;
      TRUNCATE TABLE attendance CASCADE;
      TRUNCATE TABLE behavior_assessments CASCADE;
      TRUNCATE TABLE calendar_events CASCADE;
      TRUNCATE TABLE courses CASCADE;
      TRUNCATE TABLE discount_applications CASCADE;
      TRUNCATE TABLE discount_types CASCADE;
      TRUNCATE TABLE discounts CASCADE;
      TRUNCATE TABLE enrollments CASCADE;
      TRUNCATE TABLE events CASCADE;
      TRUNCATE TABLE examinations CASCADE;
      TRUNCATE TABLE fee_discounts CASCADE;
      TRUNCATE TABLE fee_settings CASCADE;
      TRUNCATE TABLE fees CASCADE;
      TRUNCATE TABLE grades CASCADE;
      TRUNCATE TABLE guardians CASCADE;
      TRUNCATE TABLE invoices CASCADE;
      TRUNCATE TABLE lessons CASCADE;
      TRUNCATE TABLE messages CASCADE;
      TRUNCATE TABLE notifications CASCADE;
      TRUNCATE TABLE payments CASCADE;
      TRUNCATE TABLE program_teachers CASCADE;
      TRUNCATE TABLE programs CASCADE;
      TRUNCATE TABLE re_enrollments CASCADE;
      TRUNCATE TABLE rooms CASCADE;
      TRUNCATE TABLE schedules CASCADE;
      TRUNCATE TABLE school_holidays CASCADE;
      TRUNCATE TABLE student_discounts CASCADE;
      TRUNCATE TABLE student_group_enrollments CASCADE;
      TRUNCATE TABLE student_groups CASCADE;
      TRUNCATE TABLE student_guardians CASCADE;
      TRUNCATE TABLE student_programs CASCADE;
      TRUNCATE TABLE student_siblings CASCADE;
      TRUNCATE TABLE students CASCADE;
      TRUNCATE TABLE teacher_attendance CASCADE;
      TRUNCATE TABLE teacher_availability CASCADE;
      TRUNCATE TABLE teacher_course_assignments CASCADE;
      TRUNCATE TABLE teacher_languages CASCADE;
      TRUNCATE TABLE teachers CASCADE;
      TRUNCATE TABLE tuition_fees CASCADE;
      TRUNCATE TABLE tuition_rates CASCADE;
      TRUNCATE TABLE user_accounts CASCADE;
      
      -- Keep admin user but clear others
      DELETE FROM users WHERE email != 'admin@mymadrassa.nl';
      
      -- Re-enable foreign key checks
      SET session_replication_role = DEFAULT;
    `);
    
    console.log("✅ All mock data successfully cleared!");
    console.log("💡 The database is now clean and ready for real data");
    console.log("ℹ️  Admin user (admin@mymadrassa.nl) has been preserved");
    
  } catch (error) {
    console.error("❌ Error clearing data:", error);
    throw error;
  }
}

// Run the clear function
clearAllData()
  .then(() => {
    console.log("✅ Data clearing completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Data clearing failed:", error);
    process.exit(1);
  });