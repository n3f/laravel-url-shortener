import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ShortUrlTable from '../short-url-table';
import type { Pagination, Url } from '@/types';

const mockUrls: Pagination<Url> = {
    data: [
        {
            id: 1,
            original_url: 'https://example.com/very-long-url-that-should-be-truncated',
            short_code: 'abc123',
            user_id: 1,
            clicks: 42,
            expires_at: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            short_url: 'http://localhost/abc123',
        },
        {
            id: 2,
            original_url: 'https://google.com',
            short_code: 'xyz789',
            user_id: 1,
            clicks: 15,
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            short_url: 'http://localhost/xyz789',
        },
    ],
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 2,
    from: 1,
    to: 2,
    links: [],
};

const expiredUrl: Url = {
    id: 3,
    original_url: 'https://expired.com',
    short_code: 'exp123',
    user_id: 1,
    clicks: 5,
    expires_at: '2020-01-01T00:00:00Z', // Past date
    created_at: '2020-01-01T00:00:00Z',
    updated_at: '2020-01-01T00:00:00Z',
    short_url: 'http://localhost/exp123',
};

describe('ShortUrlTable', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders table with URLs', () => {
        render(<ShortUrlTable urls={mockUrls} />);

        // Check headers
        expect(screen.getByText('Short URL')).toBeInTheDocument();
        expect(screen.getByText('Original URL')).toBeInTheDocument();
        expect(screen.getByText('Clicks')).toBeInTheDocument();
        expect(screen.getByText('Expires')).toBeInTheDocument();

        // Check URL data
        expect(screen.getByText('abc123')).toBeInTheDocument();
        expect(screen.getByText('xyz789')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('shows empty state when no URLs', () => {
        const emptyUrls: Pagination<Url> = {
            ...mockUrls,
            data: [],
            total: 0,
            to: 0,
        };

        render(<ShortUrlTable urls={emptyUrls} />);

        expect(screen.getByText('No URLs found')).toBeInTheDocument();
        expect(screen.getByText('Create your first short URL to get started')).toBeInTheDocument();
    });

    it('handles copy button click', async () => {
        const user = userEvent.setup();
        const mockWriteText = vi.fn().mockResolvedValue(undefined);

        // Mock clipboard using vi.spyOn
        vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(mockWriteText);

        render(<ShortUrlTable urls={mockUrls} />);

        const copyButtons = screen.getAllByTestId('copy-button');
        await user.click(copyButtons[0]);

        expect(mockWriteText).toHaveBeenCalledWith('http://localhost/abc123');
    });

    it('renders external links with correct attributes', () => {
        render(<ShortUrlTable urls={mockUrls} />);

        const externalLinks = screen.getAllByTestId('external-link');
        expect(externalLinks).toHaveLength(2);

        // Check first link attributes
        expect(externalLinks[0]).toHaveAttribute('href', 'https://example.com/very-long-url-that-should-be-truncated');
        expect(externalLinks[0]).toHaveAttribute('target', '_blank');
        expect(externalLinks[0]).toHaveAttribute('rel', 'noopener noreferrer');

        // Check second link attributes
        expect(externalLinks[1]).toHaveAttribute('href', 'https://google.com');
        expect(externalLinks[1]).toHaveAttribute('target', '_blank');
        expect(externalLinks[1]).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('shows "Never" badge for URLs without expiration', () => {
        render(<ShortUrlTable urls={mockUrls} />);

        expect(screen.getByText('Never')).toBeInTheDocument();
    });

    it('shows expiration time for URLs with future expiration', () => {
        render(<ShortUrlTable urls={mockUrls} />);

        // Should show relative time like "1y from now" or similar
        expect(screen.getByText(/from now/)).toBeInTheDocument();
    });

    it('shows "Expired" badge for expired URLs', () => {
        const urlsWithExpired: Pagination<Url> = {
            ...mockUrls,
            data: [expiredUrl],
            total: 1,
            to: 1,
        };

        render(<ShortUrlTable urls={urlsWithExpired} />);

        expect(screen.getByText('Expired')).toBeInTheDocument();
        expect(screen.getByText(/ago/)).toBeInTheDocument();
    });

    it('shows both expiration time and expired badge for expired URLs', () => {
        const urlsWithExpired: Pagination<Url> = {
            ...mockUrls,
            data: [expiredUrl],
            total: 1,
            to: 1,
        };

        render(<ShortUrlTable urls={urlsWithExpired} />);

        // Should show both the relative time AND the expired badge
        expect(screen.getByText(/ago/)).toBeInTheDocument();
        expect(screen.getByText('Expired')).toBeInTheDocument();
    });
});
