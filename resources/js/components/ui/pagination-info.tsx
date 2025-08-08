import { type Pagination } from '@/types';
import { cn } from '@/lib/utils';

interface PaginationInfoProps<T> {
    pagination: Pagination<T>;
    className?: string;
    itemName?: string; // e.g., "URLs", "results", "items"
}

export function PaginationInfo<T>({
    pagination,
    className,
    itemName = "results"
}: PaginationInfoProps<T>) {
    const { from, to, total } = pagination;

    // Handle empty results
    if (total === 0) {
        return (
            <div className={cn("text-sm text-muted-foreground", className)}>
                No {itemName} found
            </div>
        );
    }

    // Handle single page with all results
    if (from === 1 && to === total) {
        const itemText = total === 1 ? itemName.slice(0, -1) : itemName; // Remove 's' for singular
        return (
            <div className={cn("text-sm text-muted-foreground", className)}>
                Showing {total} {itemText}
            </div>
        );
    }

    // Handle paginated results
    return (
        <div className={cn("text-sm text-muted-foreground", className)}>
            Showing {from.toLocaleString()}-{to.toLocaleString()} of {total.toLocaleString()} {itemName}
        </div>
    );
}
