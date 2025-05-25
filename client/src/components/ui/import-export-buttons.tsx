import React from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ImportExportButtonsProps {
  data: any[];
  filename?: string;
  onImportClick?: () => void;
  exportColumns?: { key: string; header: string }[];
}

/**
 * Herbruikbare component voor import- en exportknoppen
 * Kan in verschillende pagina's worden gebruikt voor consistente UI
 */
const ImportExportButtons: React.FC<ImportExportButtonsProps> = ({
  data,
  filename = 'geëxporteerde-data',
  onImportClick,
  exportColumns
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = React.useState(false);

  // Excel export functionaliteit
  const exportToExcel = () => {
    try {
      // Maak een werkblad met de data
      let exportData;
      
      // Als er specifieke kolommen zijn opgegeven, gebruik die voor de export
      if (exportColumns) {
        exportData = data.map(item => {
          const exportItem: Record<string, any> = {};
          exportColumns.forEach(col => {
            exportItem[col.header] = item[col.key];
          });
          return exportItem;
        });
      } else {
        // Anders gebruik alle data
        exportData = data;
      }
      
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      
      // Genereer het Excel bestand en download het
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      
      // Sluit het dropdown menu
      setIsExportMenuOpen(false);
    } catch (error) {
      console.error("Fout bij exporteren naar Excel:", error);
      alert("Er is een fout opgetreden bij het exporteren naar Excel");
    }
  };

  // PDF export functionaliteit
  const exportToPDF = () => {
    try {
      // Maak een nieuwe PDF met A4 formaat
      const doc = new jsPDF();
      
      // Bepaal de te exporteren data en kolommen
      let exportData;
      let columns;
      
      if (exportColumns) {
        // Gebruik alleen de opgegeven kolommen voor export
        columns = exportColumns.map(col => col.header);
        exportData = data.map(item => 
          exportColumns.map(col => item[col.key])
        );
      } else {
        // Gebruik alle data
        if (data.length > 0) {
          columns = Object.keys(data[0]);
          exportData = data.map(item => Object.values(item));
        } else {
          columns = [];
          exportData = [];
        }
      }
      
      // Genereer de tabel in de PDF
      (doc as any).autoTable({
        head: [columns],
        body: exportData,
        margin: { top: 20 },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 64, 175], textColor: 255 },
      });
      
      // Download de PDF
      doc.save(`${filename}.pdf`);
      
      // Sluit het dropdown menu
      setIsExportMenuOpen(false);
    } catch (error) {
      console.error("Fout bij exporteren naar PDF:", error);
      alert("Er is een fout opgetreden bij het exporteren naar PDF");
    }
  };

  // CSV export functionaliteit
  const exportToCSV = () => {
    try {
      // Bepaal de te exporteren data en kolommen
      let exportData;
      
      if (exportColumns) {
        // Gebruik alleen de opgegeven kolommen voor export
        const headers = exportColumns.map(col => col.header);
        
        // Maak CSV data met de juiste kolommen
        exportData = [
          headers.join(','), // Header rij
          ...data.map(item => 
            exportColumns.map(col => {
              // Zorg ervoor dat komma's en aanhalingstekens correct worden weergegeven
              const value = item[col.key];
              if (value === null || value === undefined) return '';
              
              const stringValue = String(value);
              // Als er komma's, aanhalingstekens of nieuwe regels in de waarde zitten, 
              // omsluit deze dan met aanhalingstekens
              return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') 
                ? `"${stringValue.replace(/"/g, '""')}"` 
                : stringValue;
            }).join(',')
          )
        ].join('\n');
      } else {
        // Gebruik alle data
        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          
          exportData = [
            headers.join(','), // Header rij
            ...data.map(item => 
              headers.map(header => {
                const value = item[header];
                if (value === null || value === undefined) return '';
                
                const stringValue = String(value);
                return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
                  ? `"${stringValue.replace(/"/g, '""')}"` 
                  : stringValue;
              }).join(',')
            )
          ].join('\n');
        } else {
          exportData = '';
        }
      }
      
      // Maak een Blob en download het CSV bestand
      const blob = new Blob([exportData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Sluit het dropdown menu
      setIsExportMenuOpen(false);
    } catch (error) {
      console.error("Fout bij exporteren naar CSV:", error);
      alert("Er is een fout opgetreden bij het exporteren naar CSV");
    }
  };

  return (
    <div className="flex flex-col w-full mb-4">
      <div className="flex items-center gap-2 self-start">
        {/* Exporteren knop */}
        <DropdownMenu open={isExportMenuOpen} onOpenChange={setIsExportMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs rounded-sm border-[#e5e7eb]"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="mr-1"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              Exporteren
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[180px] bg-white">
            <DropdownMenuItem className="text-xs py-2 cursor-pointer" onClick={exportToExcel}>
              <FileSpreadsheet className="h-3.5 w-3.5 mr-2" />
              Exporteren als Excel
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs py-2 cursor-pointer" onClick={exportToPDF}>
              <FileText className="h-3.5 w-3.5 mr-2" />
              Exporteren als PDF
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs py-2 cursor-pointer" onClick={exportToCSV}>
              <FileText className="h-3.5 w-3.5 mr-2" />
              Exporteren als CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Importeren knop (alleen tonen als onImportClick is opgegeven) */}
        {onImportClick && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs rounded-sm border-[#e5e7eb]"
            onClick={onImportClick}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="mr-1"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Importeren
          </Button>
        )}
      </div>
    </div>
  );
};

export default ImportExportButtons;