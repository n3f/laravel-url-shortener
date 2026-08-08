import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type LogsIndexProps } from '@/types';
import { Head } from '@inertiajs/react';
import UrlLogTable from '@/components/url-log-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Logs',
        href: '/logs',
    },
];

export default function LogsIndex({ logs, sort, order }: LogsIndexProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Logs" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <UrlLogTable
                        logs={logs}
                        sort={sort}
                        order={order}
                        className="p-6 size-full"
                    />
                </div>
            </div>
        </AppLayout>
    );
}
