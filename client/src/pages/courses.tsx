import { Helmet } from "react-helmet";
import CoursesList from "@/components/courses/CoursesList";

export default function Courses() {
  return (
    <>
      <Helmet>
        <title>Course Management - EduManage</title>
        <meta 
          name="description" 
          content="Manage course catalog, create and edit courses, track enrollments and manage course schedules." 
        />
      </Helmet>
      
      <CoursesList />
    </>
  );
}
