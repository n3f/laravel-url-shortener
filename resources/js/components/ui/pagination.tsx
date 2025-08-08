import { type Pagination } from '@/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { router } from '@inertiajs/react';
import { cn } from '@/lib/utils';

interface PaginationControlsProps<T> {
    pagination: Pagination<T>;
    className?: string;
    showFirstLast?: boolean; // Whether to show first/last page buttons
}

// Helper to generate page numbers with ellipsis
function getPageNumbers(currentPage: number, lastPage: number, maxVisible: number = 5): (number | 'ellipsis')[] {
    if (lastPage <= maxVisible) {
        return Array.from({ length: lastPage }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];
    const halfVisible = Math.floor(maxVisible / 2);

    // Always show first page
    pages.push(1);

    if (currentPage <= halfVisible + 1) {
        // Near the beginning
        for (let i = 2; i <= maxVisible - 1; i++) {
            pages.push(i);
        }
        if (lastPage > maxVisible) {
            pages.push('ellipsis');
        }
        pages.push(lastPage);
    } else if (currentPage >= lastPage - halfVisible) {
        // Near the end
        pages.push('ellipsis');
        for (let i = lastPage - maxVisible + 2; i < lastPage; i++) {
            pages.push(i);
        }
        pages.push(lastPage);
    } else {
        // In the middle
        pages.push('ellipsis');
        for (let i = currentPage - halfVisible + 1; i <= currentPage + halfVisible - 1; i++) {
            pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(lastPage);
    }

    return pages;
}

export function PaginationControls<T>({
    pagination,
    className,
    showFirstLast = false
}: PaginationControlsProps<T>) {
    const { current_page, last_page } = pagination;

    if (last_page <= 1) {
        return null;
    }

    const pageNumbers = getPageNumbers(current_page, last_page);

    const navigateToPage = (page: number) => {
        if (page < 1 || page > last_page || page === current_page) {
            return;
        }

        // Preserve existing query parameters and update page
        const url = new URL(window.location.href);
        url.searchParams.set('page', page.toString());
        router.get(url.pathname + url.search);
    };

    return (
        <div className={cn("flex items-center gap-1", className)}>
            {/* First page button */}
            {showFirstLast && current_page > 1 && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToPage(1)}
                    aria-label="Go to first page"
                    className="h-8 w-8 p-0"
                >
                    <ChevronLeft className="h-4 w-4" />
                    <ChevronLeft className="h-4 w-4 -ml-2" />
                </Button>
            )}

            {/* Previous button */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToPage(current_page - 1)}
                disabled={current_page <= 1}
                aria-label="Go to previous page"
                className="h-8 w-8 p-0"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
                {pageNumbers.map((page, index) => {
                    if (page === 'ellipsis') {
                        return (
                            <div
                                key={`ellipsis-${index}`}
                                className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </div>
                        );
                    }

                    return (
                        <Button
                            key={page}
                            variant={page === current_page ? "default" : "outline"}
                            size="sm"
                            onClick={() => navigateToPage(page)}
                            aria-label={`Go to page ${page}`}
                            aria-current={page === current_page ? "page" : undefined}
                            className="h-8 w-8 p-0"
                        >
                            {page}
                        </Button>
                    );
                })}
            </div>

            {/* Next button */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToPage(current_page + 1)}
                disabled={current_page >= last_page}
                aria-label="Go to next page"
                className="h-8 w-8 p-0"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Last page button */}
            {showFirstLast && current_page < last_page && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToPage(last_page)}
                    aria-label="Go to last page"
                    className="h-8 w-8 p-0"
                >
                    <ChevronRight className="h-4 w-4" />
                    <ChevronRight className="h-4 w-4 -ml-2" />
                </Button>
            )}
        </div>
    );
}
