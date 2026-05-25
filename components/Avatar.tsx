"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Headshot with a deterministic initials fallback. The "SM" placeholder is the
 * base layer; the photo fades in on top only after a confirmed load. Survives
 * the SSR→hydration race (see ProjectThumb for the rationale), so a missing
 * public/shawon.jpg shows clean initials, never a broken-image glyph.
 */
export default function Avatar({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = ref.current;
    if (!img) return;
    if (img.complete) {
      if (img.naturalWidth > 0) setLoaded(true);
      else setFailed(true);
    }
  }, []);

  return (
    <div className="avatar-wrap">
      <div className="avatar-ph" aria-hidden="true">
        SM
      </div>
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          className="avatar-img"
          src={src}
          alt={alt}
          width={280}
          height={280}
          loading="eager"
          style={{ opacity: loaded ? 1 : 0 }}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
