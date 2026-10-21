"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type NavigationItem = {
    label: string;
    href: string;
};

type Props = {
    navigation: readonly NavigationItem[];
    children: React.ReactNode;
};

function MenuIcon({ open }: { open: boolean }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            aria-hidden="true"
        >
            {open ? (
                <>
                    <path d="M6 6l12 12" strokeLinecap="round" />
                    <path d="M18 6L6 18" strokeLinecap="round" />
                </>
            ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
        </svg>
    );
}

export default function MobileNavigation({ navigation, children }: Props) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        const originalOverflow = document.body.style.overflow;

        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 768px)");

        const handleChange = (event: MediaQueryListEvent) => {
            if (event.matches) {
                setOpen(false);
            }
        };

        mediaQuery.addEventListener("change", handleChange);

        return () => {
            mediaQuery.removeEventListener("change", handleChange);
        };
    }, []);

    const closeMenu = () => {
        setOpen(false);
    };

    return (
        <div className="md:hidden">
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-accent transition-colors hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                aria-label={open ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={open}
                aria-controls="mobile-navigation"
            >
                <MenuIcon open={open} />
            </button>

            {/* Backdrop */}
            <div
                aria-hidden="true"
                onClick={closeMenu}
                className={`fixed inset-0 top-16 z-30 bg-ink/30 backdrop-blur-[1px] transition-opacity duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
            />

            {/* Panel */}
            <div
                id="mobile-navigation"
                aria-hidden={!open}
                className={`absolute inset-x-0 top-full z-40 origin-top rounded-b-2xl border-b border-line bg-canvas px-4 py-5 shadow-lg transition-all duration-200 ease-out sm:px-8 md:hidden ${open
                        ? "translate-y-0 opacity-100"
                        : "pointer-events-none -translate-y-2 opacity-0"
                    }`}
            >
                <div className="mx-auto max-w-5xl">
                    <ul className="flex flex-col gap-1">
                        {navigation.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    onClick={closeMenu}
                                    tabIndex={open ? 0 : -1}
                                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                                >
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-4 border-t border-line pt-4">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}