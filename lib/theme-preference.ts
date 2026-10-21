export const THEME_COOKIE = "jt-theme";

export type ThemePreference = "light" | "dark" | "system";

export function parseTheme(value: string | undefined | null): ThemePreference {
    return value === "light" || value === "dark" ? value : "system";
}
