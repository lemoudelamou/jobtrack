import { Job } from "@/app/types/job";

export const AVATAR_PALETTE = [
    { bg: "#DEE9E3", text: "#183A2D" },
    { bg: "#E2EAF2", text: "#2C4D70" },
    { bg: "#F5EAD6", text: "#8C6323" },
    { bg: "#F2E1DE", text: "#7A392F" },
    { bg: "#E7E1F0", text: "#54417A" },
    { bg: "#E5E8E2", text: "#4E534D" },
    { bg: "#DCEAE7", text: "#1F5A52" },
    { bg: "#F0E4D8", text: "#8A5A2E" },
];

export function hashString(value: string) {
    let hash = 0;

    for (let i = 0; i < value.length; i++) {
        hash =
            (hash << 5) -
            hash +
            value.charCodeAt(i);

        hash |= 0;
    }

    return Math.abs(hash);
}

export function getAvatarPalette(company: string) {
    return AVATAR_PALETTE[
        hashString(company) %
        AVATAR_PALETTE.length
    ];
}

export function getInitials(company: string) {
    const words = company
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 0) {
        return "?";
    }

    if (words.length === 1) {
        return words[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return (
        words[0][0] +
        words[1][0]
    ).toUpperCase();
}

export function formatJobDate(date: string) {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return date;
    }

    return new Intl.DateTimeFormat("en", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(parsedDate);
}

export function formatShortJobDate(date: string) {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return date;
    }

    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
    }).format(parsedDate);
}

export function getToday() {
    return new Date()
        .toISOString()
        .split("T")[0];
}

export function getInitialFormData() {
    return {
        company: "",
        position: "",
        location: "",
        status: "Wishlist" as Job["status"],
        appliedDate: getToday(),
        jobUrl: "",
        salary: "",
        notes: "",
    };
}

export function getFormDataFromJob(job: Job) {
    return {
        company: job.company,
        position: job.position,
        location: job.location,
        status: job.status,
        appliedDate: job.appliedDate
            ? new Date(job.appliedDate)
                .toISOString()
                .split("T")[0]
            : getToday(),
        jobUrl: job.jobUrl ?? "",
        salary: job.salary ?? "",
        notes: job.notes ?? "",
    };
}

