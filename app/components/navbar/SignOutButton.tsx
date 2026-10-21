"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function SignOutButton({
    className = "",
}: {
    className?: string;
}) {
    const [isSigningOut, setIsSigningOut] = useState(false);

    async function handleSignOut() {
        if (isSigningOut) return;

        setIsSigningOut(true);

        try {
            await signOut({ callbackUrl: "/login" });
        } catch {
            setIsSigningOut(false);
        }
    }

    return (
        <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={isSigningOut}
            aria-busy={isSigningOut}
            className={
                className ||
                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink disabled:opacity-60"
            }
        >
            <LogOut className="h-4 w-4 text-muted" strokeWidth={1.75} />
            {isSigningOut ? "Signing out…" : "Sign out"}
        </button>
    );
}
