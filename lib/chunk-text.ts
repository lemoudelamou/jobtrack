
export function chunkText(
    text: string,
    maxCharacters = 1800,
    overlapCharacters = 300
) {
    const chunks: string[] = [];

    let start = 0;

    while (start < text.length) {
        let end = Math.min(start + maxCharacters, text.length);

        // Prefer ending at a paragraph or sentence boundary.
        if (end < text.length) {
            const paragraphBreak = text.lastIndexOf("\n\n", end);
            const sentenceBreak = text.lastIndexOf(". ", end);

            const bestBreak = Math.max(paragraphBreak, sentenceBreak);

            if (bestBreak > start + maxCharacters * 0.5) {
                end = bestBreak + (paragraphBreak === bestBreak ? 2 : 1);
            }
        }

        const chunk = text.slice(start, end).trim();

        if (chunk) {
            chunks.push(chunk);
        }

        if (end >= text.length) {
            break;
        }

        start = Math.max(end - overlapCharacters, start + 1);
    }

    return chunks;
}

