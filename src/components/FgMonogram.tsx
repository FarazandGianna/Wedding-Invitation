interface Props {
  className?: string
  /** Unused — kept for API compatibility. */
  halo?: string
  /** CSS mix-blend-mode for the image. Use "multiply" on light/cream backgrounds
   *  so the image's dark background blends instead of showing as a rectangle. */
  blend?: 'multiply' | 'screen' | 'normal' | 'darken' | 'lighten'
}

/**
 * The canonical Faraz & Gianna (FG) monogram — an ornate Baroque oval
 * cartouche with interlocked serif initials in champagne gold.
 *
 * Rendered from the couple's approved PNG (public/monogram.png) so the
 * exact artwork is pixel-identical everywhere: envelope seal, card, hero,
 * footer, favicon. On dark backgrounds the image's burgundy backing blends
 * naturally; pass blend="multiply" on light surfaces (e.g. the cream card).
 */
export default function FgMonogram({ className, halo: _halo, blend }: Props) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}monogram.png`}
      alt=""
      className={className}
      aria-hidden="true"
      draggable={false}
      style={blend ? { mixBlendMode: blend } : undefined}
    />
  )
}
