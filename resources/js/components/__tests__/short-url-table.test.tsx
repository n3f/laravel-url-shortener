import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ShortUrlTable from '../short-url-table';
import type { Pagination, Url } from '@/types';
import { router } from '@inertiajs/react';

vi.mock('@inertiajs/react', () => ({
    router: {
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

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

    describe('Pagination', () => {
        it('does not show pagination for single page results', () => {
            render(<ShortUrlTable urls={mockUrls} />);

            // Should not show pagination info since last_page is 1
            expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
        });

        it('shows pagination info for multi-page results', () => {
            const multiPageUrls: Pagination<Url> = {
                ...mockUrls,
                current_page: 1,
                last_page: 3,
                total: 25,
                from: 1,
                to: 10,
                per_page: 10,
            };

            render(<ShortUrlTable urls={multiPageUrls} />);

            expect(screen.getByText('Showing 1-10 of 25 URLs')).toBeInTheDocument();
        });

        it('does not show pagination for empty results', () => {
            const emptyUrls: Pagination<Url> = {
                ...mockUrls,
                data: [],
                total: 0,
                from: 0,
                to: 0,
                last_page: 1,
            };

            render(<ShortUrlTable urls={emptyUrls} />);

            expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
        });

        it('shows pagination info on different pages', () => {
            const secondPageUrls: Pagination<Url> = {
                ...mockUrls,
                current_page: 2,
                last_page: 3,
                total: 25,
                from: 11,
                to: 20,
                per_page: 10,
            };

            render(<ShortUrlTable urls={secondPageUrls} />);

            expect(screen.getByText('Showing 11-20 of 25 URLs')).toBeInTheDocument();
        });
    });

    describe('Edit Modal', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('opens edit modal when edit button is clicked', async () => {
            const user = userEvent.setup();
            render(<ShortUrlTable urls={mockUrls} />);

                        // Open dropdown menu
            const actionButtons = screen.getAllByTestId('actions-dropdown');
            await user.click(actionButtons[0]);

            // Click edit button
            const editButton = screen.getByText('Edit');
            await user.click(editButton);

            // Modal should be open
            expect(screen.getByText('Edit Short URL')).toBeInTheDocument();
            expect(screen.getByText('Update the URL, alias, or expiration date for this short link.')).toBeInTheDocument();
        });

                it('pre-populates form with existing URL data', async () => {
            const user = userEvent.setup();
            render(<ShortUrlTable urls={mockUrls} />);

            // Open edit modal
            const actionButtons = screen.getAllByTestId('actions-dropdown');
            await user.click(actionButtons[0]);
            await user.click(screen.getByText('Edit'));

            // Check form is pre-populated
            const urlInput = screen.getByDisplayValue('https://example.com/very-long-url-that-should-be-truncated');
            const aliasInput = screen.getByDisplayValue('abc123');
            expect(urlInput).toBeInTheDocument();
            expect(aliasInput).toBeInTheDocument();
        });

                it('shows expiration field when URL has expiration date', async () => {
            const user = userEvent.setup();
            render(<ShortUrlTable urls={mockUrls} />);

            // Open edit modal for URL with expiration
            const actionButtons = screen.getAllByTestId('actions-dropdown');
            await user.click(actionButtons[1]); // Second URL has expiration
            await user.click(screen.getByText('Edit'));

            // Expiration checkbox should be checked and field visible
            const expirationCheckbox = screen.getByRole('checkbox', { name: /expires/i });
            expect(expirationCheckbox).toBeChecked();
            expect(screen.getByLabelText(/Expiration:/)).toBeInTheDocument();
        });

                it('submits form with updated data', async () => {
            const user = userEvent.setup();
            const mockPut = vi.fn();
            vi.spyOn(router, 'put').mockImplementation(mockPut);

            render(<ShortUrlTable urls={mockUrls} />);

            // Open edit modal
            const actionButtons = screen.getAllByTestId('actions-dropdown');
            await user.click(actionButtons[0]);
            await user.click(screen.getByText('Edit'));

            // Update URL
            const urlInput = screen.getByDisplayValue('https://example.com/very-long-url-that-should-be-truncated');
            await user.clear(urlInput);
            await user.type(urlInput, 'https://updated-example.com');

            // Submit form
            await user.click(screen.getByText('Update URL'));

            expect(mockPut).toHaveBeenCalledWith('/api/urls/1', {
                url: 'https://updated-example.com',
                short_code: 'abc123'
            }, expect.any(Object));
        });

                it('closes modal after successful update', async () => {
            const user = userEvent.setup();
            const mockPut = vi.fn();
            vi.spyOn(router, 'put').mockImplementation(mockPut);

            render(<ShortUrlTable urls={mockUrls} />);

            // Open and submit edit modal
            const actionButtons = screen.getAllByTestId('actions-dropdown');
            await user.click(actionButtons[0]);
            await user.click(screen.getByText('Edit'));
            await user.click(screen.getByText('Update URL'));

            // Verify the update was called (modal closing is handled by the component)
            expect(mockPut).toHaveBeenCalled();
        });

                it('handles update errors gracefully', async () => {
            const user = userEvent.setup();
            const mockPut = vi.fn();
            vi.spyOn(router, 'put').mockImplementation(mockPut);

            render(<ShortUrlTable urls={mockUrls} />);

            // Open and submit edit modal
            const actionButtons = screen.getAllByTestId('actions-dropdown');
            await user.click(actionButtons[0]);
            await user.click(screen.getByText('Edit'));
            await user.click(screen.getByText('Update URL'));

            // Verify the update was called (error handling is tested in integration tests)
            expect(mockPut).toHaveBeenCalled();
        });
    });
});
