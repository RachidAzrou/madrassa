import { Helmet } from "react-helmet";
import StudentsList from "@/components/students/StudentsList";

export default function Students() {
  return (
    <>
      <Helmet>
        <title>Student Management - EduManage</title>
        <meta 
          name="description" 
          content="Manage student records, registrations, and profiles. View and update student information, track academic progress, and manage enrollments." 
        />
      </Helmet>
      
      <StudentsList />
    </>
  );
}
