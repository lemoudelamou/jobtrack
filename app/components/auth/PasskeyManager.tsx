"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    Check as IconCheck,
    Fingerprint as IconFingerprint,
    Laptop as IconLaptop,
    ShieldCheck as IconShieldCheck,
    Smartphone as IconSmartphone,
} from "lucide-react";

import PasskeyRegistration from "./PasskeyRegistration";
import PasskeyRemoveButton from "./PasskeyRemoveButton";

type Passkey = {
    id: string;
    deviceType: string | null;
    backedUp: boolean;
    createdAt: string;
};

type PasskeyManagerProps = {
    initialPasskeys?: Passkey[];
    hasOtherSignInMethod?: boolean;
};

export default function PasskeyManager({
    initialPasskeys = [],
    hasOtherSignInMethod = false,
}: PasskeyManagerProps) {
    const router = useRouter();

    const [passkeys, setPasskeys] = useState<Passkey[]>(initialPasskeys);

    function handleRegistrationSuccess(passkey: Passkey) {
        setPasskeys((current) => [
            passkey,
            ...current.filter(
                (currentPasskey) => currentPasskey.id !== passkey.id,
            ),
        ]);

        /*
         * The list already reflects the new passkey via local state above,
         * so the UI doesn't wait on this. It just keeps the server-rendered
         * data (e.g. hasOtherSignInMethod on a future load) in sync in the
         * background.
         */
        router.refresh();
    }

    function handleRemoved(passkeyId: string) {
        setPasskeys((current) =>
            current.filter((passkey) => passkey.id !== passkeyId),
        );

        router.refresh();
    }

    const canRemovePasskeys = hasOtherSignInMethod || passkeys.length > 1;

    return (
        <div>
            {passkeys.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line bg-canvas px-5 py-7 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                        <IconFingerprint className="h-5 w-5" />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-ink">
                        No passkeys yet
                    </p>

                    <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-muted">
                        Add a passkey to make signing in faster while
                        keeping your account protected by your device.
                    </p>
                </div>
            ) : (
                <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                            Registered passkeys
                        </p>

                        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-muted">
                            {passkeys.length}{" "}
                            {passkeys.length === 1 ? "passkey" : "passkeys"}
                        </span>
                    </div>

                    <div
                        role="list"
                        aria-live="polite"
                        aria-label="Registered passkeys"
                        className="overflow-hidden rounded-2xl border border-line bg-canvas"
                    >
                        {passkeys.map((passkey) => (
                            <PasskeyRow
                                key={passkey.id}
                                passkey={passkey}
                                canRemove={canRemovePasskeys}
                                onRemoved={handleRemoved}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-6 rounded-2xl border border-line bg-canvas p-4 sm:p-5">
                <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-accent">
                        <IconShieldCheck className="h-4 w-4" />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-ink">
                            Add another passkey
                        </p>

                        <p className="mt-1 text-xs leading-5 text-muted">
                            Register another device or security key so you
                            have a backup sign-in method.
                        </p>
                    </div>
                </div>

                <div className="mt-4">
                    <PasskeyRegistration onSuccess={handleRegistrationSuccess} />
                </div>
            </div>
        </div>
    );
}

function PasskeyRow({
    passkey,
    canRemove,
    onRemoved,
}: {
    passkey: Passkey;
    canRemove: boolean;
    onRemoved: (passkeyId: string) => void;
}) {
    const deviceLabel =
        passkey.deviceType === "multiDevice"
            ? "Synced passkey"
            : passkey.deviceType === "singleDevice"
                ? "Device passkey"
                : "Passkey";

    const deviceDescription =
        passkey.deviceType === "multiDevice"
            ? "Available across your synced devices"
            : passkey.deviceType === "singleDevice"
                ? "Stored securely on this device"
                : "Secure sign-in credential";

    const DeviceIcon =
        passkey.deviceType === "multiDevice" ? IconSmartphone : IconLaptop;

    return (
        <div
            role="listitem"
            className="flex flex-col gap-4 border-b border-line bg-canvas px-4 py-4 transition-colors last:border-b-0 hover:bg-canvas sm:flex-row sm:items-center sm:justify-between"
        >
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <DeviceIcon className="h-4.5 w-4.5" />
                </div>

                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-ink">
                            {deviceLabel}
                        </p>

                        {passkey.backedUp && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                                <IconCheck className="h-3 w-3" />
                                Synced
                            </span>
                        )}
                    </div>

                    <p className="mt-0.5 text-xs text-muted">
                        {deviceDescription}
                    </p>

                    <p className="mt-1 text-[11px] text-faint">
                        Added{" "}
                        {new Date(passkey.createdAt).toLocaleDateString(
                            undefined,
                            {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                            },
                        )}
                    </p>
                </div>
            </div>

            {canRemove ? (
                <PasskeyRemoveButton
                    passkeyId={passkey.id}
                    onRemoved={onRemoved}
                />
            ) : (
                <span
                    title="This is your only sign-in method"
                    className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-surface-2 px-3 py-1.5 text-[11px] font-semibold text-muted sm:self-auto"
                >
                    <IconShieldCheck className="h-3.5 w-3.5 sm:hidden" />
                    <span className="hidden sm:inline">
                        Only sign-in method
                    </span>
                    <span className="sm:hidden">Only method</span>
                </span>
            )}
        </div>
    );
}