import { Helmet } from "react-helmet";
import ReportsList from "@/components/reports/ReportsList";

export default function Reports() {
  return (
    <>
      <Helmet>
        <title>Reports & Analytics - EduManage</title>
        <meta 
          name="description" 
          content="Generate academic reports, view student performance analytics, and get insights on course statistics." 
        />
      </Helmet>
      
      <ReportsList />
    </>
  );
}
