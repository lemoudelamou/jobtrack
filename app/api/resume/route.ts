import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthedUser } from "@/lib/auth-user";
import { badRequest, tooManyRequests, unauthorized, withErrorHandling } from "@/lib/api/server";
import { consumeUserQuota } from "@/lib/auth/rate-limit";

import { extractText, getDocumentProxy } from "unpdf";

import { chunkText } from "@/lib/chunk-text";
import { createEmbedding } from "@/lib/ai/insights/embeddings";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// A malicious or unusual PDF can decompress into far more text than its
// byte size suggests. These caps bound how much work (and Gemini spend) a
// single upload can trigger, independent of the 5MB file-size check above.
const MAX_TEXT_LENGTH = 200_000; // ~40k words, generous for any real resume
const MAX_CHUNKS = 300;

const EMBEDDING_CONCURRENCY = 5;

/** Runs `fn` over `items` with at most `limit` calls in flight at once. */
async function mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
    const results = new Array<R>(items.length);
    let cursor = 0;

    async function worker() {
        while (cursor < items.length) {
            const index = cursor++;
            results[index] = await fn(items[index], index);
        }
    }

    await Promise.all(
        Array.from({ length: Math.min(limit, items.length) }, worker)
    );

    return results;
}

// -----------------------------------
// GET existing resume
// -----------------------------------

export const GET = withErrorHandling(async () => {
    const user = await getAuthedUser();
    if (!user) return unauthorized();

    const resume = await prisma.resume.findUnique({
        where: { userId: user.id },
        select: {
            id: true,
            fileName: true,
            text: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { chunks: true } },
        },
    });

    if (!resume) {
        return NextResponse.json({ resume: null });
    }

    return NextResponse.json({
        resume: {
            id: resume.id,
            fileName: resume.fileName,
            textLength: resume.text.length,
            chunkCount: resume._count.chunks,
            createdAt: resume.createdAt,
            updatedAt: resume.updatedAt,
        },
    });
});

// -----------------------------------
// POST upload / replace resume
// -----------------------------------

export const POST = withErrorHandling(async (request) => {
    const user = await getAuthedUser();
    if (!user) return unauthorized();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
        return badRequest("No resume file provided.");
    }

    const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
        return badRequest("Only PDF resumes are supported.");
    }

    if (file.size > MAX_FILE_SIZE) {
        return badRequest("Resume must be smaller than 5MB.");
    }

    if (file.size === 0) {
        return badRequest("The uploaded resume is empty.");
    }

    if (!(await consumeUserQuota("resume-upload", user.id))) {
        return tooManyRequests(
            "Too many resume uploads. Please wait a few minutes and try again."
        );
    }

    console.log("Processing resume:", {
        userId: user.id,
        fileName: file.name,
        size: file.size,
    });

    // -----------------------------------
    // Extract PDF text
    // -----------------------------------

    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    const pdf = await getDocumentProxy(data);

    const { text } = await extractText(pdf, { mergePages: true });

    const cleanedText = text
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    console.log("Resume text extracted:", {
        pages: pdf.numPages,
        characters: cleanedText.length,
    });

    if (!cleanedText) {
        return badRequest(
            "We couldn't extract text from this PDF. Please upload a text-based PDF resume."
        );
    }

    if (cleanedText.length > MAX_TEXT_LENGTH) {
        return badRequest(
            "This resume's text content is too long to process. Please upload a shorter document."
        );
    }

    // -----------------------------------
    // Chunk + guard against pathological PDFs
    // -----------------------------------

    const chunks = chunkText(cleanedText);

    if (chunks.length === 0) {
        return badRequest(
            "We couldn't extract usable text from this PDF. Please upload a text-based PDF resume."
        );
    }

    if (chunks.length > MAX_CHUNKS) {
        return badRequest(
            "This resume is too long to process. Please upload a shorter document."
        );
    }

    // -----------------------------------
    // Generate embeddings (slow external calls — done before we touch the
    // database, and with limited concurrency so we don't hammer the
    // embeddings API on large resumes).
    // -----------------------------------

    const embeddings = await mapWithConcurrency(
        chunks,
        EMBEDDING_CONCURRENCY,
        (chunk) => createEmbedding(chunk)
    );

    console.log("Resume embeddings created:", {
        fileName: file.name,
        chunks: chunks.length,
    });

    // -----------------------------------
    // Save resume + chunks atomically. If anything here fails partway
    // (a bad embedding value, a DB hiccup), the transaction rolls back and
    // the user keeps their previous resume/chunks instead of ending up
    // with a resume that has zero or partial chunks.
    // -----------------------------------

    const resume = await prisma.$transaction(
        async (tx) => {
            const savedResume = await tx.resume.upsert({
                where: { userId: user.id },
                update: { fileName: file.name, text: cleanedText },
                create: { userId: user.id, fileName: file.name, text: cleanedText },
            });

            await tx.resumeChunk.deleteMany({
                where: { resumeId: savedResume.id },
            });

            // Single multi-row INSERT instead of one round trip per chunk.
            const rows = chunks.map(
                (chunk, i) =>
                    Prisma.sql`(${savedResume.id}, ${chunk}, ${i}, ${JSON.stringify(embeddings[i])}::vector)`
            );

            await tx.$executeRaw(
                Prisma.sql`
                    INSERT INTO "ResumeChunk" ("resumeId", "content", "chunkIndex", "embedding")
                    VALUES ${Prisma.join(rows)}
                `
            );

            return savedResume;
        },
        { timeout: 15_000 }
    );

    console.log("Resume saved:", {
        resumeId: resume.id,
        chunks: chunks.length,
    });

    return NextResponse.json({
        message: "Resume uploaded successfully.",
        resume: {
            id: resume.id,
            fileName: resume.fileName,
            textLength: cleanedText.length,
            chunkCount: chunks.length,
        },
    });
});