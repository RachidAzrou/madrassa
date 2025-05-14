import { Helmet } from "react-helmet";
import DashboardStats from "@/components/dashboard/DashboardStats";
import EnrollmentChart from "@/components/dashboard/EnrollmentChart";
import UpcomingEvents from "@/components/dashboard/UpcomingEvents";
import RecentStudents from "@/components/dashboard/RecentStudents";
import QuickActions from "@/components/dashboard/QuickActions";
import CampusHighlights from "@/components/dashboard/CampusHighlights";

export default function Dashboard() {
  return (
    <>
      <Helmet>
        <title>Dashboard - EduManage</title>
        <meta name="description" content="Education management dashboard with key metrics and quick access to system features." />
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Academic Year:</span>
            <select className="text-sm bg-background border border-input rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary">
              <option>2023-2024</option>
              <option>2022-2023</option>
            </select>
          </div>
        </div>

        <DashboardStats />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <EnrollmentChart className="lg:col-span-2" />
          <UpcomingEvents />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RecentStudents className="lg:col-span-2" />
          <div className="space-y-6">
            <QuickActions />
            <CampusHighlights />
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Our Campus</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative h-48 rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                alt="Modern university building"
                className="object-cover w-full h-full"
              />
            </div>
            <div className="relative h-48 rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                alt="University library"
                className="object-cover w-full h-full"
              />
            </div>
            <div className="relative h-48 rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                alt="Campus quad"
                className="object-cover w-full h-full"
              />
            </div>
            <div className="relative h-48 rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                alt="Modern lecture hall"
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
