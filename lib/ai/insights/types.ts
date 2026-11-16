export type InsightSections = {
    matchScore: string;
    jobAnalysis: string;
    skills: string;
    keywords: string;
    gaps: string;
    coverLetter: string;
    interviewPrep: string;
    questions: string;
    finalAdvice: string;
};

export type ResumeInfo = {
    fileName: string;
    textLength?: number;
};

export type MatchMetrics = {
    overall: number | null;
    rating: string;
    skills: number | null;
    experience: number | null;
    responsibilities: number | null;
    qualifications: number | null;
};