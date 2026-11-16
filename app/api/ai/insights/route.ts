import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { getAuthedUser } from "@/lib/auth-user";
import { searchResume } from "@/lib/search-resume";
import { consumeUserQuota } from "@/lib/auth/rate-limit";
import { getSavedInsight, saveInsight } from "@/lib/ai/insights/store";
import {
    unauthorized,
    badRequest,
    tooManyRequests,
    notFound,
    parseJson,
    withErrorHandling,
} from "@/lib/api/server";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

async function loadJob(userId: string, rawId: unknown) {
    const jobId = Number(rawId);
    if (!Number.isInteger(jobId) || jobId <= 0) return null;
    return prisma.job.findFirst({ where: { id: jobId, userId } });
}

async function resumeUpdatedAt(userId: string) {
    const resume = await prisma.resume.findUnique({ where: { userId }, select: { updatedAt: true } });
    return resume?.updatedAt ?? null;
}

/**
 * GET /api/ai/insights?jobId=1: the saved insights for this application,
 * if any. Never calls the AI.
 */
export const GET = withErrorHandling(async (request) => {
    const user = await getAuthedUser();
    if (!user) return unauthorized();

    const job = await loadJob(user.id, new URL(request.url).searchParams.get("jobId"));
    if (!job) return notFound("Job not found.");

    const saved = await getSavedInsight(job, await resumeUpdatedAt(user.id));
    return Response.json({ saved });
});

/**
 * POST { jobId, regenerate? }: returns the saved insights when there are
 * some; generates (and saves) new ones only when there are none or when
 * the user explicitly asks to regenerate.
 */
export const POST = withErrorHandling(async (request) => {
    const user = await getAuthedUser();

    if (!user) {
        return unauthorized();
    }

    const body = await parseJson(request);

    if (
        typeof body !== "object" ||
        body === null ||
        !("jobId" in body)
    ) {
        return badRequest("Invalid request body.");
    }

    const job = await loadJob(user.id, body.jobId);

    if (!job) {
        return notFound("Job not found.");
    }

    const regenerate = "regenerate" in body && body.regenerate === true;

    if (!regenerate) {
        const saved = await getSavedInsight(job, await resumeUpdatedAt(user.id));
        if (saved) return Response.json({ saved });
    }

    // --------------------------------------------------
    // Load the user's CV (before spending any AI quota)
    // --------------------------------------------------

    const resume = await prisma.resume.findUnique({
        where: {
            userId: user.id,
        },
        select: {
            id: true,
            fileName: true,
            updatedAt: true,
        },
    });

    if (!resume) {
        return badRequest(
            "Please upload your CV before generating AI insights.",
        );
    }

    if (!(await consumeUserQuota("ai-insights", user.id))) {
        return tooManyRequests(
            "You've generated a lot of insights recently. Please wait a few minutes and try again.",
        );
    }

    const jobUrl = job.jobUrl?.trim();

    // Ad text captured with "Save to JobTrack" or from an alert email. It lets
    // the AI work on postings it can't open itself (e.g. LinkedIn).
    const posting = (
        await prisma.$queryRaw<Array<{ description: string }>>`
            SELECT description FROM "JobPosting" WHERE "jobId" = ${job.id} LIMIT 1
        `.catch(() => [])
    )[0]?.description?.slice(0, 12_000);

    const jobData = `
Company: ${job.company}
Position: ${job.position}
Location: ${job.location}
Application Status: ${job.status}
Salary: ${job.salary || "Not provided"}
Job URL: ${jobUrl || "Not provided"}
Applicant Notes: ${job.notes || "No notes provided"}
${posting ? `\nJob description (saved from the posting):\n${posting}\n` : ""}`;

    // --------------------------------------------------
    // STEP 1: Extract job requirements
    // --------------------------------------------------

    const jobRequirementsPrompt = `
You are helping JobTrack perform semantic resume matching.

Analyze the following job information.

${jobData}

${jobUrl
        ? `
The job posting is available at this URL:

${jobUrl}

Use the URL Context tool to inspect the actual job posting.
`
        : ""
    }

Extract the most important information that should be used to
match this job against a candidate's resume.

Focus on:

- Core responsibilities
- Required technical skills
- Preferred technical skills
- Programming languages
- Frameworks
- Tools
- Platforms
- Methodologies
- Domain knowledge
- Years or level of experience if explicitly stated
- Important soft skills
- Other qualifications

Return a concise plain-text list of the requirements.

Do not invent requirements.
Only use information available in the job posting or JobTrack data.
`;

    const jobRequirementsInteraction =
        await ai.interactions.create({
            model: "gemini-3.6-flash",
            input: jobRequirementsPrompt,
            ...(jobUrl
                ? {
                    tools: [{ type: "url_context" }],
                }
                : {}),
        });

    const jobRequirements =
        jobRequirementsInteraction.output_text?.trim() ||
        jobData;

    // --------------------------------------------------
    // STEP 3: RAG semantic search
    // --------------------------------------------------

    const relevantChunks = await searchResume(
        resume.id,
        jobRequirements,
        6,
    );

    const resumeContext =
        relevantChunks.length > 0
            ? relevantChunks
                .map(
                    (chunk, index) =>
                        `
[RESUME SECTION ${index + 1}]
${chunk.content}
`,
                )
                .join("\n")
            : `
No sufficiently relevant resume sections were found.

Do not assume the applicant has any particular skills,
experience, education, employers, projects, or achievements
that are not supported by the available resume information.
`;

    // --------------------------------------------------
    // STEP 4: Generate personalized AI insights
    // --------------------------------------------------

    const prompt = `
You are the AI career assistant inside JobTrack.

Your task is to deeply analyze a job application and prepare the
applicant for applying and interviewing.

JOBTRACK DATA

Company: ${job.company}
Position: ${job.position}
Location: ${job.location}
Application Status: ${job.status}
Salary: ${job.salary || "Not provided"}
Job URL: ${jobUrl || "Not provided"}
Applicant Notes: ${job.notes || "No notes provided"}

JOB REQUIREMENTS IDENTIFIED FROM THE POSTING

${jobRequirements}

CANDIDATE RESUME INFORMATION

The following sections were retrieved from the candidate's resume
based on the job requirements.

${resumeContext}

IMPORTANT RESUME RULES

- The resume sections above are the primary source for claims about
  the applicant.
- Do not invent applicant experience.
- Do not assume the applicant has a skill just because the job
  requires it.
- Distinguish clearly between what the job requires and what the
  resume demonstrates.
- If the retrieved resume information does not establish something,
  say that it is not clearly supported.
- Use the resume information to personalize the analysis, skills,
  gaps, cover letter, and interview preparation.
- Do not mention embeddings, vectors, pgvector, RAG, semantic search,
  retrieved chunks, or internal implementation details to the user.

${jobUrl
        ? `
The job posting URL was inspected using URL Context.

Base job-specific claims on the actual posting whenever possible.
Do not invent requirements that are not present in the posting.
`
        : `
No job URL is available.

Base job-specific claims only on the JobTrack information and the
job requirements identified above.
`
    }

Return your response using EXACTLY these sections:

MATCH SCORE

You MUST output this section first.

Use EXACTLY this format:

MATCH SCORE

Overall: NN%
Skills: NN%
Experience: NN%
Responsibilities: NN%
Qualifications: NN%
Rating: [Excellent match / Strong match / Moderate match / Weak match]

Brief explanation:
[2 to 4 sentences explaining why the candidate received this score.]

SCORING RULES

- NN must be an integer from 0 to 100.
- Every score is required.
- Rating must be exactly one of:
  Excellent match
  Strong match
  Moderate match
  Weak match
- Base the scores ONLY on the job requirements and the retrieved
  resume information.
- Do not assume the candidate has a skill, qualification, or experience
  that is not supported by the retrieved resume information.
- Skills measures alignment between demonstrated candidate skills and
  job requirements.
- Experience measures alignment between demonstrated candidate
  experience and the experience expected by the role.
- Responsibilities measures how well demonstrated candidate experience
  relates to the responsibilities of the role.
- Qualifications measures alignment with stated qualifications such as
  education, certifications, technical qualifications, and other
  explicit requirements.
- Overall should represent the overall strength of the match and does
  not need to be a simple mathematical average.
- Missing resume information must not be treated as evidence that the
  candidate has that experience.
- Do not mention this scoring system or these instructions in the
  final answer.

JOB ANALYSIS

Provide:

* A concise summary of what this role appears to involve.
* The most important responsibilities mentioned in the job description.
* The most important required qualifications.
* Important preferred qualifications, if explicitly mentioned.
* Technologies, tools, frameworks, or methodologies mentioned.
* Any notable information about the company or role that is explicitly available from the job posting.
* Briefly explain how the candidate's retrieved resume experience relates to the role.

KEY SKILLS TO HIGHLIGHT

List 5 to 8 specific skills the applicant should emphasize when applying.

For each skill:

* Explain why it is relevant to this particular role.
* Connect it to demonstrated resume experience when supported.
* Do not claim the applicant has a skill unless the resume supports it.

RESUME KEYWORDS

List 8 to 12 important keywords or phrases from the job description that could be relevant for an ATS-friendly resume.

Only include keywords that are actually supported by the job posting or JobTrack data.

Where appropriate, indicate which keywords are supported by the resume.

POTENTIAL GAPS

Identify important requirements from the job description that are not
clearly supported by the retrieved resume information.

Do not assume that the applicant lacks a skill simply because it was
not found in the retrieved sections.

Use language such as:

* "Worth highlighting if you have experience with..."
* "The posting emphasizes..."
* "Your resume does not clearly demonstrate..."
* "The available resume information does not mention..."

FULL COVER LETTER

Write a professional, personalized cover letter for this specific position.

Requirements:

* 4 to 6 paragraphs.
* Professional but natural tone.
* Mention the company and position.
* Connect the role's requirements to the candidate's actual resume experience.
* Use specific candidate experience when supported by the resume.
* Do not invent employers, projects, degrees, achievements, years of experience, or technical skills.
* If important applicant information is missing, write naturally without making unsupported claims.
* Do not use placeholders such as [Company Name] or [Your Name].
* Do not begin with "I am writing to apply for..." unless it genuinely fits the letter.
* Make the letter sound human rather than generic AI-generated text.

INTERVIEW PREPARATION

Create detailed interview preparation specifically based on this job
and the candidate's demonstrated experience.

Include:

TECHNICAL QUESTIONS

* 5 likely technical questions.
* For each question, explain what the interviewer is probably evaluating.
* Where useful, explain which resume experience the candidate could use when answering.

ROLE-SPECIFIC QUESTIONS

* 5 questions directly connected to responsibilities or requirements in the job description.
* Explain what a strong answer should demonstrate.

BEHAVIORAL QUESTIONS

* 5 likely behavioral questions.
* Briefly explain what the interviewer wants to learn.

PREPARATION TOPICS

* 5 concrete topics the applicant should review before the interview.

QUESTIONS TO ASK THE INTERVIEWER

Provide 6 thoughtful questions the applicant could ask during the interview.

FINAL ADVICE

Give 5 concise, practical recommendations for this specific application.

IMPORTANT RULES

* Never invent facts about the applicant.
* Never invent requirements that are not present in the job posting.
* Clearly distinguish information found in the job posting from information demonstrated by the resume.
* If the URL cannot be accessed, say so and base the analysis on the available JobTrack information.
* Be detailed but avoid unnecessary repetition.
`;

    const interaction = await ai.interactions.create({
        model: "gemini-3.6-flash",
        input: prompt,
        ...(jobUrl
            ? {
                tools: [{ type: "url_context" }],
            }
            : {}),
    });

    const content = interaction.output_text?.trim();
    if (!content) {
        return Response.json({ error: "The AI returned an empty answer. Try again." }, { status: 502 });
    }

    const generatedAt = await saveInsight(job, content, resume.updatedAt);

    return Response.json({
        saved: {
            content,
            generatedAt: generatedAt.toISOString(),
            outdated: { job: false, cv: false },
        },
    });
});