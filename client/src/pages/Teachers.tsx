import React from "react";
import { GraduationCap } from "lucide-react";
import { PremiumHeader } from "@/components/layout/premium-header";

const Teachers = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PremiumHeader 
        title="Docenten" 
        path="Beheer > Docenten" 
        icon={GraduationCap}
        description="Beheer alle docenten en hun gegevens"
      />
      <div className="px-6 py-6">
        <div className="bg-white p-6 rounded-md shadow-sm">
          <p className="text-center text-gray-500">Docenten module wordt momenteel bijgewerkt.</p>
        </div>
      </div>
    </div>
  );
};

export default Teachers;