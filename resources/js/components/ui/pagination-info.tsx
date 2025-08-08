import { type Pagination } from '@/types';
import { cn } from '@/lib/utils';

interface PaginationInfoProps<T> {
    pagination: Pagination<T>;
    className?: string;
    itemName?: string;
}

export function PaginationInfo<T>({
    pagination,
    className,
    itemName = "results"
}: PaginationInfoProps<T>) {
    const { from, to, total } = pagination;

    if (total === 0) {
        return (
            <div className={cn("text-sm text-muted-foreground", className)}>
                No {itemName} found
            </div>
        );
    }

    // Single page with all results
    if (from === 1 && to === total) {
        const singularItem = total === 1 ? itemName.slice(0, -1) : itemName;
        return (
            <div className={cn("text-sm text-muted-foreground", className)}>
                Showing {total.toLocaleString()} {singularItem}
            </div>
        );
    }

    // Paginated results
    return (
        <div className={cn("text-sm text-muted-foreground", className)}>
            Showing {from.toLocaleString()}-{to.toLocaleString()} of {total.toLocaleString()} {itemName}
        </div>
    );
}
