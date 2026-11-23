"use client";

import { FormEvent, useState } from "react";

import { ApiError, apiRequest } from "@/lib/api/client";
import { button, cx, field } from "@/lib/ui";
import {
    ANYWHERE,
    DEFAULT_RADIUS,
    MAX_CITIES,
    RADIUS_OPTIONS,
    joinCities,
    parseCities,
    radiusLabel,
} from "@/lib/radar/cities";
import { COMMON_TITLES, MAX_TITLES, joinTitles, parseTitles } from "@/lib/radar/titles";
import { EXPERIENCE_LABELS, EXPERIENCE_LEVELS, type ExperienceLevel } from "@/lib/radar/filters";
import { SOURCE_MODES, SOURCE_MODE_LABELS, type SourceMode } from "@/lib/radar/sources";
import ChipInput from "./ChipInput";
import type { GmailInfo } from "./AlertEmails";
import type { RadarProfile } from "./types";

const SUGGESTED = ["Berlin", "München", "Hamburg", "Frankfurt", "Köln", "Stuttgart", "Düsseldorf", "Leipzig"];

export default function RadarSettingsForm({
    profile,
    titleSuggestions = [],
    gmail,
    submitLabel,
    disabled,
    onSaved,
}: {
    profile: RadarProfile | null;
    /** Titles from the user's own applications, suggested first. */
    titleSuggestions?: string[];
    /** Gmail connection, to warn when alert emails are chosen but not connected. */
    gmail?: GmailInfo;
    submitLabel: string;
    disabled?: boolean;
    onSaved: () => void;
}) {
    const [titles, setTitles] = useState<string[]>(() => parseTitles(profile?.keywords));
    const [cities, setCities] = useState<string[]>(() => parseCities(profile?.location));
    const [radiusKm, setRadiusKm] = useState(profile?.radiusKm ?? DEFAULT_RADIUS);
    const [remoteOnly, setRemoteOnly] = useState(profile?.remoteOnly ?? false);
    const [visaOnly, setVisaOnly] = useState(profile?.visaOnly ?? false);
    const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(profile?.experienceLevel ?? "any");
    const [sourceMode, setSourceMode] = useState<SourceMode>(profile?.sourceMode ?? "both");
    const searching = sourceMode !== "alerts";
    const gmailConnected = Boolean(gmail?.status);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const anywhere = radiusKm === ANYWHERE;
    const citiesDisabled = remoteOnly || anywhere;
    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError("");

        const location = joinCities(cities);
        const keywords = joinTitles(titles);

        if (searching && !keywords) {
            setError("Add at least one job title.");
            return;
        }
        if (searching && !location && !remoteOnly && !anywhere) {
            setError("Add at least one city, or search anywhere in Germany.");
            return;
        }

        try {
            setSaving(true);
            await apiRequest("/api/radar/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keywords, location, radiusKm, remoteOnly, visaOnly, experienceLevel, sourceMode }),
            });
            onSaved();
        } catch (err) {
            setError(err instanceof ApiError && err.message ? err.message : "Your search wasn't saved. Try again.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <fieldset>
                <legend className={field.label}>Where should the radar look?</legend>
                <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
                    {SOURCE_MODES.map((mode) => {
                        const selected = sourceMode === mode;
                        return (
                            <button
                                key={mode}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() => setSourceMode(mode)}
                                className={cx(
                                    "rounded-2xl border px-3 py-2.5 text-left transition-[border-color,box-shadow]",
                                    selected
                                        ? "border-accent bg-[var(--glass-strong)] shadow-[0_0_0_3px_rgba(var(--accent-rgb),0.18)]"
                                        : "border-[var(--glass-line)] bg-[var(--glass)] hover:border-accent-line",
                                )}
                            >
                                <span className="block text-sm font-bold text-ink">{SOURCE_MODE_LABELS[mode].title}</span>
                                <span className="mt-0.5 block text-xs leading-4 text-muted">{SOURCE_MODE_LABELS[mode].hint}</span>
                            </button>
                        );
                    })}
                </div>
                {sourceMode !== "search" && gmail && !gmailConnected && (
                    <p className="mt-2 rounded-xl border border-interview-line bg-interview-soft px-3 py-2 text-xs leading-5 text-interview-ink">
                        Gmail isn&apos;t connected yet, so there are no alert emails to read.{" "}
                        <a href="/api/gmail/connect?from=radar" className="font-semibold underline underline-offset-2">
                            Connect Gmail
                        </a>
                    </p>
                )}
                {sourceMode === "alerts" && (
                    <p className={field.hint}>
                        Your alerts were already filtered on StepStone, Indeed, LinkedIn & co., so the radar takes every job
                        in them as it is and only ranks them against your CV. To change what you get, edit the alerts there.
                    </p>
                )}
            </fieldset>

            {searching && (
            <div>
                <label htmlFor="radar-keywords" className={field.label}>
                    Job titles <span className="font-normal text-muted">(up to {MAX_TITLES})</span>
                </label>
                <ChipInput
                    id="radar-keywords"
                    values={titles}
                    onChange={setTitles}
                    normalize={(list) => parseTitles(list.join(","))}
                    max={MAX_TITLES}
                    placeholder="Type a job title and press Enter"
                    morePlaceholder="Add another title"
                    suggestions={[...titleSuggestions, ...COMMON_TITLES]}
                />
                <p className={field.hint}>
                    Add the titles employers might use, in English and German, e.g. “Frontend Developer” and
                    “Softwareentwickler”.
                </p>
            </div>
            )}

            {searching && (
            <div>
                <label htmlFor="radar-level" className={field.label}>
                    Experience level
                </label>
                <select
                    id="radar-level"
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                    className={field.input}
                >
                    {EXPERIENCE_LEVELS.map((level) => (
                        <option key={level} value={level}>
                            {EXPERIENCE_LABELS[level]}
                        </option>
                    ))}
                </select>
                <p className={field.hint}>
                    {experienceLevel === "any"
                        ? "Shows every level, from internships to lead roles."
                        : "Leaves out roles above or below this level, based on the job title and the years of experience the ad asks for. Jobs from your alert emails are never filtered."}
                </p>
            </div>
            )}

            {searching && (
                <>
            <div>
                <label htmlFor="radar-radius" className={field.label}>
                    Search area
                </label>
                <select
                    id="radar-radius"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    disabled={remoteOnly}
                    className={field.input}
                >
                    {RADIUS_OPTIONS.map((km) => (
                        <option key={km} value={km}>
                            {km === ANYWHERE ? radiusLabel(km) : `Within ${km} km of my cities`}
                        </option>
                    ))}
                </select>
            </div>

            <fieldset disabled={citiesDisabled} className={cx("transition-opacity", citiesDisabled && "opacity-50")}>
                <label htmlFor="radar-city" className={field.label}>
                    Cities <span className="font-normal text-muted">(up to {MAX_CITIES})</span>
                </label>
                <ChipInput
                    id="radar-city"
                    values={cities}
                    onChange={setCities}
                    normalize={(list) => parseCities(list.join(","))}
                    max={MAX_CITIES}
                    placeholder="Type a city and press Enter"
                    morePlaceholder="Add another city"
                    suggestions={SUGGESTED}
                    disabled={citiesDisabled}
                />
                <p className={field.hint}>
                    {cities.length > 1
                        ? "Arbeitnow checks every city and title daily. Google Jobs searches one city and two titles a day, taking turns, to save its monthly allowance."
                        : "Remote jobs in Germany are included too."}
                </p>
            </fieldset>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
                <input
                    type="checkbox"
                    checked={remoteOnly}
                    onChange={(e) => setRemoteOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-line-strong accent-[var(--accent)]"
                />
                Remote jobs only
            </label>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
                <input
                    type="checkbox"
                    checked={visaOnly}
                    onChange={(e) => setVisaOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-line-strong accent-[var(--accent)]"
                />
                Only employers offering visa sponsorship
            </label>
            {visaOnly && (
                <p className="-mt-2 pl-6.5 text-xs text-muted">Only Arbeitnow lists sponsorship, so this searches Arbeitnow only.</p>
            )}
                </>
            )}

            {error && <p className="text-sm text-rejected-ink">{error}</p>}

            <button type="submit" disabled={saving || disabled} className={cx(button.primary, button.large, "w-full sm:w-auto")}>
                {saving ? "Saving…" : submitLabel}
            </button>
        </form>
    );
}
