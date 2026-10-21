/*
 * Slowly drifting violet / pink / blue light behind every page.
 * Pure CSS (see .aurora-* in globals.css); motion stops when the user
 * prefers reduced motion.
 */
export default function AuroraBackground() {
    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="aurora-blob aurora-1" style={{ left: "-12vw", top: "-22vh", width: "52vw", height: "52vw", maxWidth: 820, maxHeight: 820 }} />
            <div className="aurora-blob aurora-2" style={{ right: "-10vw", top: "8vh", width: "44vw", height: "44vw", maxWidth: 720, maxHeight: 720 }} />
            <div className="aurora-blob aurora-3" style={{ left: "28vw", bottom: "-38vh", width: "58vw", height: "58vw", maxWidth: 900, maxHeight: 900 }} />
        </div>
    );
}
