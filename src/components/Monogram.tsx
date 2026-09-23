interface Props {
  letterLeft: string
  letterRight: string
  className?: string
}

/**
 * Intertwined two-initial monogram in the style of a traditional engraved
 * wedding mark (see the couple's reference invitation): two large serif
 * capitals sharing the oval's center, the front letter carrying a paper-toned
 * halo so its strokes read as passing OVER the back letter — the same layered
 * weaving as hand-engraved double monograms.
 *
 * Pure SVG (no external assets), colored via currentColor so it inherits the
 * gold accent everywhere it's used.
 */
export default function Monogram({ letterLeft, letterRight, className }: Props) {
  return (
    <svg viewBox="0 0 220 280" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* engraved oval frame with flourishes */}
      <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
        <ellipse cx="110" cy="140" rx="74" ry="100" />
        <ellipse cx="110" cy="140" rx="64" ry="90" strokeWidth="0.6" opacity="0.7" />

        {/* top flourish */}
        <path d="M110 40 C 100 28, 84 24, 74 32 C 66 38, 68 48, 78 50 C 70 44, 76 38, 84 40 C 92 42, 92 50, 84 54" />
        <path d="M110 40 C 120 28, 136 24, 146 32 C 154 38, 152 48, 142 50 C 150 44, 144 38, 136 40 C 128 42, 128 50, 136 54" />
        <path d="M96 34 Q110 22 124 34" strokeWidth="0.8" />

        {/* bottom flourish */}
        <path d="M110 240 C 100 252, 84 256, 74 248 C 66 242, 68 232, 78 230 C 70 236, 76 242, 84 240 C 92 238, 92 230, 84 226" />
        <path d="M110 240 C 120 252, 136 256, 146 248 C 154 242, 152 232, 142 230 C 150 236, 144 242, 136 240 C 128 238, 128 230, 136 226" />
        <path d="M96 246 Q110 258 124 246" strokeWidth="0.8" />

        {/* side sprigs */}
        <path d="M36 140 C 28 132, 28 120, 38 116 M38 116 C 34 122, 38 128, 44 126" strokeWidth="0.8" opacity="0.8" />
        <path d="M184 140 C 192 132, 192 120, 182 116 M182 116 C 186 122, 182 128, 176 126" strokeWidth="0.8" opacity="0.8" />
        <path d="M36 140 C 28 148, 28 160, 38 164 M38 164 C 34 158, 38 152, 44 154" strokeWidth="0.8" opacity="0.8" />
        <path d="M184 140 C 192 148, 192 160, 182 164 M182 164 C 186 158, 182 152, 176 154" strokeWidth="0.8" opacity="0.8" />
      </g>

      {/* the two initials, woven: the BACK letter is drawn first at full
          opacity; the FRONT letter carries a page-colored stroke halo
          (paint-order: stroke) so it visually overlaps and threads through
          its partner, exactly like the engraved reference. */}
      <g
        fontFamily="'Cormorant Garamond', 'Cormorant', Georgia, 'Times New Roman', serif"
        fontWeight="500"
        fontStyle="italic"
        textAnchor="middle"
      >
        {/* back letter — sits slightly left and higher */}
        <text x="99" y="196" fontSize="150" fill="currentColor">
          {letterRight}
        </text>
        {/* front letter — slightly right and lower, haloed so it weaves over */}
        <text
          x="123"
          y="204"
          fontSize="150"
          fill="currentColor"
          stroke="var(--monogram-halo, #360b14)"
          strokeWidth="7"
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          {letterLeft}
        </text>
      </g>
    </svg>
  )
}
