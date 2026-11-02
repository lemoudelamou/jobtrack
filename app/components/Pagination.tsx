"use client";

import {
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

type PaginationProps = {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    itemLabel?: string;
};

function getPageItems(
    currentPage: number,
    totalPages: number,
): Array<number | "ellipsis"> {
    if (totalPages <= 7) {
        return Array.from(
            { length: totalPages },
            (_, index) => index + 1,
        );
    }

    if (currentPage <= 3) {
        return [
            1,
            2,
            3,
            4,
            5,
            "ellipsis",
            totalPages,
        ];
    }

    if (currentPage >= totalPages - 2) {
        return [
            1,
            "ellipsis",
            totalPages - 4,
            totalPages - 3,
            totalPages - 2,
            totalPages - 1,
            totalPages,
        ];
    }

    return [
        1,
        "ellipsis",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "ellipsis",
        totalPages,
    ];
}

export default function Pagination({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    itemLabel = "items",
}: PaginationProps) {
    const totalPages = Math.max(
        1,
        Math.ceil(
            totalItems / itemsPerPage,
        ),
    );

    if (totalItems === 0) {
        return null;
    }

    const safeCurrentPage = Math.min(
        Math.max(currentPage, 1),
        totalPages,
    );

    const startItem =
        (safeCurrentPage - 1) *
        itemsPerPage +
        1;

    const endItem = Math.min(
        safeCurrentPage * itemsPerPage,
        totalItems,
    );

    const pageItems = getPageItems(
        safeCurrentPage,
        totalPages,
    );

    function changePage(page: number) {
        if (
            page < 1 ||
            page > totalPages ||
            page === safeCurrentPage
        ) {
            return;
        }

        onPageChange(page);
    }

    return (
        <div className="border-t border-line bg-canvas px-5 py-3.5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Summary */}
                <p className="text-xs font-medium text-muted">
                    Showing{" "}
                    <span className="font-semibold text-ink-2">
                        {startItem}–{endItem}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-ink-2">
                        {totalItems}
                    </span>{" "}
                    {itemLabel}
                </p>

                {/* Controls */}
                <div className="flex items-center justify-between gap-1.5 sm:justify-end">
                    {/* Previous */}
                    <button
                        type="button"
                        onClick={() =>
                            changePage(
                                safeCurrentPage -
                                1,
                            )
                        }
                        disabled={
                            safeCurrentPage ===
                            1
                        }
                        className="group flex h-8 items-center gap-1 rounded-lg border border-line bg-surface px-2.5 text-xs font-semibold text-ink-2 shadow-sm transition-all duration-200 hover:-translate-x-0.5 hover:border-line hover:bg-canvas hover:text-accent active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                        aria-label="Previous page"
                    >
                        <ChevronLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
                        <span className="hidden sm:inline">
                            Previous
                        </span>
                    </button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                        {pageItems.map(
                            (
                                item,
                                index,
                            ) => {
                                if (
                                    item ===
                                    "ellipsis"
                                ) {
                                    return (
                                        <span
                                            key={`ellipsis-${index}`}
                                            className="flex h-8 w-7 items-center justify-center text-xs font-semibold text-faint"
                                        >
                                            …
                                        </span>
                                    );
                                }

                                const isActive =
                                    item ===
                                    safeCurrentPage;

                                return (
                                    <button
                                        key={
                                            item
                                        }
                                        type="button"
                                        onClick={() =>
                                            changePage(
                                                item,
                                            )
                                        }
                                        aria-current={
                                            isActive
                                                ? "page"
                                                : undefined
                                        }
                                        aria-label={`Go to page ${item}`}
                                        className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 ${isActive
                                                ? "bg-accent text-on-accent shadow-[0_4px_12px_rgba(var(--accent-rgb),0.18)]"
                                                : "border border-transparent text-ink-2 hover:-translate-y-px hover:border-line hover:bg-surface hover:text-accent hover:shadow-sm"
                                            }`}
                                    >
                                        {item}
                                    </button>
                                );
                            },
                        )}
                    </div>

                    {/* Next */}
                    <button
                        type="button"
                        onClick={() =>
                            changePage(
                                safeCurrentPage +
                                1,
                            )
                        }
                        disabled={
                            safeCurrentPage ===
                            totalPages
                        }
                        className="group flex h-8 items-center gap-1 rounded-lg border border-line bg-surface px-2.5 text-xs font-semibold text-ink-2 shadow-sm transition-all duration-200 hover:translate-x-0.5 hover:border-line hover:bg-canvas hover:text-accent active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                        aria-label="Next page"
                    >
                        <span className="hidden sm:inline">
                            Next
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}