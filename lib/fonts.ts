import { Plus_Jakarta_Sans } from "next/font/google";

/* -------------------------------------------------------------------------- */
/* Typography: Plus Jakarta Sans, bold and tight for headings ("Aurora").    */
/* `sans` / `serif` stay as named exports so older screens keep compiling.    */
/* -------------------------------------------------------------------------- */

export const ui = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

export const sans = { className: "" };

export const serif = { className: "font-extrabold tracking-[-0.035em]" };
