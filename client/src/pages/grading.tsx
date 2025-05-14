import { Helmet } from "react-helmet";
import GradingTable from "@/components/grading/GradingTable";

export default function Grading() {
  return (
    <>
      <Helmet>
        <title>Grade Management - EduManage</title>
        <meta 
          name="description" 
          content="Manage student grades, create and grade assessments, and track academic performance across courses." 
        />
      </Helmet>
      
      <GradingTable />
    </>
  );
}
