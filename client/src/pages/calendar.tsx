import { Helmet } from "react-helmet";
import CalendarView from "@/components/calendar/CalendarView";

export default function Calendar() {
  return (
    <>
      <Helmet>
        <title>Academic Calendar - EduManage</title>
        <meta 
          name="description" 
          content="View and manage academic calendar, schedule events, and track important academic dates and deadlines." 
        />
      </Helmet>
      
      <CalendarView />
    </>
  );
}
