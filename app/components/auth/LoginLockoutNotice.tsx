"use client";

import { useEffect, useState } from "react";

type LoginLockoutNoticeProps = {
    until: number;
};

function getRemainingSeconds(until: number) {
    return Math.max(
        0,
        Math.ceil((until - Date.now()) / 1000),
    );
}

function formatRemaining(seconds: number) {
    if (seconds >= 60) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${minutes}:${remainingSeconds
            .toString()
            .padStart(2, "0")}`;
    }

    return `${seconds} ${seconds === 1 ? "second" : "seconds"
        }`;
}

export function LoginLockoutNotice({
    until,
}: LoginLockoutNoticeProps) {
    const [remaining, setRemaining] =
        useState(() =>
            getRemainingSeconds(until),
        );

    useEffect(() => {
        function updateRemaining() {
            setRemaining(
                getRemainingSeconds(until),
            );
        }

        updateRemaining();

        const timer = window.setInterval(
            updateRemaining,
            1000,
        );

        return () => {
            window.clearInterval(timer);
        };
    }, [until]);

    if (remaining <= 0) {
        return (
            <div className="mb-5 rounded-lg border border-offer-line bg-offer-soft px-3.5 py-3 text-sm leading-6 text-offer-ink">
                You can try signing in again now.
            </div>
        );
    }

    return (
        <div className="mb-5 rounded-lg border border-interview-line bg-interview-soft px-3.5 py-3 text-sm leading-6 text-interview-ink">
            Too many attempts. You can try again in{" "}
            <span className="font-semibold tabular-nums">
                {formatRemaining(remaining)}
            </span>
            .
        </div>
    );
}