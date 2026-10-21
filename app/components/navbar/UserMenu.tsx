"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import SignOutButton from "./SignOutButton";

type AuthUser = {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
};

type Props = {
    user?: AuthUser | null;
};

function IconChevronDown({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
            <path
                d="m6 9 6 6 6-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconSettings({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
            <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.6" />
            <path
                d="M12 3.8v2M12 18.2v2M20.2 12h-2M5.8 12h-2M17.5 6.5l-1.4 1.4M7.9 16.1l-1.4 1.4M17.5 17.5l-1.4-1.4M7.9 7.9 6.5 6.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
        </svg>
    );
}

export default function AuthSection({ user }: Props) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") setOpen(false);
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    if (!user) {
        return (
            <div className="flex items-center gap-2">
                <Link
                    href="/login"
                    className="rounded-md px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                    Sign in
                </Link>

                <Link
                    href="/signup"
                    className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                >
                    Sign up
                </Link>
            </div>
        );
    }

    const displayName = user.name?.trim() || user.email || "User";
    const initial = displayName.charAt(0).toUpperCase();

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                aria-haspopup="menu"
                aria-expanded={open}
                className="flex min-w-0 items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 sm:pr-3"
            >
                {user.image ? (
                    <Image
                        src={user.image}
                        alt=""
                        width={36}
                        height={36}
                        className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                ) : (
                    <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-on-accent"
                        aria-hidden="true"
                    >
                        {initial}
                    </div>
                )}

                <span className="hidden max-w-32 truncate text-sm font-medium text-ink sm:block">
                    {displayName}
                </span>

                <IconChevronDown
                    className={`hidden h-4 w-4 shrink-0 text-muted transition-transform duration-150 sm:block ${open ? "rotate-180" : ""
                        }`}
                />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
                >
                    <div className="border-b border-line px-4 py-3">
                        <p
                            className="truncate text-sm font-medium text-ink"
                            title={displayName}
                        >
                            {displayName}
                        </p>

                        {user.email && (
                            <p className="mt-0.5 truncate text-xs text-muted">
                                {user.email}
                            </p>
                        )}
                    </div>

                    <div className="py-1.5">
                        <Link
                            href="/settings"
                            role="menuitem"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-2 transition-colors hover:bg-canvas"
                        >
                            <IconSettings className="h-4 w-4 text-muted" />
                            Settings
                        </Link>
                    </div>

                    <div
                        role="menuitem"
                        onClick={() => setOpen(false)}
                        className="border-t border-line px-2 py-1.5"
                    >
                        <SignOutButton />
                    </div>
                </div>
            )}
        </div>
    );
}