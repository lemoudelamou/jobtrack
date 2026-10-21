"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    CalendarDays,
    ChevronsUpDown,
    Globe,
    LayoutList,
    Menu,
    Radar,
    Settings,
    X,
} from "lucide-react";

import { Brand } from "@/app/components/Brand";
import SignOutButton from "@/app/components/navbar/SignOutButton";
import { cx } from "@/lib/ui";

type NavUser = {
    name: string | null;
    email: string | null;
    image: string | null;
};

const NAV_ITEMS = [
    {
        label: "Applications",
        href: "/dashboard",
        icon: LayoutList,
        match: ["/dashboard", "/jobs"],
    },
    {
        label: "Job radar",
        href: "/radar",
        icon: Radar,
        match: ["/radar"],
    },
    {
        label: "Calendar",
        href: "/calendar",
        icon: CalendarDays,
        match: ["/calendar"],
    },
    {
        label: "Job platforms",
        href: "/job-platforms",
        icon: Globe,
        match: ["/job-platforms"],
    },
] as const;

function isActive(pathname: string, match: readonly string[]) {
    return match.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
}

function NavLinks({
    onNavigate,
    orientation = "horizontal",
}: {
    onNavigate?: () => void;
    orientation?: "horizontal" | "vertical";
}) {
    const pathname = usePathname() ?? "";
    const horizontal = orientation === "horizontal";

    return (
        <ul
            className={cx(
                horizontal
                    ? "flex items-center gap-1 rounded-full border border-[var(--glass-line)] bg-[var(--glass)] p-1.5 backdrop-blur-xl"
                    : "space-y-1",
            )}
        >
            {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.match);
                const Icon = item.icon;

                return (
                    <li key={item.href}>
                        <Link
                            href={item.href}
                            onClick={onNavigate}
                            aria-current={active ? "page" : undefined}
                            className={cx(
                                "flex items-center gap-2 text-sm transition-colors",
                                horizontal ? "h-9 rounded-full px-4" : "h-11 rounded-2xl px-3",
                                active
                                    ? horizontal
                                        ? "bg-btn font-bold text-btn-fg shadow-[0_6px_20px_-8px_rgba(var(--accent-rgb),0.7)]"
                                        : "bg-[var(--glass-strong)] font-bold text-ink"
                                    : "font-semibold text-ink-2 hover:text-ink",
                            )}
                        >
                            <Icon
                                className={cx("h-4 w-4 shrink-0", active ? (horizontal ? "text-btn-fg" : "text-accent") : "text-muted", horizontal && "hidden xl:block")}
                                strokeWidth={1.75}
                            />
                            {item.label}
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

function Avatar({ user, size = 28 }: { user: NavUser; size?: number }) {
    const label = user.name?.trim() || user.email || "?";

    if (user.image) {
        return (
            <Image
                src={user.image}
                alt=""
                width={size}
                height={size}
                className="shrink-0 rounded-full object-cover"
                style={{ width: size, height: size }}
            />
        );
    }

    return (
        <span
            aria-hidden="true"
            className="flex shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#fde68a,#f472b6)] text-xs font-bold text-[#1e1b4b]"
            style={{ width: size, height: size }}
        >
            {label.charAt(0).toUpperCase()}
        </span>
    );
}

function AccountMenu({ user }: { user: NavUser }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const pathname = usePathname() ?? "";
    const displayName = user.name?.trim() || user.email || "Your account";

    useEffect(() => {
        if (!open) return;

        function onPointer(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        function onKey(event: KeyboardEvent) {
            if (event.key === "Escape") setOpen(false);
        }

        document.addEventListener("mousedown", onPointer);
        document.addEventListener("keydown", onKey);

        return () => {
            document.removeEventListener("mousedown", onPointer);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <div ref={ref} className="relative">
            {open && (
                <div
                    role="menu"
                    className="jt-pop absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-[var(--glass-line)] bg-surface/95 p-1.5 shadow-overlay backdrop-blur-xl"
                >
                    <div className="border-b border-line px-2.5 pb-2.5 pt-1.5">
                        <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
                        {user.email && <p className="truncate text-xs text-muted">{user.email}</p>}
                    </div>
                    <div className="h-1.5" />
                    <Link
                        href="/settings"
                        role="menuitem"
                        onClick={() => setOpen(false)}
                        aria-current={pathname.startsWith("/settings") ? "page" : undefined}
                        className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink"
                    >
                        <Settings className="h-4 w-4 text-muted" strokeWidth={1.75} />
                        Settings
                    </Link>
                    <SignOutButton />
                </div>
            )}

            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`Account: ${displayName}`}
                className="flex items-center gap-2 rounded-full border border-[var(--glass-line)] bg-[var(--glass)] py-1.5 pl-1.5 pr-3 backdrop-blur-xl transition-colors hover:bg-[var(--glass-strong)]"
            >
                <Avatar user={user} />
                <span className="hidden max-w-36 truncate text-sm font-medium text-ink md:block">{displayName}</span>
                <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-faint" strokeWidth={1.75} />
            </button>
        </div>
    );
}

function DrawerContents({ user, onNavigate }: { user: NavUser | null; onNavigate: () => void }) {
    return (
        <div className="flex h-full flex-col">
            <div className="flex h-16 items-center px-5">
                <Link href="/dashboard" onClick={onNavigate} className="rounded-md">
                    <Brand />
                </Link>
            </div>
            <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-2">
                <NavLinks onNavigate={onNavigate} orientation="vertical" />
            </nav>
            <div className="border-t border-line p-3">
                {user ? (
                    <div className="space-y-1">
                        <p className="truncate px-3 pt-1 text-sm font-semibold text-ink">{user.name || user.email}</p>
                        <Link
                            href="/settings"
                            onClick={onNavigate}
                            className="flex h-10 items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-ink-2 hover:bg-surface-2"
                        >
                            <Settings className="h-4 w-4 text-muted" strokeWidth={1.75} />
                            Settings
                        </Link>
                        <SignOutButton className="flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-ink-2 hover:bg-surface-2" />
                    </div>
                ) : (
                    <Link href="/login" className="flex h-10 items-center justify-center rounded-full bg-btn text-sm font-bold text-btn-fg">
                        Sign in
                    </Link>
                )}
            </div>
        </div>
    );
}

export default function AppNav({ user }: { user: NavUser | null }) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const pathname = usePathname();

    // Close the drawer whenever the route changes.
    const [lastPath, setLastPath] = useState(pathname);
    if (pathname !== lastPath) {
        setLastPath(pathname);
        setDrawerOpen(false);
    }

    useEffect(() => {
        if (!drawerOpen) return;

        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        function onKey(event: KeyboardEvent) {
            if (event.key === "Escape") setDrawerOpen(false);
        }

        document.addEventListener("keydown", onKey);

        return () => {
            document.body.style.overflow = previous;
            document.removeEventListener("keydown", onKey);
        };
    }, [drawerOpen]);

    return (
        <>
            <header className="sticky top-0 z-40">
                {/* Frosted backdrop on its own layer: its fade mask must not clip the account menu. */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-10 bg-canvas/55 backdrop-blur-2xl [mask-image:linear-gradient(to_bottom,black_85%,transparent)]"
                />
                <div className="mx-auto flex h-20 w-full max-w-[1520px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <Link href="/dashboard" className="shrink-0 rounded-md">
                        <Brand />
                    </Link>

                    <nav aria-label="Main" className="hidden lg:block">
                        <NavLinks />
                    </nav>

                    <div className="flex items-center gap-2">
                        <div className="hidden lg:block">
                            {user ? (
                                <AccountMenu user={user} />
                            ) : (
                                <Link href="/login" className="inline-flex h-9 items-center rounded-full bg-btn px-4 text-sm font-bold text-btn-fg">
                                    Sign in
                                </Link>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setDrawerOpen(true)}
                            aria-label="Open menu"
                            aria-expanded={drawerOpen}
                            aria-controls="mobile-drawer"
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--glass-line)] bg-[var(--glass)] text-ink backdrop-blur-xl hover:bg-[var(--glass-strong)] lg:hidden"
                        >
                            <Menu className="h-4.5 w-4.5" strokeWidth={1.75} />
                        </button>
                    </div>
                </div>
            </header>

            {drawerOpen && (
                <div className="fixed inset-0 z-50 lg:hidden" id="mobile-drawer">
                    <button
                        type="button"
                        aria-label="Close menu"
                        onClick={() => setDrawerOpen(false)}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Menu"
                        className="jt-sheet absolute inset-y-0 right-0 w-72 max-w-[85vw] border-l border-line bg-surface shadow-overlay"
                    >
                        <button
                            type="button"
                            onClick={() => setDrawerOpen(false)}
                            aria-label="Close menu"
                            className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                        >
                            <X className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                        <DrawerContents user={user} onNavigate={() => setDrawerOpen(false)} />
                    </div>
                </div>
            )}
        </>
    );
}
