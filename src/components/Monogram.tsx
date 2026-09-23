interface Props {
  letterLeft: string
  letterRight: string
  className?: string
}

/**
 * Decorative oval frame with two intertwined initials, in the style of a
 * traditional engraved wedding monogram. Pure SVG (no external assets),
 * colored via currentColor so it inherits the gold accent everywhere it's
 * used.
 */
export default function Monogram({ letterLeft, letterRight, className }: Props) {
  return (
    <svg viewBox="0 0 220 280" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* outer flourish frame */}
      <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
        <ellipse cx="110" cy="140" rx="72" ry="98" />
        <ellipse cx="110" cy="140" rx="62" ry="88" strokeWidth="0.6" opacity="0.7" />

        {/* top flourish */}
        <path d="M110 42 C 100 30, 84 26, 74 34 C 66 40, 68 50, 78 52 C 70 46, 76 40, 84 42 C 92 44, 92 52, 84 56" />
        <path d="M110 42 C 120 30, 136 26, 146 34 C 154 40, 152 50, 142 52 C 150 46, 144 40, 136 42 C 128 44, 128 52, 136 56" />
        <path d="M96 36 Q110 24 124 36" strokeWidth="0.8" />

        {/* bottom flourish */}
        <path d="M110 238 C 100 250, 84 254, 74 246 C 66 240, 68 230, 78 228 C 70 234, 76 240, 84 238 C 92 236, 92 228, 84 224" />
        <path d="M110 238 C 120 250, 136 254, 146 246 C 154 240, 152 230, 142 228 C 150 234, 144 240, 136 238 C 128 236, 128 228, 136 224" />
        <path d="M96 244 Q110 256 124 244" strokeWidth="0.8" />

        {/* side sprigs */}
        <path d="M38 140 C 30 132, 30 120, 40 116 M40 116 C 36 122, 40 128, 46 126" strokeWidth="0.8" opacity="0.8" />
        <path d="M182 140 C 190 132, 190 120, 180 116 M180 116 C 184 122, 180 128, 174 126" strokeWidth="0.8" opacity="0.8" />
        <path d="M38 140 C 30 148, 30 160, 40 164 M40 164 C 36 158, 40 152, 46 154" strokeWidth="0.8" opacity="0.8" />
        <path d="M182 140 C 190 148, 190 160, 180 164 M180 164 C 184 158, 180 152, 174 154" strokeWidth="0.8" opacity="0.8" />

        {/* small corner dots */}
        <circle cx="110" cy="34" r="1.4" fill="currentColor" />
        <circle cx="110" cy="246" r="1.4" fill="currentColor" />
      </g>

      {/* intertwined initials */}
      <text
        x="82"
        y="158"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontStyle="italic"
        fontSize="64"
        fill="currentColor"
        opacity="0.96"
      >
        {letterLeft}
      </text>
      <text
        x="140"
        y="158"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontStyle="italic"
        fontSize="64"
        fill="currentColor"
      >
        {letterRight}
      </text>
      <line x1="98" y1="112" x2="98" y2="176" stroke="currentColor" strokeWidth="0.7" opacity="0.55" />
    </svg>
  )
}
