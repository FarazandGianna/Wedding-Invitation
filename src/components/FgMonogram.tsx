interface Props {
  className?: string
  /**
   * Unused — kept for API compatibility with existing call sites.
   * The monogram PNG has its own gold coloring baked in.
   */
  halo?: string
}

/**
 * The canonical Faraz & Gianna (FG) monogram — an ornate Baroque oval
 * cartouche with interlocked serif initials in champagne gold.
 *
 * Rendered from a single transparent PNG (public/monogram.png) so the
 * exact artwork the couple approved is pixel-identical everywhere:
 * envelope seal, invitation card, hero watermark, footer, favicon.
 */
export default function FgMonogram({ className, halo: _halo }: Props) {
  return (
    <img
      src="/monogram.png"
      alt=""
      className={className}
      aria-hidden="true"
      draggable={false}
    />
  )
}
