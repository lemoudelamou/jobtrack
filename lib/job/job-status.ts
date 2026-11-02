import { JobStatus } from "@/app/types/job";

export type JobStatusMeta = {
    dot: string;
    bg: string;
    text: string;
    border: string;
    progress: number;
    label: string;
};

export const STATUS_ORDER: JobStatus[] = [
    "Wishlist",
    "Applied",
    "Interview",
    "Offer",
    "Rejected",
];

export const STATUS_META: Record<JobStatus, JobStatusMeta> = {
    Wishlist: {
        dot: "#5B615C",
        bg: "#E5E8E2",
        text: "#4E534D",
        border: "#D7DAD3",
        progress: 20,
        label: "Wishlist",
    },

    Applied: {
        dot: "#3E6B99",
        bg: "#E2EAF2",
        text: "#2C4D70",
        border: "#D5DFE9",
        progress: 40,
        label: "Applied",
    },

    Interview: {
        dot: "#B4802F",
        bg: "#F5EAD6",
        text: "#8C6323",
        border: "#E9DEC8",
        progress: 70,
        label: "Interview",
    },

    Offer: {
        dot: "#22503F",
        bg: "#DEE9E3",
        text: "#183A2D",
        border: "#CDDCD4",
        progress: 100,
        label: "Offer",
    },

    Rejected: {
        dot: "#9C4A3D",
        bg: "#F2E1DE",
        text: "#7A392F",
        border: "#E8D4D0",
        progress: 100,
        label: "Rejected",
    },
};

export function getStatusMeta(status: JobStatus) {
    return STATUS_META[status];
}

export function getNextStatus(
    status: JobStatus,
    direction: "left" | "right",
): JobStatus | null {
    const index = STATUS_ORDER.indexOf(status);

    const nextIndex =
        direction === "left"
            ? index - 1
            : index + 1;

    if (
        nextIndex < 0 ||
        nextIndex >= STATUS_ORDER.length
    ) {
        return null;
    }

    return STATUS_ORDER[nextIndex];
}

