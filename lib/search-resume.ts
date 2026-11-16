
import { prisma } from "@/lib/prisma";
import { createEmbedding } from "@/lib/ai/insights/embeddings";

export async function searchResume(
  resumeId: number,
  query: string,
  limit = 5
) {
  const queryEmbedding = await createEmbedding(query);

  const vector = `[${queryEmbedding.join(",")}]`;

  const results = await prisma.$queryRaw<
    {
      id: number;
      content: string;
      chunkIndex: number;
      similarity: number;
    }[]
  >`
    SELECT
      id,
      "content",
      "chunkIndex",
      1 - ("embedding" <=> ${vector}::vector) AS similarity
    FROM "ResumeChunk"
    WHERE "resumeId" = ${resumeId}
      AND "embedding" IS NOT NULL
    ORDER BY "embedding" <=> ${vector}::vector
    LIMIT ${limit};
  `;

  return results;
}

