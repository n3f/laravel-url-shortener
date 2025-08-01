import { type Pagination, type Url } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, ExternalLink, Calendar, Link } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

// Simple date formatting function
function formatRelativeTime(date: string | Date): string {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor(Math.abs(now.getTime() - targetDate.getTime()) / 1000);
    const isFuture = targetDate > now;

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ${isFuture ? 'from now' : 'ago'}`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ${isFuture ? 'from now' : 'ago'}`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ${isFuture ? 'from now' : 'ago'}`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ${isFuture ? 'from now' : 'ago'}`;
    return `${Math.floor(diffInSeconds / 31536000)}y ${isFuture ? 'from now' : 'ago'}`;
}

function ShortUrlTableHeader() {
    return (
        <div className="grid grid-cols-12 gap-4 px-6 py-3 text-sm text-muted-foreground font-bold border-b">
            <div className="col-span-3 md:col-span-3 lg:col-span-3">Short URL</div>
            <div className="col-span-6 md:col-span-5 lg:col-span-6">Original URL</div>
            <div className="col-span-1 hidden md:block md:col-span-1 lg:col-span-1">Clicks</div>
            <div className="col-span-3 md:col-span-3 lg:col-span-2">Expires</div>
        </div>
    );
}

function ShortUrlTableRow({ url }: { url: Url }) {
    const [copied, setCopied] = useState(false);
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

    const isExpired = url.expires_at && new Date(url.expires_at) < new Date();
    const expiresIn = url.expires_at ? formatRelativeTime(url.expires_at) : null;

    return (
        <div className="grid grid-cols-12 gap-4 px-6 py-4 text-sm border-b hover:bg-muted/50 transition-colors items-center">
            <div className="col-span-3 md:col-span-3 lg:col-span-3 flex items-center gap-2">
                <Link className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">{url.short_code}</span>
                <Tooltip open={copied}>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(url.short_url || `${window.location.origin}/${url.short_code}`)}
                        >
                            <Copy className="h-3 w-3" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        Copied!
                    </TooltipContent>
                </Tooltip>
            </div>
            <div className="col-span-6 md:col-span-5 lg:col-span-6 flex items-center gap-2">
                <span className="truncate text-muted-foreground">{url.original_url}</span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => window.open(url.original_url, '_blank')}
                >
                    <ExternalLink className="h-3 w-3" />
                </Button>
            </div>
            <div className="col-span-1 hidden md:block md:col-span-1 lg:col-span-1 flex items-center">
                <span className="">{url.clicks}</span>
            </div>

            <div className="col-span-3 md:col-span-3 lg:col-span-2 flex items-center gap-2">
                {url.expires_at ? (
                    <>
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <div className="flex flex-col">
                            <span className="text-muted-foreground">{expiresIn}</span>
                            {isExpired && (
                                <Badge variant="destructive" className="text-xs">
                                    Expired
                                </Badge>
                            )}
                        </div>
                    </>
                ) : (
                    <Badge variant="secondary" className="text-xs">
                        Never
                    </Badge>
                )}
            </div>
        </div>
    );
}

export default function ShortUrlTable({ urls, className }: { urls: Pagination<Url>, className?: string }) {
    return (
        <div className={className}>
            <div className="overflow-hidden">
                <ShortUrlTableHeader />
                <div className="divide-y">
                    {urls.data.map((url) => (
                        <ShortUrlTableRow key={url.id} url={url} />
                    ))}
                </div>
                {urls.data.length === 0 && (
                    <div className="px-6 py-12 text-center text-muted-foreground">
                        <Link className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No URLs found</p>
                        <p className="text-sm">Create your first short URL to get started</p>
                    </div>
                )}
            </div>
        </div>
    );
}
