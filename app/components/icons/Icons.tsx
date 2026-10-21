type IconProps = {
    className?: string;
};

export function IconChevron({
    direction,
    className = "",
}: IconProps & {
    direction: "left" | "right";
}) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden="true"
        >
            <path
                d={
                    direction === "left"
                        ? "M14.5 6.5 8 12l6.5 5.5"
                        : "M9.5 6.5 16 12l-6.5 5.5"
                }
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function IconBuilding({
    className = "",
}: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden="true"
        >
            <rect
                x="4"
                y="3.5"
                width="12"
                height="17"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.6"
            />
            <path
                d="M16 9.5h3.5A1.5 1.5 0 0 1 21 11v9a.5.5 0 0 1-.5.5H16"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
            <path
                d="M7.5 7h1.5M11.5 7H13M7.5 10.5h1.5M11.5 10.5H13M7.5 14h1.5M11.5 14H13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function IconBriefcase({
    className = "",
}: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden="true"
        >
            <rect
                x="3"
                y="7.5"
                width="18"
                height="12"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.6"
            />
            <path
                d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5"
                stroke="currentColor"
                strokeWidth="1.6"
            />
        </svg>
    );
}

export function IconMapPin({
    className = "",
}: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden="true"
        >
            <path
                d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.4-6.5 11-6.5 11Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
            <circle
                cx="12"
                cy="10"
                r="2.2"
                stroke="currentColor"
                strokeWidth="1.6"
            />
        </svg>
    );
}

export function IconCalendar({
    className = "",
}: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden="true"
        >
            <rect
                x="3.5"
                y="5"
                width="17"
                height="15.5"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.6"
            />
            <path
                d="M3.5 9.5h17M8 3v3.2M16 3v3.2"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function IconWallet({
    className = "",
}: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden="true"
        >
            <rect
                x="3"
                y="6.5"
                width="18"
                height="13"
                rx="2.2"
                stroke="currentColor"
                strokeWidth="1.6"
            />
            <path
                d="M3 10.5h18"
                stroke="currentColor"
                strokeWidth="1.6"
            />
            <path
                d="M15.5 14.2h2.3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function IconLink({
    className = "",
}: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden="true"
        >
            <path
                d="M9.5 14.5 14.5 9.5M11 7l1.3-1.3a3.2 3.2 0 0 1 4.5 4.5L15.5 11.5M13 17l-1.3 1.3a3.2 3.2 0 0 1-4.5-4.5L8.5 12.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function IconNote({
    className = "",
}: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden="true"
        >
            <path
                d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1-1.5Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
            <path
                d="M14 3.5V8h4.3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
            <path
                d="M9 12.5h6M9 15.5h6M9 9.5h2"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function IconChevronDown({
    className = "",
}: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden="true"
        >
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

export function IconAlert({
    className = "",
}: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden="true"
        >
            <path
                d="M12 3.5 21 19H3L12 3.5Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
            <path
                d="M12 9.5v4.2"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
            <circle
                cx="12"
                cy="16.6"
                r="0.9"
                fill="currentColor"
            />
        </svg>
    );
}

export function IconSparkles({
    className = "",
}: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden="true"
        >
            <path
                d="m12 3 1.25 4.75L18 9l-4.75 1.25L12 15l-1.25-4.75L6 9l4.75-1.25L12 3Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            <path
                d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function IconExternal({
    className = "",
}: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden="true"
        >
            <path
                d="M9 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
            <path
                d="M14 4h6v6M20 4l-9 9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function IconPencil({
    className = "",
}: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden="true"
        >
            <path
                d="M4 20.5 4.6 17 16 5.6a1.7 1.7 0 0 1 2.4 0l.04.04a1.7 1.7 0 0 1 0 2.4L7 19.4 4 20.5Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function IconTrash({
    className = "",
}: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden="true"
        >
            <path
                d="M5 7.5h14M9.5 7.5V6a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 6v1.5M7 7.5l.7 11a2 2 0 0 0 2 1.9h4.6a2 2 0 0 0 2-1.9l.7-11"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function IconArrowUpRight({
    className = "",
}: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden="true"
        >
            <path
                d="M7 17 17 7M9 7h8v8"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

