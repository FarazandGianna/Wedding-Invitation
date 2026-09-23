/**
 * The canonical Faraz & Gianna (FG) monogram: an ornate oval cartouche
 * with intertwined serif initials, used on every brand surface.
 *
 * Uses SVG <text> with Cormorant Garamond for reliable, readable letters
 * inside a decorative Baroque-style frame.
 */
export const MONOGRAM_VIEWBOX = { w: 200, h: 280 } as const

/** Ornate symmetric Baroque cartouche frame; strokes use currentColor. */
export const MONOGRAM_FRAME = `
  <defs>
    <radialGradient id="mg-glow" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="currentColor" stop-opacity="0.06" />
      <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
    </radialGradient>
  </defs>
  <ellipse cx="100" cy="140" rx="82" ry="118" fill="url(#mg-glow)" />
  <g stroke="currentColor" fill="none" stroke-linecap="round">
    <!-- Outer oval -->
    <ellipse cx="100" cy="140" rx="78" ry="112" stroke-width="1.4" />
    <!-- Inner oval -->
    <ellipse cx="100" cy="140" rx="72" ry="106" stroke-width="0.5" opacity="0.55" />
    <!-- Top crown flourish -->
    <path d="M100 12 C 92 22, 88 32, 92 42 C 84 36, 74 36, 66 44 C 74 46, 82 48, 88 54 C 78 52, 68 56, 62 66 C 72 64, 82 66, 88 72 C 82 80, 80 90, 86 98 C 92 88, 96 78, 100 66 C 104 78, 108 88, 114 98 C 120 90, 118 80, 112 72 C 118 66, 128 64, 138 66 C 132 56, 122 52, 112 54 C 118 48, 126 46, 134 44 C 126 36, 116 36, 108 42 C 112 32, 108 22, 100 12 Z" stroke-width="1" opacity="0.9" />
    <!-- Bottom mirror flourish -->
    <path d="M100 268 C 108 258, 112 248, 108 238 C 116 244, 126 244, 134 236 C 126 234, 118 232, 112 226 C 122 228, 132 224, 138 214 C 128 216, 118 214, 112 208 C 118 200, 120 190, 114 182 C 108 192, 104 202, 100 214 C 96 202, 92 192, 86 182 C 80 190, 82 200, 88 208 C 82 214, 72 216, 62 214 C 68 224, 78 228, 88 226 C 82 232, 74 234, 66 236 C 74 244, 84 244, 92 238 C 88 248, 92 258, 100 268 Z" stroke-width="1" opacity="0.9" />
    <!-- Side flourishes left -->
    <path d="M22 100 C 14 94, 12 84, 18 76 C 24 84, 30 90, 38 92 C 32 98, 28 106, 30 114 C 24 110, 20 102, 22 100 Z" stroke-width="0.9" opacity="0.8" />
    <path d="M18 140 C 10 136, 8 128, 12 120 C 18 126, 24 130, 32 130 C 26 134, 22 138, 18 140 Z" stroke-width="0.8" opacity="0.75" />
    <path d="M22 180 C 14 186, 12 196, 18 204 C 24 196, 30 190, 38 188 C 32 182, 28 174, 30 166 C 24 170, 20 178, 22 180 Z" stroke-width="0.9" opacity="0.8" />
    <!-- Side flourishes right -->
    <path d="M178 100 C 186 94, 188 84, 182 76 C 176 84, 170 90, 162 92 C 168 98, 172 106, 170 114 C 176 110, 180 102, 178 100 Z" stroke-width="0.9" opacity="0.8" />
    <path d="M182 140 C 190 136, 192 128, 188 120 C 182 126, 176 130, 168 130 C 174 134, 178 138, 182 140 Z" stroke-width="0.8" opacity="0.75" />
    <path d="M178 180 C 186 186, 188 196, 182 204 C 176 196, 170 190, 162 188 C 168 182, 172 174, 170 166 C 176 170, 180 178, 178 180 Z" stroke-width="0.9" opacity="0.8" />
    <!-- Decorative dots -->
    <circle cx="100" cy="38" r="2.5" fill="currentColor" stroke="none" />
    <circle cx="100" cy="242" r="2.5" fill="currentColor" stroke="none" />
    <circle cx="42" cy="100" r="1.8" fill="currentColor" stroke="none" opacity="0.7" />
    <circle cx="158" cy="100" r="1.8" fill="currentColor" stroke="none" opacity="0.7" />
    <circle cx="42" cy="180" r="1.8" fill="currentColor" stroke="none" opacity="0.7" />
    <circle cx="158" cy="180" r="1.8" fill="currentColor" stroke="none" opacity="0.7" />
  </g>`

/** Letter layer: F and G as SVG text in Cormorant Garamond, intertwined. */
export const MONOGRAM_LETTERS = `
  <g fill="currentColor">
    <!-- F (behind, slightly left and up) -->
    <text x="78" y="165" font-family="'Cormorant Garamond', Georgia, serif" font-size="100" font-weight="600" text-anchor="middle" opacity="0.88">F</text>
    <!-- G (front, slightly right and down) -->
    <text x="122" y="185" font-family="'Cormorant Garamond', Georgia, serif" font-size="100" font-weight="600" text-anchor="middle">G</text>
  </g>`
