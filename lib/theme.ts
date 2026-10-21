import { Job } from "@/app/types/job";

/* -------------------------------------------------------------------------- */
/* Status tokens                                                              */
/*                                                                            */
/* Each pipeline stage owns one hue (defined in app/globals.css with light    */
/* and dark values). `dot` is a CSS color for inline styles; the rest are     */
/* Tailwind classes.                                                          */
/* -------------------------------------------------------------------------- */

type StatusMeta = {
  label: string;
  /** CSS color, for inline styles (bars, dots). */
  dot: string;
  /** Text color on a soft background. */
  text: string;
  /** Soft background. */
  bg: string;
  /** Border in the status hue. */
  border: string;
  /** Solid fill class (dot / bar). */
  fill: string;
  /** Short help text shown in filters and empty columns. */
  hint: string;
};

export const STATUS_META: Record<Job["status"], StatusMeta> = {
  Wishlist: {
    label: "Wishlist",
    dot: "var(--wishlist)",
    text: "text-wishlist-ink",
    bg: "bg-wishlist-soft",
    border: "border-wishlist-line",
    fill: "bg-wishlist",
    hint: "Roles you want to apply to",
  },
  Applied: {
    label: "Applied",
    dot: "var(--applied)",
    text: "text-applied-ink",
    bg: "bg-applied-soft",
    border: "border-applied-line",
    fill: "bg-applied",
    hint: "Waiting to hear back",
  },
  Interview: {
    label: "Interview",
    dot: "var(--interview)",
    text: "text-interview-ink",
    bg: "bg-interview-soft",
    border: "border-interview-line",
    fill: "bg-interview",
    hint: "In conversation",
  },
  Offer: {
    label: "Offer",
    dot: "var(--offer)",
    text: "text-offer-ink",
    bg: "bg-offer-soft",
    border: "border-offer-line",
    fill: "bg-offer",
    hint: "Offers received",
  },
  Rejected: {
    label: "Rejected",
    dot: "var(--rejected)",
    text: "text-rejected-ink",
    bg: "bg-rejected-soft",
    border: "border-rejected-line",
    fill: "bg-rejected",
    hint: "Closed applications",
  },
};

export const STATUS_ORDER: Job["status"][] = [
  "Wishlist",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
];

export function getStatusMeta(status: Job["status"]) {
  return STATUS_META[status] ?? STATUS_META.Wishlist;
}

/* -------------------------------------------------------------------------- */
/* Company avatars                                                            */
/*                                                                            */
/* Avatars stay neutral so the only colors on a card are status colors.       */
/* A few lightness steps keep neighbouring companies distinguishable.         */
/* -------------------------------------------------------------------------- */

export const AVATAR_PALETTE = [
  { bg: "var(--surface-2)", text: "var(--ink-2)" },
  { bg: "var(--accent-soft)", text: "var(--accent-ink)" },
  { bg: "var(--line)", text: "var(--ink)" },
];

function hashString(value: string) {
  let hash = 0;

  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function getAvatarPalette(company: string) {
  return AVATAR_PALETTE[hashString(company) % AVATAR_PALETTE.length];
}

export function getInitials(company: string) {
  const words = company.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "?";

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return (words[0][0] + words[1][0]).toUpperCase();
}
