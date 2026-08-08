import { type Pagination, type UrlLog, type UrlLogStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { PaginationInfo } from '@/components/ui/pagination-info';
import { PaginationControls } from '@/components/ui/pagination';
import { ArrowDown, ArrowUp, ArrowUpDown, ScrollText } from 'lucide-react';
import { router } from '@inertiajs/react';
import { cn } from '@/lib/utils';

function formatRelativeTime(date: string | Date): string {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor(Math.abs(now.getTime() - targetDate.getTime()) / 1000);
    const isFuture = targetDate > now;

    if (diffInSeconds < 60) return isFuture ? 'soon' : 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ${isFuture ? 'from now' : 'ago'}`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ${isFuture ? 'from now' : 'ago'}`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ${isFuture ? 'from now' : 'ago'}`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ${isFuture ? 'from now' : 'ago'}`;
    return `${Math.floor(diffInSeconds / 31536000)}y ${isFuture ? 'from now' : 'ago'}`;
}

const statusVariant: Record<UrlLogStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    success: 'default',
    not_found: 'secondary',
    expired: 'outline',
    error: 'destructive',
};

const statusLabel: Record<UrlLogStatus, string> = {
    success: 'Success',
    not_found: 'Not found',
    expired: 'Expired',
    error: 'Error',
};

type SortColumn = 'request_path' | 'target_url' | 'status' | 'ip_address' | 'created_at';

function SortableHeader({
    label,
    column,
    sort,
    order,
    className,
}: {
    label: string;
    column: SortColumn;
    sort: string;
    order: 'asc' | 'desc';
    className?: string;
}) {
    const isActive = sort === column;
    const nextOrder = isActive && order === 'desc' ? 'asc' : 'desc';

    const handleSort = () => {
        const url = new URL(window.location.href);
        url.searchParams.set('sort', column);
        url.searchParams.set('order', nextOrder);
        url.searchParams.delete('page');
        router.get(url.pathname + url.search, {}, { preserveState: true });
    };

    const Icon = !isActive ? ArrowUpDown : order === 'asc' ? ArrowUp : ArrowDown;

    return (
        <button
            type="button"
            onClick={handleSort}
            className={cn(
                'inline-flex items-center gap-1 hover:text-foreground transition-colors',
                isActive && 'text-foreground',
                className,
            )}
        >
            {label}
            <Icon className="h-3.5 w-3.5" />
        </button>
    );
}

function UrlLogTableHeader({ sort, order }: { sort: string; order: 'asc' | 'desc' }) {
    return (
        <div className="grid grid-cols-12 gap-4 px-3 py-3 text-sm text-muted-foreground font-bold border-b">
            <div className="col-span-3 sm:col-span-2">
                <SortableHeader label="Path" column="request_path" sort={sort} order={order} />
            </div>
            <div className="col-span-5 sm:col-span-4">
                <SortableHeader label="Target URL" column="target_url" sort={sort} order={order} />
            </div>
            <div className="col-span-2 sm:col-span-2">
                <SortableHeader label="Status" column="status" sort={sort} order={order} />
            </div>
            <div className="col-span-2 hidden sm:block">
                <SortableHeader label="IP" column="ip_address" sort={sort} order={order} />
            </div>
            <div className="col-span-2 sm:col-span-2">
                <SortableHeader label="Time" column="created_at" sort={sort} order={order} />
            </div>
        </div>
    );
}

function UrlLogTableRow({ log }: { log: UrlLog }) {
    return (
        <div className="grid grid-cols-12 gap-4 px-3 py-3 text-sm border-b last:border-b-0 items-center hover:bg-muted/40">
            <div className="col-span-3 sm:col-span-2 font-mono text-xs truncate" title={log.request_path}>
                {log.request_path}
            </div>
            <div className="col-span-5 sm:col-span-4 truncate text-muted-foreground" title={log.target_url ?? undefined}>
                {log.target_url ?? '—'}
            </div>
            <div className="col-span-2 sm:col-span-2">
                <Badge variant={statusVariant[log.status]}>{statusLabel[log.status]}</Badge>
            </div>
            <div className="col-span-2 hidden sm:block font-mono text-xs truncate" title={log.ip_address ?? undefined}>
                {log.ip_address ?? '—'}
            </div>
            <div className="col-span-2 sm:col-span-2 text-muted-foreground" title={new Date(log.created_at).toLocaleString()}>
                {formatRelativeTime(log.created_at)}
            </div>
        </div>
    );
}

export default function UrlLogTable({
    logs,
    sort,
    order,
    className,
}: {
    logs: Pagination<UrlLog>;
    sort: string;
    order: 'asc' | 'desc';
    className?: string;
}) {
    const showPagination = logs.last_page > 1;

    return (
        <div className={className}>
            <div className="overflow-hidden">
                <UrlLogTableHeader sort={sort} order={order} />
                {logs.data.map((log) => (
                    <UrlLogTableRow key={log.id} log={log} />
                ))}
                {logs.data.length === 0 && (
                    <div className="px-6 py-12 text-center text-muted-foreground">
                        <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No logs found</p>
                        <p className="text-sm">Redirect attempts will appear here</p>
                    </div>
                )}
                {showPagination && logs.data.length > 0 && (
                    <div className="px-3 py-4 border-t flex justify-between items-center">
                        <PaginationInfo pagination={logs} itemName="logs" />
                        <PaginationControls pagination={logs} />
                    </div>
                )}
            </div>
        </div>
    );
}
