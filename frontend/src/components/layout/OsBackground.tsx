import { useUiStore } from "#/stores/uiStore";

/**
 * The ambient world behind every OS screen — same universe as the landing
 * page, tuned down so data stays readable: aurora blobs, blueprint grid,
 * drifting star specks and a soft vignette. Renders a warm-paper variant
 * when the bright theme is active.
 */
export function OsBackground() {
  const bright = useUiStore((s) => s.theme) === "bright";

  if (bright) {
    return (
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#f3f0e9]">
        <div className="aurora-blob left-[-12%] top-[-18%] h-[640px] w-[640px]" style={{ background: "rgba(108,92,231,0.14)" }} />
        <div className="aurora-blob right-[-10%] top-[30%] h-[520px] w-[520px]" style={{ background: "rgba(8,145,207,0.1)", animationDelay: "-6s" }} />
        <div className="aurora-blob bottom-[-22%] left-[25%] h-[560px] w-[560px]" style={{ background: "rgba(236,72,153,0.07)", animationDelay: "-12s" }} />
        <div className="grid-lines absolute inset-0 opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_45%,rgba(214,206,190,0.5)_100%)]" />
      </div>
    );
  }

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#05060C]">
      {/* aurora */}
      <div className="aurora-blob left-[-12%] top-[-18%] h-[640px] w-[640px]" style={{ background: "rgba(108,92,231,0.22)" }} />
      <div className="aurora-blob right-[-10%] top-[30%] h-[520px] w-[520px]" style={{ background: "rgba(8,145,207,0.14)", animationDelay: "-6s" }} />
      <div className="aurora-blob bottom-[-22%] left-[25%] h-[560px] w-[560px]" style={{ background: "rgba(236,72,153,0.1)", animationDelay: "-12s" }} />

      {/* blueprint grid */}
      <div className="grid-lines absolute inset-0 opacity-60" />

      {/* star specks */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 12% 24%, rgba(230,233,242,0.5) 50%, transparent 50%)," +
            "radial-gradient(1px 1px at 38% 68%, rgba(163,149,244,0.5) 50%, transparent 50%)," +
            "radial-gradient(1.5px 1.5px at 61% 12%, rgba(230,233,242,0.4) 50%, transparent 50%)," +
            "radial-gradient(1px 1px at 78% 47%, rgba(103,199,245,0.5) 50%, transparent 50%)," +
            "radial-gradient(1px 1px at 89% 82%, rgba(230,233,242,0.4) 50%, transparent 50%)," +
            "radial-gradient(1.5px 1.5px at 24% 89%, rgba(163,149,244,0.35) 50%, transparent 50%)",
          backgroundSize: "1100px 900px",
        }}
      />

      {/* vignette keeps panels readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_40%,rgba(5,6,12,0.6)_100%)]" />
    </div>
  );
}
