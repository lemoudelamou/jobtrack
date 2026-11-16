import type { InsightSections, MatchMetrics } from "./types";

const SECTION_NAMES: Array<keyof InsightSections> = [
    "matchScore",
    "jobAnalysis",
    "skills",
    "keywords",
    "gaps",
    "coverLetter",
    "interviewPrep",
    "questions",
    "finalAdvice",
];

const SECTION_HEADERS: Record<keyof InsightSections, string> = {
    matchScore: "MATCH SCORE",
    jobAnalysis: "JOB ANALYSIS",
    skills: "SKILLS",
    keywords: "KEYWORDS",
    gaps: "GAPS",
    coverLetter: "COVER LETTER",
    interviewPrep: "INTERVIEW PREP",
    questions: "QUESTIONS TO ASK",
    finalAdvice: "FINAL ADVICE",
};

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function headingPattern(value: string) {
    const escaped = escapeRegExp(value);

    return `(?:\\*\\*)?${escaped}(?:\\*\\*)?`;
}

function extractSection(
    text: string,
    start: string,
    end?: string,
): string {
    const startPattern = headingPattern(start);

    const pattern = end
        ? new RegExp(
              `${startPattern}\\s*([\\s\\S]*?)(?=${headingPattern(end)}|$)`,
              "i",
          )
        : new RegExp(`${startPattern}\\s*([\\s\\S]*)$`, "i");

    return text.match(pattern)?.[1]?.trim() ?? "";
}

export function parseInsights(text: string): InsightSections {
    return SECTION_NAMES.reduce<InsightSections>(
        (result, section, index) => {
            const currentHeader = SECTION_HEADERS[section];
            const nextSection = SECTION_NAMES[index + 1];

            result[section] = extractSection(
                text,
                currentHeader,
                nextSection ? SECTION_HEADERS[nextSection] : undefined,
            );

            return result;
        },
        {
            matchScore: "",
            jobAnalysis: "",
            skills: "",
            keywords: "",
            gaps: "",
            coverLetter: "",
            interviewPrep: "",
            questions: "",
            finalAdvice: "",
        },
    );
}

function extractPercentage(text: string, label: string) {
    const match = text.match(
        new RegExp(`${escapeRegExp(label)}:\\s*(\\d+)%`, "i"),
    );

    return match ? Number(match[1]) : null;
}

export function parseMatchMetrics(text: string): MatchMetrics {
    return {
        overall: extractPercentage(text, "Overall"),
        rating: text.match(/Rating:\s*(.+)/i)?.[1]?.trim() ?? "",
        skills: extractPercentage(text, "Skills"),
        experience: extractPercentage(text, "Experience"),
        responsibilities: extractPercentage(text, "Responsibilities"),
        qualifications: extractPercentage(text, "Qualifications"),
    };
}

export function stripMarkdown(text: string) {
    return text
        .replace(/\*\*/g, "")
        .replace(/^#{1,6}\s+/gm, "")
        .trim();
}