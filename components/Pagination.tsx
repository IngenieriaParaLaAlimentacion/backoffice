import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

/** Renders nothing when there is a single page. */
export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
      <Button
        size="sm"
        variant="ghost"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Página anterior"
      >
        <ChevronLeft size={16} />
      </Button>
      <span>
        Página {page} de {totalPages}
      </span>
      <Button
        size="sm"
        variant="ghost"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Página siguiente"
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  );
}
