import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Pagination<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

// Laravel Model Types
export interface Url {
    id: number;
    original_url: string;
    short_code: string;
    user_id: number;
    clicks: number;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
    short_url?: string;
    user?: User;
    [key: string]: unknown; // Allow for additional properties
}

// Inertia.js Page Props
export interface PageProps {
    auth: Auth;
    [key: string]: unknown;
}

// Dashboard specific props
export interface DashboardProps extends PageProps {
    urls: Pagination<Url>;
}
