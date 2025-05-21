import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import Pagination from "./Pagination";

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  cell?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  selectable?: boolean;
  actions?: (row: T) => React.ReactNode;
  pagination?: {
    pageSize: number;
    totalItems: number;
    currentPage: number;
    onPageChange: (page: number) => void;
  };
  loading?: boolean;
  onRowClick?: (row: T) => void;
}

function DataTable<T extends { id: string | number }>({
  columns,
  data,
  selectable = false,
  actions,
  pagination,
  loading = false,
  onRowClick,
}: DataTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());

  const handleSelectRow = (id: string | number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map((row) => row.id)));
    }
  };

  const renderCell = (row: T, column: Column<T>) => {
    if (column.cell) {
      return column.cell(row);
    }

    if (typeof column.accessor === "function") {
      return column.accessor(row);
    }

    return row[column.accessor] as React.ReactNode;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRows.size === data.length && data.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              {columns.map((column, index) => (
                <TableHead key={index}>
                  {column.header}
                </TableHead>
              ))}
              {actions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow
                  key={row.id}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {selectable && (
                    <TableCell className="w-12">
                      <Checkbox
                        checked={selectedRows.has(row.id)}
                        onCheckedChange={() => handleSelectRow(row.id)}
                        aria-label={`Select row ${row.id}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                  )}
                  {columns.map((column, index) => (
                    <TableCell key={index}>{renderCell(row, column)}</TableCell>
                  ))}
                  {actions && (
                    <TableCell className="text-right">
                      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                        {actions(row)}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="border-t p-2 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.currentPage - 1) * pagination.pageSize + 1}-
            {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of{" "}
            {pagination.totalItems} items
          </div>
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={Math.ceil(pagination.totalItems / pagination.pageSize)}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}
    </div>
  );
}

export default DataTable;
