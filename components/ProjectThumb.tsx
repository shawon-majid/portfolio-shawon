"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Screenshot overlay for a project card. Sits on top of the animated CardMotif
 * base layer and fades in only after a confirmed load. If there's no image, or
 * it 404s, this renders nothing — so the motif shows through and the browser's
 * broken-image glyph never appears (survives the SSR→hydration race via the
 * img.complete / naturalWidth check on mount).
 */
export default function ProjectThumb({ src, name }: { src?: string; name: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(!src);
  const ref = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = ref.current;
    if (!img) return;
    if (img.complete) {
      if (img.naturalWidth > 0) setLoaded(true);
      else setFailed(true);
    }
  }, []);

  if (!src || failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      className="thumb-img"
      src={src}
      alt={`${name} — screenshot`}
      loading="lazy"
      decoding="async"
      style={{ opacity: loaded ? 1 : 0 }}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
    />
  );
}
