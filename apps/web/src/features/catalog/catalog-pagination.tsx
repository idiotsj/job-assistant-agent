import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CatalogPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function CatalogPagination({ page, totalPages, total, onPageChange }: CatalogPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="catalog-pagination">
      <span className="small-copy">
        第 {page} / {totalPages} 页，共 {total} 条
      </span>
      <div className="catalog-pagination__actions">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft size={14} />
          上一页
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          下一页
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}
