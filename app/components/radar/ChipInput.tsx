"use client";

import { KeyboardEvent, useState } from "react";
import { Plus, X } from "lucide-react";

import { cx, field } from "@/lib/ui";

/**
 * A list of short values (job titles, cities) shown as removable tags.
 * Type and press Enter or comma to add; Backspace on an empty field removes
 * the last one. Suggestions below narrow down as you type.
 */
export default function ChipInput({
    id,
    values,
    onChange,
    normalize,
    max,
    placeholder,
    morePlaceholder,
    suggestions = [],
    disabled = false,
}: {
    id: string;
    values: string[];
    onChange: (values: string[]) => void;
    /** Cleans, dedupes and caps the list. */
    normalize: (values: string[]) => string[];
    max: number;
    placeholder: string;
    morePlaceholder: string;
    suggestions?: string[];
    disabled?: boolean;
}) {
    const [draft, setDraft] = useState("");
    const full = values.length >= max;

    function add(text: string) {
        onChange(normalize([...values, ...text.split(",")]));
        setDraft("");
    }

    function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if ((event.key === "Enter" || event.key === ",") && draft.trim()) {
            event.preventDefault();
            add(draft);
        } else if (event.key === "Enter") {
            event.preventDefault();
        } else if (event.key === "Backspace" && !draft && values.length) {
            onChange(values.slice(0, -1));
        }
    }

    const chosen = new Set(values.map((v) => v.toLowerCase()));
    const query = draft.trim().toLowerCase();
    const shown = suggestions
        .filter((s) => !chosen.has(s.toLowerCase()))
        .filter((s) => !query || s.toLowerCase().includes(query))
        .slice(0, 6);

    return (
        <div>
            <div
                className={cx(
                    field.input,
                    "flex h-auto min-h-10 flex-wrap items-center gap-1.5 py-1.5 focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/20",
                )}
            >
                {values.map((value) => (
                    <span
                        key={value}
                        className="inline-flex items-center gap-1 rounded-full bg-accent-soft py-0.5 pl-2.5 pr-1 text-xs font-semibold text-accent-ink"
                    >
                        {value}
                        <button
                            type="button"
                            onClick={() => onChange(values.filter((v) => v !== value))}
                            disabled={disabled}
                            aria-label={`Remove ${value}`}
                            className="rounded-full p-0.5 hover:bg-accent/15"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </span>
                ))}
                {!full && (
                    <input
                        id={id}
                        value={draft}
                        onChange={(e) => (e.target.value.includes(",") ? add(e.target.value) : setDraft(e.target.value))}
                        onKeyDown={onKeyDown}
                        onBlur={() => draft.trim() && add(draft)}
                        placeholder={values.length ? morePlaceholder : placeholder}
                        maxLength={60}
                        disabled={disabled}
                        autoComplete="off"
                        className="min-w-[9rem] flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-faint"
                    />
                )}
            </div>

            {!full && shown.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Suggestions">
                    {shown.map((suggestion) => (
                        <button
                            key={suggestion}
                            type="button"
                            // Keep focus in the field so its blur doesn't add a half-typed value.
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => add(suggestion)}
                            disabled={disabled}
                            className="inline-flex items-center gap-1 rounded-full border border-[var(--glass-line)] px-2.5 py-0.5 text-xs font-medium text-ink-2 hover:border-accent-line hover:text-ink"
                        >
                            <Plus className="h-3 w-3" aria-hidden="true" />
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
