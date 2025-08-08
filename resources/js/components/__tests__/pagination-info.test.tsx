import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PaginationInfo } from '@/components/ui/pagination-info';
import { type Pagination } from '@/types';

// Helper to create mock pagination data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createMockPagination(overrides: Partial<Pagination<any>> = {}): Pagination<any> {
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

describe('PaginationInfo', () => {
    describe('Empty results', () => {
        it('shows "No results found" when total is 0', () => {
            const pagination = createMockPagination({ total: 0, from: 0, to: 0 });
            render(<PaginationInfo pagination={pagination} />);

            expect(screen.getByText('No results found')).toBeInTheDocument();
        });

        it('shows custom item name when total is 0', () => {
            const pagination = createMockPagination({ total: 0, from: 0, to: 0 });
            render(<PaginationInfo pagination={pagination} itemName="URLs" />);

            expect(screen.getByText('No URLs found')).toBeInTheDocument();
        });
    });

    describe('Single page results', () => {
        it('shows "Showing 1 result" for single item', () => {
            const pagination = createMockPagination({
                total: 1,
                from: 1,
                to: 1,
                current_page: 1,
                last_page: 1
            });
            render(<PaginationInfo pagination={pagination} />);

            expect(screen.getByText('Showing 1 result')).toBeInTheDocument();
        });

        it('shows "Showing X results" for multiple items on single page', () => {
            const pagination = createMockPagination({
                total: 5,
                from: 1,
                to: 5,
                current_page: 1,
                last_page: 1
            });
            render(<PaginationInfo pagination={pagination} />);

            expect(screen.getByText('Showing 5 results')).toBeInTheDocument();
        });

        it('shows custom item name for single page', () => {
            const pagination = createMockPagination({
                total: 3,
                from: 1,
                to: 3,
                current_page: 1,
                last_page: 1
            });
            render(<PaginationInfo pagination={pagination} itemName="URLs" />);

            expect(screen.getByText('Showing 3 URLs')).toBeInTheDocument();
        });

        it('handles singular form correctly for custom item name', () => {
            const pagination = createMockPagination({
                total: 1,
                from: 1,
                to: 1,
                current_page: 1,
                last_page: 1
            });
            render(<PaginationInfo pagination={pagination} itemName="URLs" />);

            expect(screen.getByText('Showing 1 URL')).toBeInTheDocument();
        });
    });

    describe('Paginated results', () => {
        it('shows range for first page of multiple pages', () => {
            const pagination = createMockPagination({
                total: 25,
                from: 1,
                to: 10,
                current_page: 1,
                last_page: 3,
                per_page: 10
            });
            render(<PaginationInfo pagination={pagination} />);

            expect(screen.getByText('Showing 1-10 of 25 results')).toBeInTheDocument();
        });

        it('shows range for middle page', () => {
            const pagination = createMockPagination({
                total: 25,
                from: 11,
                to: 20,
                current_page: 2,
                last_page: 3,
                per_page: 10
            });
            render(<PaginationInfo pagination={pagination} />);

            expect(screen.getByText('Showing 11-20 of 25 results')).toBeInTheDocument();
        });

        it('shows range for last page with partial results', () => {
            const pagination = createMockPagination({
                total: 25,
                from: 21,
                to: 25,
                current_page: 3,
                last_page: 3,
                per_page: 10
            });
            render(<PaginationInfo pagination={pagination} />);

            expect(screen.getByText('Showing 21-25 of 25 results')).toBeInTheDocument();
        });

        it('formats large numbers with commas', () => {
            const pagination = createMockPagination({
                total: 12345,
                from: 1001,
                to: 1010,
                current_page: 101,
                last_page: 1235,
                per_page: 10
            });
            render(<PaginationInfo pagination={pagination} />);

            expect(screen.getByText('Showing 1,001-1,010 of 12,345 results')).toBeInTheDocument();
        });

        it('uses custom item name for paginated results', () => {
            const pagination = createMockPagination({
                total: 25,
                from: 1,
                to: 10,
                current_page: 1,
                last_page: 3,
                per_page: 10
            });
            render(<PaginationInfo pagination={pagination} itemName="URLs" />);

            expect(screen.getByText('Showing 1-10 of 25 URLs')).toBeInTheDocument();
        });
    });

    describe('Styling', () => {
        it('applies default classes', () => {
            const pagination = createMockPagination({ total: 5, from: 1, to: 5 });
            render(<PaginationInfo pagination={pagination} />);

            const element = screen.getByText('Showing 5 results');
            expect(element).toHaveClass('text-sm', 'text-muted-foreground');
        });

        it('applies custom className', () => {
            const pagination = createMockPagination({ total: 5, from: 1, to: 5 });
            render(<PaginationInfo pagination={pagination} className="custom-class" />);

            const element = screen.getByText('Showing 5 results');
            expect(element).toHaveClass('custom-class', 'text-sm', 'text-muted-foreground');
        });
    });
});
