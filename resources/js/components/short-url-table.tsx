import { type Pagination, type Url } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PaginationInfo } from '@/components/ui/pagination-info';
import { PaginationControls } from '@/components/ui/pagination';
import { Copy, ExternalLink, Calendar, Link, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShortUrlForm } from '@/components/short-url-form';

// Simple date formatting function
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

function ShortUrlTableHeader() {
    return (
        <div className="grid grid-cols-12 gap-4 px-3 py-3 text-sm text-muted-foreground font-bold border-b">
            <div className="col-span-4 sm:col-span-3">Short URL</div>
            <div className="col-span-6 md:col-span-5">Original URL</div>
            <div className="col-span-1 hidden md:block">Clicks</div>
            <div className="col-span-2 hidden sm:block">Expires</div>
            <div className="col-span-2 sm:col-span-1 flex justify-center">Actions</div>
        </div>
    );
}

function ShortUrlTableRow({ url }: { url: Url }) {
    const [copied, setCopied] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const copyToClipboard = async (text: string) => {
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            setCopied(true);
            timeoutRef.current = setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleDelete = async (urlId: number) => {
        // TODO: Add confirmation dialog
        try {
            router.delete(`/api/urls/${urlId}`);
        } catch (error) {
            console.error('Failed to delete URL:', error);
        }
    };

    const isExpired = url.expires_at && new Date(url.expires_at) < new Date();
    const expiresIn = url.expires_at ? formatRelativeTime(url.expires_at) : null;

    const handleEdit = () => {
        setShowEditModal(true);
    };

    const handleEditSubmit = (data: Record<string, string>) => {
        // TODO: Call update API endpoint
        console.log('Updating URL with ID:', url.id, data);

        // Submit to backend
        router.put(`/api/urls/${url.id}`, data, {
            onSuccess: () => {
                setShowEditModal(false);
            },
            onError: (errors: Record<string, string>) => {
                console.error('Update failed:', errors);
            },
        });
    };

    return (
        <div className="group grid grid-cols-12 gap-4 px-3 py-3 text-sm border-b hover:bg-muted/50 transition-colors items-center even:bg-muted/25">
            <div className="col-span-4 sm:col-span-3">
                <Tooltip open={copied}>
                    <TooltipTrigger asChild>
                        <Button
                            variant="copy"
                            size="sm"
                            className="h-auto p-2 flex items-center gap-2"
                            onClick={() => copyToClipboard(url.short_url || `${window.location.origin}/${url.short_code}`)}
                            data-testid="copy-button"
                        >
                            <span className="font-mono text-sm">{url.short_code}</span>
                            <Copy className="h-3 w-3" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        Copied!
                    </TooltipContent>
                </Tooltip>
            </div>
            <div className="col-span-6 md:col-span-5 flex items-center gap-2">
                <a
                    href={url.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-foreground hover:underline transition-colors p-3 -m-3 rounded"
                    data-testid="external-link"
                >
                    <span className="truncate text-muted-foreground">{url.original_url}</span>
                    <ExternalLink className="h-3 w-3" />
                </a>
            </div>
            <div className="col-span-1 hidden md:block flex items-center">
                <span>{url.clicks}</span>
            </div>

            <div className="col-span-2 hidden sm:block flex flex-wrap items-center gap-1">
                {url.expires_at ? (
                    <>
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{expiresIn}</span>
                        </div>

                        {isExpired && (
                            <Badge variant="destructive" className="text-xs mt-1">
                                Expired
                            </Badge>
                        )}
                    </>
                ) : (
                    <Badge variant="secondary" className="text-xs">
                        Never
                    </Badge>
                )}
            </div>
            <div className="col-span-2 sm:col-span-1  flex items-center justify-center">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                        >
                            <span className="sr-only">Actions</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            variant="default"
                            onClick={handleEdit}
                        >
                            <Edit className="h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            variant="destructive"
                            onClick={() => handleDelete(url.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Edit Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Edit Short URL</DialogTitle>
                    </DialogHeader>
                    <ShortUrlForm
                        key={`edit-form-${url.id}`}
                        submitButtonText="Update URL"
                        initialData={{
                            url: url.original_url,
                            alias: url.short_code,
                            expires_at: url.expires_at ? new Date(url.expires_at).toISOString().slice(0, 16) : undefined,
                        }}
                        onSubmit={handleEditSubmit}
                        isEditMode={true}
                        className="p-0"
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function ShortUrlTable({ urls, className }: { urls: Pagination<Url>, className?: string }) {
    const showPagination = urls.last_page > 1;

    return (
        <div className={className}>
            <div className="overflow-hidden">
                <ShortUrlTableHeader />
                {urls.data.map((url) => (
                    <ShortUrlTableRow key={url.id} url={url} />
                ))}
                {urls.data.length === 0 && (
                    <div className="px-6 py-12 text-center text-muted-foreground">
                        <Link className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No URLs found</p>
                        <p className="text-sm">Create your first short URL to get started</p>
                    </div>
                )}
                {/* Pagination Info */}
                {showPagination && urls.data.length > 0 && (
                    <div className="px-3 py-4 border-t flex justify-between items-center">
                        <PaginationInfo pagination={urls} itemName="URLs" />
                        <PaginationControls pagination={urls} />
                    </div>
                )}
            </div>
        </div>
    );
}
