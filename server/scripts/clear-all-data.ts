import { db } from '../db';
import { ne } from 'drizzle-orm';
import { 
  users,
  programs,
  courses,
  teachers,
  students,
  guardians,
  studentGroups,
  studentGroupEnrollments,
  studentGuardians,
  teacherCourseAssignments,
  academicYears,
  schoolHolidays,
  studentSiblings,
  attendance,
  teacherAttendance,
  grades,
  messages,
  notifications,
  fees,
  discounts,
  studentDiscounts,
  invoices,
  payments,
  tuitionFees,
  tuitionRates,
  discountApplications,
  discountTypes,
  calendarEvents,
  rooms,
  lessons,
  examinations,
  assessments,
  behaviorAssessments,
  events,
  schedules,
  feeDiscounts,
  feeSettings,
  reEnrollments,
  academicProgress,
  userAccounts,
  studentPrograms,
  programTeachers,
  enrollments,
  teacherAvailability,
  teacherLanguages
} from '../../shared/schema';

async function clearAllData() {
  console.log("🧹 Clearing all data from database...");
  
  try {
    // Clear in reverse dependency order to avoid foreign key constraints
    
    // Clear assessment and academic tracking data
    await db.delete(behaviorAssessments);
    console.log("✅ Behavior assessments cleared");
    
    await db.delete(assessments);
    console.log("✅ Assessments cleared");
    
    await db.delete(academicProgress);
    console.log("✅ Academic progress cleared");
    
    await db.delete(reEnrollments);
    console.log("✅ Re-enrollments cleared");
    
    // Clear financial data
    await db.delete(payments);
    console.log("✅ Payments cleared");
    
    await db.delete(invoices);
    console.log("✅ Invoices cleared");
    
    await db.delete(discountApplications);
    console.log("✅ Discount applications cleared");
    
    await db.delete(studentDiscounts);
    console.log("✅ Student discounts cleared");
    
    await db.delete(discounts);
    console.log("✅ Discounts cleared");
    
    await db.delete(discountTypes);
    console.log("✅ Discount types cleared");
    
    await db.delete(tuitionFees);
    console.log("✅ Tuition fees cleared");
    
    await db.delete(tuitionRates);
    console.log("✅ Tuition rates cleared");
    
    await db.delete(feeDiscounts);
    console.log("✅ Fee discounts cleared");
    
    await db.delete(feeSettings);
    console.log("✅ Fee settings cleared");
    
    await db.delete(fees);
    console.log("✅ Fees cleared");
    
    // Clear communication data
    await db.delete(notifications);
    console.log("✅ Notifications cleared");
    
    await db.delete(messages);
    console.log("✅ Messages cleared");
    
    // Clear academic data
    await db.delete(grades);
    console.log("✅ Grades cleared");
    
    await db.delete(teacherAttendance);
    console.log("✅ Teacher attendance cleared");
    
    await db.delete(attendance);
    console.log("✅ Student attendance cleared");
    
    await db.delete(examinations);
    console.log("✅ Examinations cleared");
    
    await db.delete(lessons);
    console.log("✅ Lessons cleared");
    
    // Clear calendar and events
    await db.delete(calendarEvents);
    console.log("✅ Calendar events cleared");
    
    await db.delete(events);
    console.log("✅ Events cleared");
    
    await db.delete(schedules);
    console.log("✅ Schedules cleared");
    
    // Clear teacher relationships
    await db.delete(teacherLanguages);
    console.log("✅ Teacher languages cleared");
    
    await db.delete(teacherAvailability);
    console.log("✅ Teacher availability cleared");
    
    await db.delete(teacherCourseAssignments);
    console.log("✅ Teacher course assignments cleared");
    
    await db.delete(programTeachers);
    console.log("✅ Program teachers cleared");
    
    // Clear student relationships
    await db.delete(studentSiblings);
    console.log("✅ Student siblings cleared");
    
    await db.delete(studentPrograms);
    console.log("✅ Student programs cleared");
    
    await db.delete(studentGroupEnrollments);
    console.log("✅ Student group enrollments cleared");
    
    await db.delete(enrollments);
    console.log("✅ Enrollments cleared");
    
    await db.delete(studentGuardians);
    console.log("✅ Student guardian relationships cleared");
    
    // Clear academic structure
    await db.delete(schoolHolidays);
    console.log("✅ School holidays cleared");
    
    await db.delete(studentGroups);
    console.log("✅ Student groups cleared");
    
    await db.delete(courses);
    console.log("✅ Courses cleared");
    
    await db.delete(programs);
    console.log("✅ Programs cleared");
    
    await db.delete(academicYears);
    console.log("✅ Academic years cleared");
    
    await db.delete(rooms);
    console.log("✅ Rooms cleared");
    
    // Clear people (keep admin user)
    await db.delete(students);
    console.log("✅ Students cleared");
    
    await db.delete(guardians);
    console.log("✅ Guardians cleared");
    
    await db.delete(teachers);
    console.log("✅ Teachers cleared");
    
    await db.delete(userAccounts);
    console.log("✅ User accounts cleared");
    
    // Only delete non-admin users
    const adminUsers = await db.select().from(users);
    const adminUser = adminUsers.find(u => u.email === 'admin@mymadrassa.nl');
    
    if (adminUser) {
      // Delete all users except admin
      for (const user of adminUsers) {
        if (user.email !== 'admin@mymadrassa.nl') {
          await db.delete(users).where(users.id.eq(user.id));
        }
      }
      console.log("✅ Non-admin users cleared (admin user preserved)");
    } else {
      console.log("⚠️  No admin user found - keeping all users");
    }
    
    console.log("\n🎉 All mock data successfully cleared!");
    console.log("💡 The database is now clean and ready for real data");
    
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