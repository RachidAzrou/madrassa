import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart2,
  BookOpen,
  Calendar,
  GraduationCap,
  ListChecks,
  Users,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import EnrollmentChart from "@/components/dashboard/EnrollmentChart";
import UpcomingEvents from "@/components/dashboard/UpcomingEvents";
import RecentStudents from "@/components/dashboard/RecentStudents";
import CampusGallery from "@/components/dashboard/CampusGallery";

const Dashboard = () => {
  // Fetch stats data
  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ["/api/students"],
  });

  const { data: coursesData, isLoading: loadingCourses } = useQuery({
    queryKey: ["/api/courses"],
  });

  const { data: programsData, isLoading: loadingPrograms } = useQuery({
    queryKey: ["/api/programs"],
  });

  const { data: eventsData, isLoading: loadingEvents } = useQuery({
    queryKey: ["/api/events"],
  });

  // Mock data for the enrollment chart
  const enrollmentChartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
    datasets: [
      {
        label: "Enrollments",
        data: [65, 85, 75, 90, 95, 70, 60, 80, 85],
      },
    ],
  };

  // Format recent students data
  const recentStudents = React.useMemo(() => {
    if (!studentsData) return [];
    
    // Sort by enrollment date descending and take the first 5
    return studentsData
      .sort((a: any, b: any) => new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime())
      .slice(0, 5)
      .map((student: any) => ({
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        programName: getProgramName(student.programId),
        enrollmentDate: student.enrollmentDate,
        status: student.status,
      }));
  }, [studentsData]);

  // Format upcoming events data
  const upcomingEvents = React.useMemo(() => {
    if (!eventsData) return [];
    
    const today = new Date();
    // Filter for upcoming events and sort by date
    return eventsData
      .filter((event: any) => new Date(event.startDate) >= today)
      .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 4)
      .map((event: any) => ({
        id: event.id,
        title: event.title,
        date: event.startDate,
        time: event.startTime && event.endTime 
          ? `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`
          : undefined,
        location: event.location,
        type: mapEventType(event.eventType),
      }));
  }, [eventsData]);

  function getProgramName(programId: number) {
    if (!programsData) return "Unknown Program";
    const program = programsData.find((p: any) => p.id === programId);
    return program ? program.name : "Unknown Program";
  }

  function formatTime(timeString: string) {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch (e) {
      return timeString;
    }
  }

  function mapEventType(type: string): "exam" | "meeting" | "holiday" | "deadline" | "other" {
    switch (type) {
      case "exam": return "exam";
      case "meeting": return "meeting";
      case "holiday": return "holiday";
      case "deadline": return "deadline";
      default: return "other";
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your education management system"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={studentsData?.length || 0}
          icon={<Users className="h-6 w-6" />}
          trend={{
            value: "5.2%",
            direction: "up",
            label: "from last semester",
          }}
        />
        <StatCard
          title="Active Courses"
          value={coursesData?.length || 0}
          icon={<BookOpen className="h-6 w-6" />}
          trend={{
            value: "3.1%",
            direction: "up",
            label: "from last semester",
          }}
        />
        <StatCard
          title="Programs"
          value={programsData?.length || 0}
          icon={<ListChecks className="h-6 w-6" />}
          trend={{
            value: "0%",
            direction: "neutral",
            label: "from last semester",
          }}
        />
        <StatCard
          title="Attendance Rate"
          value="92.7%"
          icon={<BarChart2 className="h-6 w-6" />}
          trend={{
            value: "1.3%",
            direction: "down",
            label: "from last semester",
          }}
        />
      </div>

      {/* Charts & Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <EnrollmentChart
          title="Enrollment Trends"
          description="Monthly enrollment statistics"
          data={enrollmentChartData}
          className="lg:col-span-2"
        />
        <UpcomingEvents events={upcomingEvents} />
      </div>

      {/* Recent Activity & Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentStudents students={recentStudents} className="lg:col-span-2" />
        
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-5">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <a href="/students" className="flex flex-col items-center justify-center p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors">
                <Users className="text-2xl text-primary mb-2 h-6 w-6" />
                <span className="text-sm">Add Student</span>
              </a>
              <a href="/courses" className="flex flex-col items-center justify-center p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors">
                <BookOpen className="text-2xl text-primary mb-2 h-6 w-6" />
                <span className="text-sm">Add Course</span>
              </a>
              <a href="/attendance" className="flex flex-col items-center justify-center p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors">
                <BarChart2 className="text-2xl text-primary mb-2 h-6 w-6" />
                <span className="text-sm">Take Attendance</span>
              </a>
              <a href="/calendar" className="flex flex-col items-center justify-center p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors">
                <Calendar className="text-2xl text-primary mb-2 h-6 w-6" />
                <span className="text-sm">View Calendar</span>
              </a>
            </div>
          </div>
          
          {/* Academic Year */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Academic Year</h3>
              <span className="text-sm text-primary">2023-2024</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current Semester:</span>
                <span className="font-medium">Fall Semester</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Start Date:</span>
                <span className="font-medium">September 1, 2023</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>End Date:</span>
                <span className="font-medium">December 15, 2023</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Next Holiday:</span>
                <span className="font-medium">October 10, 2023</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campus Gallery */}
      <CampusGallery 
        title="Campus Highlights" 
        description="Explore our facilities and campus environment"
      />
    </div>
  );
};

export default Dashboard;
