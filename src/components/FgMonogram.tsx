import type { CSSProperties } from 'react'
import { MONOGRAM_FRAME, MONOGRAM_LETTERS, MONOGRAM_VIEWBOX } from './monogramData'

interface Props {
  className?: string
  /**
   * Page color sitting behind the mark — paints the halo that makes the G
   * read as woven over the F. Defaults to the site's wine background.
   * Pass the card/paper color when the mark sits on a light surface.
   */
  halo?: string
}

/**
 * The ONE canonical Faraz & Gianna (FG) monogram, shared by every brand
 * surface: envelope seal, invitation card, hero, footer, opening experience.
 * Letterforms are real Cormorant Garamond outlines baked into monogramData.ts
 * (the same data that generates favicon.svg and the PNG icons), so the mark
 * is pixel-identical everywhere and never depends on installed fonts.
 */
export default function FgMonogram({ className, halo }: Props) {
  const style = halo ? ({ '--monogram-halo': halo } as CSSProperties) : undefined
  return (
    <svg
      viewBox={`0 0 ${MONOGRAM_VIEWBOX.w} ${MONOGRAM_VIEWBOX.h}`}
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: MONOGRAM_FRAME + MONOGRAM_LETTERS }}
    />
  )
}
