/*
 * Where the radar looks for jobs, chosen per search:
 *   search  Google Jobs (JSearch) + Arbeitnow, using your titles and cities
 *   alerts  only your job alert emails (StepStone, Indeed, LinkedIn, XING, Glassdoor)
 *   both    everything
 */
export const SOURCE_MODES = ["both", "search", "alerts"] as const;
export type SourceMode = (typeof SOURCE_MODES)[number];

export const SOURCE_MODE_LABELS: Record<SourceMode, { title: string; hint: string }> = {
    both: { title: "Both", hint: "Job search and your alert emails" },
    search: { title: "Job search", hint: "Google Jobs and Arbeitnow, with your titles and cities" },
    alerts: { title: "My alert emails", hint: "Only the jobs StepStone, Indeed, LinkedIn & co. email you" },
};

export function parseSourceMode(value: unknown): SourceMode {
    return SOURCE_MODES.includes(value as SourceMode) ? (value as SourceMode) : "both";
}

export const usesSearch = (mode: SourceMode) => mode !== "alerts";
export const usesAlerts = (mode: SourceMode) => mode !== "search";
