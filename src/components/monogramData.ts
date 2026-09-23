/**
 * The canonical Faraz & Gianna (FG) monogram: ornate Baroque filigree crest
 * with intertwined serif initials. Used on every brand surface — envelope
 * seal, invitation card, hero, footer, favicon, PWA icons.
 *
 * The frame is a symmetric Baroque cartouche with acanthus leaf scrolls.
 * The letters F and G are interwoven in a classic serif style.
 */
export const MONOGRAM_VIEWBOX = { w: 240, h: 320 } as const

/** Ornate symmetric Baroque cartouche frame; strokes use currentColor. */
export const MONOGRAM_FRAME = `
  <defs>
    <radialGradient id="monogramGlow" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="currentColor" stop-opacity="0.08" />
      <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
    </radialGradient>
  </defs>
  <ellipse cx="120" cy="150" rx="100" ry="130" fill="url(#monogramGlow)" />
  <g stroke="currentColor" stroke-width="1.2" stroke-linecap="round" fill="none">
    <!-- Outer ornate ellipse -->
    <ellipse cx="120" cy="150" rx="92" ry="118" stroke-width="1.4" />
    <ellipse cx="120" cy="150" rx="86" ry="112" stroke-width="0.6" opacity="0.6" />
    <!-- Top crown/crest flourish -->
    <path d="M120 20 C 114 28, 110 36, 112 44 C 108 38, 100 34, 92 38 C 98 42, 104 44, 108 50 C 100 48, 92 52, 88 60 C 96 58, 104 58, 110 62 C 104 68, 100 76, 104 84 C 110 78, 116 74, 120 66 C 124 74, 130 78, 136 84 C 140 76, 136 68, 130 62 C 136 58, 144 58, 152 60 C 148 52, 140 48, 132 50 C 136 44, 142 42, 148 38 C 140 34, 132 38, 128 44 C 130 36, 126 28, 120 20 Z" stroke-width="1" opacity="0.9" />
    <!-- Bottom mirror flourish -->
    <path d="M120 280 C 126 272, 130 264, 128 256 C 132 262, 140 266, 148 262 C 142 258, 136 256, 132 250 C 140 252, 148 248, 152 240 C 144 242, 136 242, 130 238 C 136 232, 140 224, 136 216 C 130 222, 124 226, 120 234 C 116 226, 110 222, 104 216 C 100 224, 104 232, 110 238 C 104 242, 96 242, 88 240 C 92 248, 100 252, 108 250 C 104 256, 98 258, 92 262 C 100 266, 108 262, 112 256 C 110 264, 114 272, 120 280 Z" stroke-width="1" opacity="0.9" />
    <!-- Left side flourish -->
    <path d="M28 100 C 20 92, 18 82, 24 74 C 30 82, 36 88, 44 90 C 38 96, 34 104, 36 112 C 30 108, 26 100, 28 100 Z" stroke-width="1" opacity="0.85" />
    <path d="M24 150 C 16 146, 12 138, 16 130 C 22 136, 28 140, 36 140 C 30 144, 26 148, 24 150 Z" stroke-width="0.9" opacity="0.8" />
    <path d="M28 200 C 20 208, 18 218, 24 226 C 30 218, 36 212, 44 210 C 38 204, 34 196, 36 188 C 30 192, 26 200, 28 200 Z" stroke-width="1" opacity="0.85" />
    <!-- Right side flourish (mirror) -->
    <path d="M212 100 C 220 92, 222 82, 216 74 C 210 82, 204 88, 196 90 C 202 96, 206 104, 204 112 C 210 108, 214 100, 212 100 Z" stroke-width="1" opacity="0.85" />
    <path d="M216 150 C 224 146, 228 138, 224 130 C 218 136, 212 140, 204 140 C 210 144, 214 148, 216 150 Z" stroke-width="0.9" opacity="0.8" />
    <path d="M212 200 C 220 208, 222 218, 216 226 C 210 218, 204 212, 196 210 C 202 204, 206 196, 204 188 C 210 192, 214 200, 212 200 Z" stroke-width="1" opacity="0.85" />
    <!-- Inner decorative dots -->
    <circle cx="120" cy="42" r="2" fill="currentColor" stroke="none" />
    <circle cx="120" cy="258" r="2" fill="currentColor" stroke="none" />
    <circle cx="50" cy="100" r="1.5" fill="currentColor" stroke="none" opacity="0.7" />
    <circle cx="190" cy="100" r="1.5" fill="currentColor" stroke="none" opacity="0.7" />
    <circle cx="50" cy="200" r="1.5" fill="currentColor" stroke="none" opacity="0.7" />
    <circle cx="190" cy="200" r="1.5" fill="currentColor" stroke="none" opacity="0.7" />
    <!-- Top inner scrollwork -->
    <path d="M70 70 C 60 62, 62 52, 72 50 C 66 58, 70 66, 80 64" stroke-width="0.7" opacity="0.7" />
    <path d="M170 70 C 180 62, 178 52, 168 50 C 174 58, 170 66, 160 64" stroke-width="0.7" opacity="0.7" />
    <!-- Bottom inner scrollwork -->
    <path d="M70 230 C 60 238, 62 248, 72 250 C 66 242, 70 234, 80 236" stroke-width="0.7" opacity="0.7" />
    <path d="M170 230 C 180 238, 178 248, 168 250 C 174 242, 170 234, 160 236" stroke-width="0.7" opacity="0.7" />
  </g>`

/** Letter layer: F and G intertwined in ornate serif. */
export const MONOGRAM_LETTERS = `
  <g fill="currentColor">
    <!-- F (behind, slightly offset) -->
    <path d="M78 225 Q77 225 77 223.5 Q77 222 78 222 Q88 222 92.5 220.5 Q97 219 98.5 215 Q100 211 100 203 L100 92 Q100 84 98.5 80 Q97 76 92.5 74.5 Q88 73 79 73 Q78 73 78 71.5 Q78 70 79 70 L145 70 Q147 70 147 72 L147.5 105 Q147.5 106 146 106.1 Q144.5 106.2 144 105 Q141 90 132 83 Q123 76 109 76 L99 76 Q89 76 86 79.5 Q83 83 83 91 L83 202 Q83 210 85.5 214 Q88 218 94.5 219.5 Q101 221 114 221 Q115 221 115 222.5 Q115 224 114 225 Q105 225 95 224.8 Q85 224.6 78 225 Z M135 165 Q135 154 128 148 Q121 142 107 142 L89 142 L89 135 L108 135 Q122 135 128 130 Q134 125 134 116 Q134 115 135.5 115 Q137 115 137 116 Q137 124 136.8 128.5 Q136.6 133 136.6 138 Q136.6 144 136.8 149.5 Q137 155 137 165 Q137 166 135.5 166 Q134 166 135 165 Z" opacity="0.92" />
    <!-- G (front, with halo cutout) -->
    <path d="M145 250 Q120 250 102 242 Q84 234 73 219 Q62 204 58 185 Q54 166 58 148 Q62 128 74 114 Q86 100 103 93 Q120 86 140 86 Q152 86 163 88 Q174 90 182 95 Q184 96 184.5 97 Q185 98 185.5 102 L188 135 Q188 136 186.5 136.3 Q185 136.6 184.5 135 Q182 128 178 120 Q174 112 166 106 Q158 100 148 97 Q138 94 127 94 Q112 94 99 102 Q86 110 78 124 Q70 138 70 158 Q70 175 75 189 Q80 203 90 213 Q100 223 113 228 Q126 233 142 233 Q152 233 158 230 Q164 227 166.5 220 Q169 213 169 201 Q169 190 165 184 Q161 178 153 176 Q145 174 132 174 L125 174 Q124 174 124 172.5 Q124 171 125 171 L170 171 Q171 171 171 172.5 Q171 174 170 174 L168 174 Q168 184 170 190 Q172 196 177 199 Q182 202 189 202 Q190 202 190 203.5 Q190 205 189 205 Q182 205 176 203 Q170 201 165 197 Q160 193 157 187 Q154 181 153 174 L153 174 Q153 174 153.5 174 Q154 174 154 174 L154 185 Q154 196 152 204 Q150 212 145 218 Q140 224 131 227 Q122 230 110 230 Q100 230 92 226 Q84 222 78 215 Q72 208 69 199 Q66 190 66 180 L66 160 Q66 145 72 133 Q78 121 89 113 Q100 105 114 101 Q128 97 145 97 L145 97 Z" opacity="0.96" />
    <!-- Small ornamental divider between letters -->
    <path d="M120 118 C 116 122, 116 126, 120 130 C 124 126, 124 122, 120 118 Z" opacity="0.7" />
    <circle cx="120" cy="124" r="1.2" opacity="0.5" />
  </g>`
