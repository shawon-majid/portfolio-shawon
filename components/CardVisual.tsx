import type { ProjectIcon } from "@/lib/resume-data";

/**
 * Animated, work-specific card visual. Each icon is line-art in the brand
 * palette with one clear motion that describes the work (data flowing through
 * a pipeline, a pulsing server hub, an equalizer analyzing conversations, an
 * agent traversing a graph, a live-tracking ping, a play/progress ring, rising
 * budget bars). Pure SVG + CSS animation (see .viz* / .v* in globals.css) — no
 * client JS, and all motion stops under prefers-reduced-motion.
 */
function Glyph({ icon }: { icon: ProjectIcon }) {
  switch (icon) {
    case "pipeline":
      return (
        <svg className="viz-svg" viewBox="0 0 120 120">
          <line className="vstroke vdim" x1="22" y1="60" x2="98" y2="60" />
          <circle className="vstroke" cx="22" cy="60" r="9" />
          <circle className="vstroke" cx="60" cy="60" r="9" />
          <circle className="vstroke" cx="98" cy="60" r="9" />
          <circle className="vfill vflow" cx="0" cy="60" r="3.5" />
          <circle className="vfill vflow vflow2" cx="0" cy="60" r="3.5" />
        </svg>
      );
    case "mcp":
      return (
        <svg className="viz-svg" viewBox="0 0 120 120">
          <line className="vstroke vdim" x1="34" y1="38" x2="52" y2="52" />
          <line className="vstroke vdim" x1="86" y1="38" x2="68" y2="52" />
          <line className="vstroke vdim" x1="34" y1="82" x2="52" y2="68" />
          <line className="vstroke vdim" x1="86" y1="82" x2="68" y2="68" />
          <circle className="vstroke vdim" cx="30" cy="34" r="6" />
          <circle className="vstroke vdim" cx="90" cy="34" r="6" />
          <circle className="vstroke vdim" cx="30" cy="86" r="6" />
          <circle className="vstroke vdim" cx="90" cy="86" r="6" />
          <rect className="vstroke vaccent" x="48" y="48" width="24" height="24" rx="5" />
          <rect className="vstroke vaccent vpulse" x="48" y="48" width="24" height="24" rx="5" />
        </svg>
      );
    case "insights":
      return (
        <svg className="viz-svg" viewBox="0 0 120 120">
          <path
            className="vstroke"
            d="M30 38 H90 a8 8 0 0 1 8 8 V74 a8 8 0 0 1 -8 8 H56 L42 94 V82 H30 a8 8 0 0 1 -8 -8 V46 a8 8 0 0 1 8 -8 Z"
          />
          <rect className="vfill vbar" x="42" y="52" width="7" height="20" />
          <rect className="vfill vbar vbar2" x="56" y="52" width="7" height="20" />
          <rect className="vfill vbar vbar3" x="70" y="52" width="7" height="20" />
        </svg>
      );
    case "agent":
      return (
        <svg className="viz-svg" viewBox="0 0 120 120">
          <line className="vstroke vdim" x1="34" y1="44" x2="86" y2="44" />
          <line className="vstroke vdim" x1="86" y1="44" x2="60" y2="86" />
          <line className="vstroke vdim" x1="60" y1="86" x2="34" y2="44" />
          <circle className="vstroke" cx="34" cy="44" r="8" />
          <circle className="vstroke" cx="86" cy="44" r="8" />
          <circle className="vstroke" cx="60" cy="86" r="8" />
          <circle className="vfill vtoken" cx="0" cy="0" r="4.5" />
        </svg>
      );
    case "eco":
      return (
        <svg className="viz-svg" viewBox="0 0 120 120">
          <circle className="vstroke vaccent vping" cx="60" cy="88" r="6" />
          <circle className="vstroke vaccent vping vping2" cx="60" cy="88" r="6" />
          <path
            className="vstroke"
            d="M60 26 a20 20 0 0 1 20 20 c0 15 -20 34 -20 34 s-20 -19 -20 -34 a20 20 0 0 1 20 -20 Z"
          />
          <circle className="vstroke vaccent" cx="60" cy="46" r="7" />
        </svg>
      );
    case "reel":
      return (
        <svg className="viz-svg" viewBox="0 0 120 120">
          <circle className="vstroke vdim" cx="60" cy="60" r="32" />
          <circle className="vprogress" cx="60" cy="60" r="32" pathLength={100} />
          <path className="vfill" d="M53 49 L74 60 L53 71 Z" />
        </svg>
      );
    case "budget":
      return (
        <svg className="viz-svg" viewBox="0 0 120 120">
          <line className="vstroke vdim" x1="30" y1="88" x2="92" y2="88" />
          <rect className="vfill vgrow" x="38" y="50" width="12" height="38" />
          <rect className="vfill vgrow vgrow2" x="56" y="40" width="12" height="48" />
          <rect className="vstroke vaccent vgrow vgrow3" x="74" y="58" width="12" height="30" />
        </svg>
      );
    default:
      return null;
  }
}

export default function CardVisual({ icon }: { icon?: ProjectIcon }) {
  return (
    <div className="viz" aria-hidden="true">
      <span className="viz-scan" />
      {icon ? <Glyph icon={icon} /> : <span className="viz-dot" />}
    </div>
  );
}
