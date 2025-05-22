import React from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMobile } from "@/hooks/useMobile";
import { Card } from "@/components/ui/card";

interface ColumnDef {
  header: string;
  accessorKey: string;
  cell?: (info: any) => React.ReactNode;
}

interface ResponsiveTableProps {
  columns: ColumnDef[];
  data: any[];
  isLoading?: boolean;
  noDataText?: string;
}

export function ResponsiveTable({
  columns,
  data,
  isLoading = false,
  noDataText = "Geen gegevens beschikbaar",
}: ResponsiveTableProps) {
  const isMobile = useMobile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 w-full">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 px-4 bg-gray-50 rounded-md text-gray-500">
        {noDataText}
      </div>
    );
  }

  if (isMobile) {
    // Kaartweergave voor mobiel
    return (
      <div className="space-y-4">
        {data.map((row, rowIndex) => (
          <Card key={rowIndex} className="p-4 shadow-sm">
            <div className="space-y-2">
              {columns.map((column, columnIndex) => (
                <div key={columnIndex} className="flex flex-col">
                  <div className="font-medium text-sm text-gray-600">
                    {column.header}
                  </div>
                  <div className="text-gray-900">
                    {column.cell
                      ? column.cell({ row: { original: row } })
                      : row[column.accessorKey] || "—"}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Normale tabelweergave voor desktop
  return (
    <ScrollArea className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column, columnIndex) => (
                <TableCell key={columnIndex}>
                  {column.cell
                    ? column.cell({ row: { original: row } })
                    : row[column.accessorKey] || "—"}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}