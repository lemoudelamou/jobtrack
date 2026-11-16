export type FormattedBlock =
    | {
        type: "heading";
        value: string;
    }
    | {
        type: "bullet";
        value: string;
    }
    | {
        type: "number";
        value: string;
        number: number;
    }
    | {
        type: "paragraph";
        value: string;
    };

export function parseFormattedText(text: string): FormattedBlock[] {
    return text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const heading = line.match(/^#{1,4}\s+(.+)$/);

            if (heading) {
                return {
                    type: "heading" as const,
                    value: heading[1],
                };
            }

            const bullet = line.match(/^[-•*]\s+(.+)$/);

            if (bullet) {
                return {
                    type: "bullet" as const,
                    value: bullet[1],
                };
            }

            const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);

            if (numbered) {
                return {
                    type: "number" as const,
                    number: Number(numbered[1]),
                    value: numbered[2],
                };
            }

            return {
                type: "paragraph" as const,
                value: line,
            };
        });
}

export function formatInlineText(text: string) {
    return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
}