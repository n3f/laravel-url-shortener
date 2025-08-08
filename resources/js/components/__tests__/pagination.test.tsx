import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaginationControls } from '@/components/ui/pagination';
import { type Pagination } from '@/types';

// Mock Inertia router
vi.mock('@inertiajs/react', () => ({
    router: {
        get: vi.fn(),
    },
}));

import { router } from '@inertiajs/react';

// Helper to create mock pagination data
function createMockPagination(overrides: Partial<Pagination<unknown>> = {}): Pagination<unknown> {
    return {
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0,
        links: [],
        ...overrides,
    };
}

// Mock window.location
const mockLocation = {
    href: 'http://localhost/dashboard',
    pathname: '/dashboard',
    search: '',
};

Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true,
});

describe('PaginationControls', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset location mock
        mockLocation.href = 'http://localhost/dashboard';
        mockLocation.pathname = '/dashboard';
        mockLocation.search = '';
    });

    describe('Rendering', () => {
        it('does not render when last_page is 1', () => {
            const pagination = createMockPagination({ last_page: 1 });
            const { container } = render(<PaginationControls pagination={pagination} />);

            expect(container.firstChild).toBeNull();
        });

        it('renders basic pagination controls', () => {
            const pagination = createMockPagination({
                current_page: 1,
                last_page: 3,
                total: 25
            });
            render(<PaginationControls pagination={pagination} />);

            expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument();
            expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
            expect(screen.getByText('1')).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument();
            expect(screen.getByText('3')).toBeInTheDocument();
        });

        it('shows first/last buttons when showFirstLast is true', () => {
            const pagination = createMockPagination({
                current_page: 2,
                last_page: 5,
                total: 50
            });
            render(<PaginationControls pagination={pagination} showFirstLast />);

            expect(screen.getByLabelText('Go to first page')).toBeInTheDocument();
            expect(screen.getByLabelText('Go to last page')).toBeInTheDocument();
        });

        it('does not show first button on first page', () => {
            const pagination = createMockPagination({
                current_page: 1,
                last_page: 5,
                total: 50
            });
            render(<PaginationControls pagination={pagination} showFirstLast />);

            expect(screen.queryByLabelText('Go to first page')).not.toBeInTheDocument();
            expect(screen.getByLabelText('Go to last page')).toBeInTheDocument();
        });

        it('does not show last button on last page', () => {
            const pagination = createMockPagination({
                current_page: 5,
                last_page: 5,
                total: 50
            });
            render(<PaginationControls pagination={pagination} showFirstLast />);

            expect(screen.getByLabelText('Go to first page')).toBeInTheDocument();
            expect(screen.queryByLabelText('Go to last page')).not.toBeInTheDocument();
        });
    });

    describe('Page number display', () => {
        it('shows all page numbers when total pages <= 5', () => {
            const pagination = createMockPagination({
                current_page: 1,
                last_page: 3,
                total: 30
            });
            render(<PaginationControls pagination={pagination} />);

            expect(screen.getByText('1')).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument();
            expect(screen.getByText('3')).toBeInTheDocument();
            expect(screen.queryByTestId('ellipsis')).not.toBeInTheDocument();
        });

                it('shows ellipsis for large page ranges', () => {
            const pagination = createMockPagination({
                current_page: 1,
                last_page: 10,
                total: 100
            });
            render(<PaginationControls pagination={pagination} />);

            // Should show: 1, 2, 3, 4, ..., 10 (based on actual logic)
            expect(screen.getByText('1')).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument();
            expect(screen.getByText('3')).toBeInTheDocument();
            expect(screen.getByText('4')).toBeInTheDocument();
            expect(screen.getByText('10')).toBeInTheDocument();

            // Check for ellipsis (MoreHorizontal icon)
            const ellipsisElements = screen.getAllByRole('generic').filter(el =>
                el.querySelector('svg') && el.textContent === ''
            );
            expect(ellipsisElements.length).toBeGreaterThan(0);
        });

        it('highlights current page', () => {
            const pagination = createMockPagination({
                current_page: 2,
                last_page: 5,
                total: 50
            });
            render(<PaginationControls pagination={pagination} />);

            const currentPageButton = screen.getByText('2');
            expect(currentPageButton).toHaveAttribute('aria-current', 'page');
            expect(currentPageButton).toHaveClass('bg-primary'); // default variant
        });

        it('shows non-current pages with outline variant', () => {
            const pagination = createMockPagination({
                current_page: 2,
                last_page: 5,
                total: 50
            });
            render(<PaginationControls pagination={pagination} />);

            const otherPageButton = screen.getByText('1');
            expect(otherPageButton).not.toHaveAttribute('aria-current');
            expect(otherPageButton).toHaveClass('border-input'); // outline variant
        });
    });

    describe('Navigation', () => {
        it('calls router.get with correct page parameter', async () => {
            const user = userEvent.setup();
            const pagination = createMockPagination({
                current_page: 1,
                last_page: 3,
                total: 30
            });
            render(<PaginationControls pagination={pagination} />);

            const page2Button = screen.getByText('2');
            await user.click(page2Button);

            expect(router.get).toHaveBeenCalledWith('/dashboard?page=2');
        });

                it('preserves existing query parameters', async () => {
            const user = userEvent.setup();
            mockLocation.href = 'http://localhost/dashboard?filter=active&sort=name';
            mockLocation.search = '?filter=active&sort=name';

            const pagination = createMockPagination({
                current_page: 1,
                last_page: 3,
                total: 30
            });
            render(<PaginationControls pagination={pagination} />);

            const page2Button = screen.getByText('2');
            await user.click(page2Button);

            expect(router.get).toHaveBeenCalledWith('/dashboard?filter=active&sort=name&page=2');
        });

        it('does not navigate when clicking current page', async () => {
            const user = userEvent.setup();
            const pagination = createMockPagination({
                current_page: 2,
                last_page: 3,
                total: 30
            });
            render(<PaginationControls pagination={pagination} />);

            const currentPageButton = screen.getByText('2');
            await user.click(currentPageButton);

            expect(router.get).not.toHaveBeenCalled();
        });

        it('navigates to previous page', async () => {
            const user = userEvent.setup();
            const pagination = createMockPagination({
                current_page: 2,
                last_page: 3,
                total: 30
            });
            render(<PaginationControls pagination={pagination} />);

            const prevButton = screen.getByLabelText('Go to previous page');
            await user.click(prevButton);

            expect(router.get).toHaveBeenCalledWith('/dashboard?page=1');
        });

        it('navigates to next page', async () => {
            const user = userEvent.setup();
            const pagination = createMockPagination({
                current_page: 2,
                last_page: 3,
                total: 30
            });
            render(<PaginationControls pagination={pagination} />);

            const nextButton = screen.getByLabelText('Go to next page');
            await user.click(nextButton);

            expect(router.get).toHaveBeenCalledWith('/dashboard?page=3');
        });

        it('navigates to first page', async () => {
            const user = userEvent.setup();
            const pagination = createMockPagination({
                current_page: 3,
                last_page: 5,
                total: 50
            });
            render(<PaginationControls pagination={pagination} showFirstLast />);

            const firstButton = screen.getByLabelText('Go to first page');
            await user.click(firstButton);

            expect(router.get).toHaveBeenCalledWith('/dashboard?page=1');
        });

        it('navigates to last page', async () => {
            const user = userEvent.setup();
            const pagination = createMockPagination({
                current_page: 1,
                last_page: 5,
                total: 50
            });
            render(<PaginationControls pagination={pagination} showFirstLast />);

            const lastButton = screen.getByLabelText('Go to last page');
            await user.click(lastButton);

            expect(router.get).toHaveBeenCalledWith('/dashboard?page=5');
        });
    });

    describe('Disabled states', () => {
        it('disables previous button on first page', () => {
            const pagination = createMockPagination({
                current_page: 1,
                last_page: 3,
                total: 30
            });
            render(<PaginationControls pagination={pagination} />);

            const prevButton = screen.getByLabelText('Go to previous page');
            expect(prevButton).toBeDisabled();
        });

        it('disables next button on last page', () => {
            const pagination = createMockPagination({
                current_page: 3,
                last_page: 3,
                total: 30
            });
            render(<PaginationControls pagination={pagination} />);

            const nextButton = screen.getByLabelText('Go to next page');
            expect(nextButton).toBeDisabled();
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA labels', () => {
            const pagination = createMockPagination({
                current_page: 2,
                last_page: 5,
                total: 50
            });
            render(<PaginationControls pagination={pagination} showFirstLast />);

            expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument();
            expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
            expect(screen.getByLabelText('Go to first page')).toBeInTheDocument();
            expect(screen.getByLabelText('Go to last page')).toBeInTheDocument();
            expect(screen.getByLabelText('Go to page 1')).toBeInTheDocument();
            expect(screen.getByLabelText('Go to page 2')).toBeInTheDocument();
        });

        it('marks current page with aria-current', () => {
            const pagination = createMockPagination({
                current_page: 2,
                last_page: 5,
                total: 50
            });
            render(<PaginationControls pagination={pagination} />);

            const currentPageButton = screen.getByText('2');
            expect(currentPageButton).toHaveAttribute('aria-current', 'page');
        });
    });

    describe('Styling', () => {
        it('applies default classes', () => {
            const pagination = createMockPagination({
                current_page: 1,
                last_page: 3,
                total: 30
            });
            render(<PaginationControls pagination={pagination} />);

            const container = screen.getByText('1').closest('div');
            expect(container).toHaveClass('flex', 'items-center', 'gap-1');
        });

                it('applies custom className', () => {
            const pagination = createMockPagination({
                current_page: 1,
                last_page: 3,
                total: 30
            });
            render(<PaginationControls pagination={pagination} className="custom-class" />);

            // The className is applied to the outer container, not the inner page numbers container
            const container = screen.getByText('1').closest('div')?.parentElement;
            expect(container).toHaveClass('custom-class', 'flex', 'items-center', 'gap-1');
        });
    });
});
