/* -------------------------------------------------------------------------- */
/* Shared class recipes                                                       */
/*                                                                            */
/* Small, composable Tailwind strings so buttons, fields and panels look the  */
/* same on every screen. Colors come from the tokens in app/globals.css.      */
/* -------------------------------------------------------------------------- */

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-[background-color,border-color,color,box-shadow,filter,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50";

export const button = {
  primary: cx(
    buttonBase,
    "h-9 bg-btn px-4 font-bold text-btn-fg shadow-[0_10px_32px_-10px_rgba(var(--accent-rgb),0.8)] hover:-translate-y-px hover:shadow-[0_14px_40px_-10px_rgba(var(--accent-rgb),0.95)]",
  ),
  secondary: cx(
    buttonBase,
    "h-9 border border-[var(--glass-line)] bg-[var(--glass)] px-4 text-ink backdrop-blur-xl hover:bg-[var(--glass-strong)]",
  ),
  ghost: cx(
    buttonBase,
    "h-9 px-3 font-medium text-ink-2 hover:bg-surface-2 hover:text-ink",
  ),
  danger: cx(
    buttonBase,
    "h-9 bg-rejected px-4 text-on-accent hover:brightness-110",
  ),
  icon: cx(
    buttonBase,
    "h-8 w-8 font-medium text-muted hover:bg-surface-2 hover:text-ink",
  ),
  large: "h-11 px-5",
};

export const field = {
  label: "mb-1.5 block text-sm font-medium text-ink",
  hint: "mt-1.5 text-xs text-muted",
  input:
    "block h-10 w-full rounded-xl border border-[var(--glass-line)] bg-[var(--glass)] backdrop-blur-xl px-3 text-sm text-ink outline-none focus-visible:outline-none transition-colors placeholder:text-faint hover:border-accent-line focus:border-accent focus:ring-3 focus:ring-accent/20 disabled:opacity-60",
  textarea:
    "block w-full rounded-xl border border-[var(--glass-line)] bg-[var(--glass)] backdrop-blur-xl px-3 py-2.5 text-sm leading-6 text-ink outline-none focus-visible:outline-none transition-colors placeholder:text-faint hover:border-accent-line focus:border-accent focus:ring-3 focus:ring-accent/20 disabled:opacity-60",
};

export const panel = "panel";
