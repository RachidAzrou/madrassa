import { Helmet } from "react-helmet";
import ProgramsList from "@/components/programs/ProgramsList";

export default function Programs() {
  return (
    <>
      <Helmet>
        <title>Program Management - EduManage</title>
        <meta 
          name="description" 
          content="Create and manage academic programs and curricula. Set program requirements, duration, and manage associated courses." 
        />
      </Helmet>
      
      <ProgramsList />
    </>
  );
}
