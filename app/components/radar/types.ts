export type RadarProfile = {
    keywords: string;
    location: string;
    radiusKm: number;
    remoteOnly: boolean;
    visaOnly: boolean;
    experienceLevel: import("@/lib/radar/filters").ExperienceLevel;
    sourceMode: import("@/lib/radar/sources").SourceMode;
    lastRunAt: string | null;
    lastRunError: string | null;
};

export type LeadStatus = "New" | "Saved" | "Dismissed";

export type RadarLead = {
    id: number;
    title: string;
    company: string | null;
    location: string | null;
    salary: string | null;
    source: string;
    url: string;
    publishedAt: string | null;
    score: number | null;
    summary: string | null;
    strengths: string[];
    gaps: string[];
    explainedAt: string | null;
    status: LeadStatus;
    jobId: number | null;
};

export type RadarData = {
    profile: RadarProfile | null;
    resume: { fileName: string; ready: boolean } | null;
    counts: Record<LeadStatus, number>;
    leads: RadarLead[];
    aiEnabled: boolean;
    titleSuggestions: string[];
    gmail: import("./AlertEmails").GmailInfo;
    sources: { jsearch: boolean; jsearchUsage: { used: number; limit: number } | null; arbeitnow: boolean };
};

export function timeAgo(value: string | null) {
    if (!value) return "";
    const date = new Date(value);
    const seconds = Math.round((date.getTime() - Date.now()) / 1000);
    const format = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

    const steps: Array<[Intl.RelativeTimeFormatUnit, number]> = [
        ["year", 31_536_000],
        ["month", 2_592_000],
        ["week", 604_800],
        ["day", 86_400],
        ["hour", 3_600],
        ["minute", 60],
    ];

    for (const [unit, size] of steps) {
        if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
    }
    return "just now";
}
