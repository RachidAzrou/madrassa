import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showSiblings?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showSiblings = 1,
}) => {
  // No pagination needed for a single page
  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers: (number | "ellipsis")[] = [];
    
    // Always show first page
    pageNumbers.push(1);
    
    // Start ellipsis
    if (currentPage - showSiblings > 2) {
      pageNumbers.push("ellipsis");
    }
    
    // Pages around current page
    for (let i = Math.max(2, currentPage - showSiblings); i <= Math.min(totalPages - 1, currentPage + showSiblings); i++) {
      pageNumbers.push(i);
    }
    
    // End ellipsis
    if (currentPage + showSiblings < totalPages - 1) {
      pageNumbers.push("ellipsis");
    }
    
    // Always show last page if more than 1 page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  return (
    <nav className="flex items-center space-x-1">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevious}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous Page</span>
      </Button>
      
      {getPageNumbers().map((page, index) => 
        page === "ellipsis" ? (
          <Button key={`ellipsis-${index}`} variant="outline" size="icon" disabled>
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More Pages</span>
          </Button>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        )
      )}
      
      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next Page</span>
      </Button>
    </nav>
  );
};

export default Pagination;
