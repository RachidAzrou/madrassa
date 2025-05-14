import { Helmet } from "react-helmet";
import AttendanceTracker from "@/components/attendance/AttendanceTracker";

export default function Attendance() {
  return (
    <>
      <Helmet>
        <title>Attendance Tracking - EduManage</title>
        <meta 
          name="description" 
          content="Track and record student attendance for courses, view attendance reports, and identify attendance patterns and issues." 
        />
      </Helmet>
      
      <AttendanceTracker />
    </>
  );
}
