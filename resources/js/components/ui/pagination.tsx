import { type Pagination } from '@/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { router } from '@inertiajs/react';
import { cn } from '@/lib/utils';

interface PaginationControlsProps<T> {
    pagination: Pagination<T>;
    className?: string;
    showFirstLast?: boolean;
}

// Simplified page number generation with better logic
function getPageNumbers(currentPage: number, lastPage: number, maxVisible = 5): (number | 'ellipsis')[] {
    if (lastPage <= maxVisible) {
        return Array.from({ length: lastPage }, (_, i) => i + 1);
    }

    const halfVisible = Math.floor(maxVisible / 2);
    const pages: (number | 'ellipsis')[] = [1];

    if (currentPage <= halfVisible + 1) {
        // Near start: 1, 2, 3, 4, 5, ..., last
        for (let i = 2; i <= maxVisible - 1; i++) pages.push(i);
        if (lastPage > maxVisible) pages.push('ellipsis');
        pages.push(lastPage);
    } else if (currentPage >= lastPage - halfVisible) {
        // Near end: 1, ..., last-4, last-3, last-2, last-1, last
        pages.push('ellipsis');
        for (let i = lastPage - maxVisible + 2; i < lastPage; i++) pages.push(i);
        pages.push(lastPage);
    } else {
        // Middle: 1, ..., current-1, current, current+1, ..., last
        pages.push('ellipsis');
        for (let i = currentPage - halfVisible + 1; i <= currentPage + halfVisible - 1; i++) {
            pages.push(i);
        }
        pages.push('ellipsis', lastPage);
    }

    return pages;
}

export function PaginationControls<T>({
    pagination,
    className,
    showFirstLast = false
}: PaginationControlsProps<T>) {
    const { current_page, last_page } = pagination;

    if (last_page <= 1) return null;

    const navigateToPage = (page: number) => {
        if (page < 1 || page > last_page || page === current_page) return;

        const url = new URL(window.location.href);
        url.searchParams.set('page', page.toString());
        router.get(url.pathname + url.search);
    };

    const buttonProps = {
        variant: "outline" as const,
        size: "sm" as const,
        className: "h-8 w-8 p-0"
    };

    return (
        <div className={cn("flex items-center gap-1", className)}>
            {/* First page */}
            {showFirstLast && current_page > 1 && (
                <Button
                    {...buttonProps}
                    onClick={() => navigateToPage(1)}
                    aria-label="Go to first page"
                >
                    <ChevronLeft className="h-4 w-4" />
                    <ChevronLeft className="h-4 w-4 -ml-2" />
                </Button>
            )}

            {/* Previous */}
            <Button
                {...buttonProps}
                onClick={() => navigateToPage(current_page - 1)}
                disabled={current_page <= 1}
                aria-label="Go to previous page"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
                {getPageNumbers(current_page, last_page).map((page, index) =>
                    page === 'ellipsis' ? (
                        <div
                            key={`ellipsis-${index}`}
                            className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </div>
                    ) : (
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
                    )
                )}
            </div>

            {/* Next */}
            <Button
                {...buttonProps}
                onClick={() => navigateToPage(current_page + 1)}
                disabled={current_page >= last_page}
                aria-label="Go to next page"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Last page */}
            {showFirstLast && current_page < last_page && (
                <Button
                    {...buttonProps}
                    onClick={() => navigateToPage(last_page)}
                    aria-label="Go to last page"
                >
                    <ChevronRight className="h-4 w-4" />
                    <ChevronRight className="h-4 w-4 -ml-2" />
                </Button>
            )}
        </div>
    );
}
