"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, FileText, LoaderCircle, Pencil, RefreshCw, X } from "lucide-react";

import CvUpload from "@/app/components/radar/CvUpload";
import MatchCard from "@/app/components/radar/MatchCard";
import RadarSettingsForm from "@/app/components/radar/RadarSettingsForm";
import AlertEmails from "@/app/components/radar/AlertEmails";
import { timeAgo, type LeadStatus, type RadarData } from "@/app/components/radar/types";
import Sheet from "@/app/components/ui/Sheet";
import { ApiError, apiRequest } from "@/lib/api/client";
import { button, cx } from "@/lib/ui";
import { cityOfTheDay, describeArea, parseCities, radiusLabel } from "@/lib/radar/cities";
import { EXPERIENCE_LABELS } from "@/lib/radar/filters";
import { SOURCE_MODE_LABELS, usesAlerts, usesSearch } from "@/lib/radar/sources";

const STALE_MS = 20 * 60 * 60 * 1000;

const TABS: Array<{ id: LeadStatus; label: string }> = [
    { id: "New", label: "New" },
    { id: "Saved", label: "Saved" },
    { id: "Dismissed", label: "Not for me" },
];

function describeSearch(data: RadarData) {
    const p = data.profile;
    if (!p) return "";
    const search = `“${p.keywords}”, ${describeArea(p)}${p.visaOnly ? ", with visa sponsorship" : ""}`;
    if (p.sourceMode === "alerts") return "your job alert emails";
    if (p.sourceMode === "both") return `${search}, plus your job alert emails`;
    return search;
}

function SearchRail({
    data,
    onEdit,
    onReload,
}: {
    data: RadarData;
    onEdit: () => void;
    onReload: () => void;
}) {
    const p = data.profile!;
    const search = usesSearch(p.sourceMode);
    const usage = data.sources.jsearchUsage;
    const jsearchSpent = Boolean(usage && usage.used >= usage.limit);
    const sources = [
        {
            name: "Google Jobs",
            on: search && data.sources.jsearch && !p.visaOnly && !jsearchSpent,
            note: !search
                ? "Off: you chose alert emails only"
                : !data.sources.jsearch
                ? "Add an API key to enable"
                : p.visaOnly
                  ? "Off while visa filter is on"
                  : jsearchSpent
                    ? "Monthly searches used up"
                    : usage
                      ? `${usage.limit - usage.used} of ${usage.limit} searches left this month`
                      : "StepStone, Indeed, LinkedIn and more",
        },
        {
            name: "Arbeitnow",
            on: search && data.sources.arbeitnow,
            note: search ? "Tech and startup roles" : "Off: you chose alert emails only",
        },
        {
            name: "Job alert emails",
            on: usesAlerts(p.sourceMode) && Boolean(data.gmail?.status),
            note: !usesAlerts(p.sourceMode)
                ? "Off: you chose job search only"
                : data.gmail?.status
                  ? "StepStone, Indeed, LinkedIn, XING, Glassdoor"
                  : "Connect Gmail below to use them",
        },
    ];

    return (
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <section className="panel p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-ink">Your search</h2>
                    <button type="button" onClick={onEdit} className={cx(button.ghost, "h-7 px-2.5 text-xs")}>
                        <Pencil className="h-3 w-3" strokeWidth={2} />
                        Edit
                    </button>
                </div>
                <p className="mt-3 text-xl font-extrabold leading-snug tracking-[-0.02em] text-ink">
                    {search ? p.keywords : "Jobs from your alert emails"}
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                        <dt className="text-muted">Looking in</dt>
                        <dd className="text-right text-ink-2">{SOURCE_MODE_LABELS[p.sourceMode].title}</dd>
                    </div>
                    {search && (
                    <div className="flex justify-between gap-3">
                        <dt className="text-muted">Where</dt>
                        <dd className="text-right text-ink-2">
                            {p.remoteOnly ? "Remote only" : p.radiusKm === 0 || !parseCities(p.location).length ? "All of Germany" : p.location}
                        </dd>
                    </div>
                    )}
                    {search && !p.remoteOnly && p.radiusKm !== 0 && parseCities(p.location).length > 0 && (
                        <div className="flex justify-between gap-3">
                            <dt className="text-muted">Radius</dt>
                            <dd className="text-ink-2">{radiusLabel(p.radiusKm)}</dd>
                        </div>
                    )}
                    {search && !p.remoteOnly && p.radiusKm !== 0 && data.sources.jsearch && parseCities(p.location).length > 1 && (
                        <div className="flex justify-between gap-3">
                            <dt className="text-muted">Google Jobs today</dt>
                            <dd className="text-right text-ink-2">{cityOfTheDay(parseCities(p.location))}</dd>
                        </div>
                    )}
                    <div className="flex justify-between gap-3">
                        <dt className="text-muted">Level</dt>
                        <dd className="text-right text-ink-2">{EXPERIENCE_LABELS[p.experienceLevel ?? "any"].split(" (")[0]}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                        <dt className="text-muted">Visa sponsorship</dt>
                        <dd className="text-ink-2">{p.visaOnly ? "Required" : "Any"}</dd>
                    </div>
                </dl>
            </section>

            <section className="panel p-4">
                <h2 className="text-sm font-semibold text-ink">Sources</h2>
                <ul className="mt-3 space-y-2.5">
                    {sources.map((source) => (
                        <li key={source.name} className="flex items-start gap-2.5 text-sm">
                            <span
                                aria-hidden="true"
                                className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", source.on ? "live-dot bg-accent" : "bg-line-strong")}
                            />
                            <span>
                                <span className="font-medium text-ink">{source.name}</span>
                                <span className="sr-only">{source.on ? " (on)" : " (off)"}</span>
                                <span className="block text-xs text-muted">{source.note}</span>
                            </span>
                        </li>
                    ))}
                </ul>
            </section>

            {data.gmail && <AlertEmails gmail={data.gmail} onChange={onReload} />}

            {data.resume && (
                <section className="panel flex items-center gap-2.5 p-4 text-sm">
                    <FileText className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.75} />
                    <span className="min-w-0">
                        <span className="block text-xs text-muted">Ranked against</span>
                        <span className="block truncate text-ink-2">{data.resume.fileName}</span>
                    </span>
                </section>
            )}
        </aside>
    );
}

/* -------------------------------------------------------------------------- */

function Setup({ data, onChange, onReady }: { data: RadarData; onChange: () => void; onReady: () => void }) {
    const cvReady = Boolean(data.resume?.ready);

    return (
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <ol className="space-y-4">
                <li className="panel p-5">
                    <h2 className="flex items-center gap-2.5 text-sm font-semibold text-ink">
                        <span className={cx("flex h-5 w-5 items-center justify-center rounded-full text-[11px]", cvReady ? "bg-accent text-on-accent" : "bg-surface-2 text-ink-2")}>
                            1
                        </span>
                        Upload your CV
                    </h2>
                    <p className="mb-4 mt-1 pl-7.5 text-sm text-muted">Every job is compared with it, so the closest matches come first.</p>
                    <div className="pl-7.5">
                        <CvUpload current={data.resume} onUploaded={onChange} />
                    </div>
                </li>

                <li className={cx("panel p-5", !cvReady && "opacity-60")}>
                    <h2 className="flex items-center gap-2.5 text-sm font-semibold text-ink">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-2 text-[11px] text-ink-2">2</span>
                        Choose what to look for
                    </h2>
                    <p className="mb-4 mt-1 pl-7.5 text-sm text-muted">You can change this any time.</p>
                    <div className="pl-7.5">
                        <RadarSettingsForm
                            profile={data.profile}
                            titleSuggestions={data.titleSuggestions}
                            gmail={data.gmail}
                            submitLabel="Start the radar"
                            disabled={!cvReady}
                            onSaved={onReady}
                        />
                    </div>
                </li>
            </ol>

            <aside className="text-sm leading-6 text-muted lg:pt-1">
                <h2 className="font-medium text-ink">How it works</h2>
                <p className="mt-2">
                    Every day the radar searches Google Jobs, which collects postings from StepStone, Indeed, LinkedIn and company sites, plus Arbeitnow for
                    tech and startup roles.
                </p>
                <p className="mt-2">
                    Each posting is compared with your CV and ranked. The best matches get a short note on what fits and
                    what&apos;s missing. Save one and it lands in your Wishlist, already filled in.
                </p>
            </aside>
        </section>
    );
}

/* -------------------------------------------------------------------------- */

export default function RadarPage() {
    const [data, setData] = useState<RadarData | null>(null);
    const [tab, setTab] = useState<LeadStatus>("New");
    const [loadError, setLoadError] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [notice, setNotice] = useState<{ tone: "error" | "info"; text: string } | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [busy, setBusy] = useState<Record<number, "save" | "dismiss" | "explain">>({});
    const autoRefreshed = useRef(false);

    // Coming back from Google's consent screen (/radar?gmail=…).
    useEffect(() => {
        const result = new URLSearchParams(window.location.search).get("gmail");
        if (!result) return;
        const messages: Record<string, { tone: "error" | "info"; text: string }> = {
            connected: { tone: "info", text: "Gmail connected. Your job alert emails are read on every radar update, starting with the next one." },
            denied: { tone: "error", text: "Gmail wasn't connected: access was declined." },
            expired: { tone: "error", text: "That Gmail connection attempt expired. Try again." },
            failed: { tone: "error", text: "Gmail couldn't be connected. Make sure you allow read access, then try again." },
            unavailable: { tone: "error", text: "Gmail can't be connected until Google sign-in is set up for this app." },
        };
        // Reading the URL once on arrival; the notice is the effect's whole purpose.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (messages[result]) setNotice(messages[result]);
        window.history.replaceState(null, "", "/radar");
    }, []);

    const load = useCallback(async (status: LeadStatus) => {
        try {
            setLoadError("");
            const next = await apiRequest<RadarData>(`/api/radar?status=${status}`, { cache: "no-store" });
            setData(next);
            return next;
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) return null;
            setLoadError("The radar didn't load. Check your connection and try again.");
            return null;
        }
    }, []);

    const refresh = useCallback(async () => {
        setRefreshing(true);
        setNotice(null);

        try {
            const result = await apiRequest<{ found: number; added: number; explained: number }>("/api/radar/refresh", {
                method: "POST",
            });
            setNotice({
                tone: "info",
                text:
                    result.added > 0
                        ? `${result.added} new ${result.added === 1 ? "posting" : "postings"} added and ranked.`
                        : result.found > 0
                            ? "No new postings since the last check."
                            : "No current postings match this search. Try more keywords, separated by commas.",
            });
        } catch (error) {
            setNotice({
                tone: "error",
                text: error instanceof ApiError && error.message ? error.message : "The radar couldn't update. Try again later.",
            });
        } finally {
            setRefreshing(false);
            setTab("New");
            await load("New");
        }
    }, [load]);

    // First load, then refresh automatically if the last run is old.
    useEffect(() => {
        let cancelled = false;

        (async () => {
            const initial = await load("New");
            if (cancelled || !initial || autoRefreshed.current) return;

            const p = initial.profile;
            const stale = p && initial.resume?.ready && (!p.lastRunAt || Date.now() - new Date(p.lastRunAt).getTime() > STALE_MS);
            if (stale) {
                autoRefreshed.current = true;
                refresh();
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [load, refresh]);

    function switchTab(next: LeadStatus) {
        setTab(next);
        load(next);
    }

    async function act(leadId: number, kind: "save" | "dismiss" | "restore" | "explain") {
        setBusy((current) => ({ ...current, [leadId]: kind === "restore" ? "dismiss" : kind }));
        setNotice(null);

        try {
            if (kind === "save") {
                await apiRequest(`/api/radar/leads/${leadId}/save`, { method: "POST" });
                setNotice({ tone: "info", text: "Saved to your Wishlist." });
            } else if (kind === "explain") {
                await apiRequest(`/api/radar/leads/${leadId}/explain`, { method: "POST" });
            } else {
                await apiRequest(`/api/radar/leads/${leadId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: kind === "dismiss" ? "Dismissed" : "New" }),
                });
            }
            await load(tab);
        } catch (error) {
            setNotice({
                tone: "error",
                text: error instanceof ApiError && error.message ? error.message : "That didn't work. Try again.",
            });
        } finally {
            setBusy((current) => {
                const next = { ...current };
                delete next[leadId];
                return next;
            });
        }
    }

    const configured = Boolean(data?.profile && data.resume?.ready);

    return (
        <main className="mx-auto w-full max-w-[1520px] px-4 pb-16 pt-4 sm:px-6 lg:px-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.045em] text-ink sm:text-6xl">Job <span className="text-accent-gradient">radar</span></h1>
                    <p className="mt-1 text-sm text-muted">
                        {data && configured ? (
                            <>
                                New postings for {describeSearch(data)}, ranked against your CV.
                                {data.profile?.lastRunAt && ` Updated ${timeAgo(data.profile.lastRunAt)}.`}
                            </>
                        ) : (
                            "New jobs in Germany every day, ranked by how well they fit your CV."
                        )}
                    </p>
                </div>

                {configured && (
                    <div className="flex gap-2">
                        <button type="button" onClick={refresh} disabled={refreshing} className={button.primary}>
                            <RefreshCw className={cx("h-4 w-4", refreshing && "animate-spin")} strokeWidth={1.75} />
                            {refreshing ? "Updating…" : "Refresh"}
                        </button>
                    </div>
                )}
            </header>

            <div className="mt-6 space-y-5">
                {loadError && (
                    <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rejected-line bg-rejected-soft px-4 py-3 text-sm text-rejected-ink">
                        <span className="flex items-center gap-2.5">
                            <AlertCircle className="h-4 w-4" strokeWidth={2} />
                            {loadError}
                        </span>
                        <button type="button" onClick={() => load(tab)} className={button.secondary}>
                            Try again
                        </button>
                    </div>
                )}

                {notice && (
                    <div
                        role={notice.tone === "error" ? "alert" : "status"}
                        className={cx(
                            "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
                            notice.tone === "error" ? "border-rejected-line bg-rejected-soft text-rejected-ink" : "border-line bg-surface text-ink-2",
                        )}
                    >
                        {notice.text}
                        <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className={button.icon}>
                            <X className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                    </div>
                )}

                {!data && !loadError && (
                    <div className="animate-pulse space-y-3" aria-busy="true" aria-label="Loading the radar">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="h-32 rounded-2xl bg-surface-2/60" />
                        ))}
                    </div>
                )}

                {data && !configured && (
                    <Setup
                        data={data}
                        onChange={() => load("New")}
                        onReady={async () => {
                            await load("New");
                            refresh();
                        }}
                    />
                )}

                {data && configured && (
                    <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
                        <SearchRail data={data} onEdit={() => setSettingsOpen(true)} onReload={() => load(tab)} />
                        <div className="min-w-0 space-y-5">
                        {data.profile?.lastRunError && !refreshing && !notice && (
                            <div role="alert" className="rounded-xl border border-interview-line bg-interview-soft px-4 py-3 text-sm text-interview-ink">
                                {data.profile.lastRunError.startsWith("partial:")
                                    ? data.profile.lastRunError.slice("partial:".length)
                                    : `The last update failed: ${data.profile.lastRunError}`}
                            </div>
                        )}

                        <div role="tablist" aria-label="Matches" className="inline-flex rounded-full border border-[var(--glass-line)] bg-[var(--glass)] p-1 backdrop-blur-xl">
                            {TABS.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={tab === item.id}
                                    onClick={() => switchTab(item.id)}
                                    className={cx(
                                        "flex h-8 items-center gap-2 rounded-full px-3.5 text-sm transition-colors",
                                        tab === item.id ? "bg-btn font-bold text-btn-fg" : "font-semibold text-ink-2 hover:text-ink",
                                    )}
                                >
                                    {item.label}
                                    <span className="rounded-full bg-[var(--glass-strong)] px-1.5 text-xs tabular-nums">
                                        {data.counts[item.id]}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {refreshing && tab === "New" && (
                            <div className="panel flex items-center gap-3 px-4 py-4 text-sm text-ink-2">
                                <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-accent" strokeWidth={2} />
                                Collecting new postings and ranking them against your CV. This can take up to a minute.
                            </div>
                        )}

                        {data.leads.length > 0 ? (
                            <ul className="grid gap-4 md:grid-cols-2">
                                {data.leads.map((lead) => (
                                    <MatchCard
                                        key={lead.id}
                                        lead={lead}
                                        aiEnabled={data.aiEnabled}
                                        busy={busy[lead.id] ?? null}
                                        onSave={() => act(lead.id, "save")}
                                        onDismiss={() => act(lead.id, "dismiss")}
                                        onRestore={() => act(lead.id, "restore")}
                                        onExplain={() => act(lead.id, "explain")}
                                    />
                                ))}
                            </ul>
                        ) : (
                            !refreshing && (
                                <div className="rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center">
                                    <p className="text-sm font-medium text-ink">
                                        {tab === "New"
                                            ? "No new matches right now"
                                            : tab === "Saved"
                                                ? "Nothing saved yet"
                                                : "Nothing hidden"}
                                    </p>
                                    <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                                        {tab === "New"
                                            ? "The radar checks again tomorrow. More keywords, separated by commas, find more."
                                            : tab === "Saved"
                                                ? "Matches you save go to your Wishlist and are listed here."
                                                : "Matches you mark as not for you are kept here in case you change your mind."}
                                    </p>
                                </div>
                            )
                        )}

                        <p className="pt-2 text-xs text-faint">
                            Job data from{" "}
                            <a href="https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
                                JSearch (Google Jobs)
                            </a>{" "}
                            and{" "}
                            <a href="https://www.arbeitnow.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
                                Arbeitnow
                            </a>
                            . Match scores compare each posting with your CV and are a guide, not a verdict.
                        </p>
                        </div>
                    </div>
                )}
            </div>

            <Sheet open={settingsOpen} onClose={() => setSettingsOpen(false)} labelledBy="radar-settings-title">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                    <h2 id="radar-settings-title" className="text-base font-semibold text-ink">
                        Search settings
                    </h2>
                    <button type="button" onClick={() => setSettingsOpen(false)} aria-label="Close" className={button.icon}>
                        <X className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                </div>
                <div className="flex-1 space-y-8 overflow-y-auto px-5 py-5">
                    {data && (
                        <>
                            <section>
                                <h3 className="mb-3 text-sm font-semibold text-ink">What to look for</h3>
                                <RadarSettingsForm
                                    // Only the search itself, not run timestamps, so a background run
                                    // finishing doesn't wipe what you're typing.
                                    key={JSON.stringify([
                                        data.profile?.keywords,
                                        data.profile?.location,
                                        data.profile?.radiusKm,
                                        data.profile?.remoteOnly,
                                        data.profile?.visaOnly,
                                        data.profile?.experienceLevel,
                                        data.profile?.sourceMode,
                                    ])}
                                    profile={data.profile}
                                    titleSuggestions={data.titleSuggestions}
                            gmail={data.gmail}
                                    submitLabel="Save and search again"
                                    onSaved={async () => {
                                        setSettingsOpen(false);
                                        await load("New");
                                        refresh();
                                    }}
                                />
                                <p className="mt-3 text-xs text-muted">Changing the search clears open matches from the old one. Saved jobs stay.</p>
                            </section>
                            <section>
                                <h3 className="mb-3 text-sm font-semibold text-ink">Your CV</h3>
                                <CvUpload
                                    current={data.resume}
                                    onUploaded={async () => {
                                        await load(tab);
                                        setNotice({ tone: "info", text: "CV updated. Refresh to re-rank your matches." });
                                    }}
                                />
                            </section>
                        </>
                    )}
                </div>
            </Sheet>
        </main>
    );
}
