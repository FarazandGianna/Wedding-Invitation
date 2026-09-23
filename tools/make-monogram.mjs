/**
 * FG monogram generator — ONE canonical asset used everywhere.
 *
 * Extracts true Cormorant Garamond (wght 600) vector outlines for F and G,
 * composes the interlocked monogram inside an ornate symmetric cartouche
 * frame (modeled on the couple's reference invitation), and emits:
 *
 *   - src/components/monogramData.ts   (shared path data for the React component)
 *   - public/favicon.svg               (browser tab icon)
 *   - public/apple-touch-icon.png      (180x180 iOS)
 *   - public/icon-192.png / icon-512.png (PWA / android-chrome)
 *   - public/og-image.png              (1200x630 social share fallback)
 *
 * Usage: node tools/make-monogram.mjs
 * The Cormorant Garamond variable TTF is not committed (1.2 MB, OFL) — set
 * FONT_PATH to its location, defaulting to .local/CormorantGaramond.ttf.
 *
 * The monogram is ALWAYS "FG": F sits behind on the left, G in front on the
 * right, woven like the engraved reference (front letter carries a halo).
 * All positions derive from real glyph metrics — no eyeballed paths.
 */
import fs from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const fontkit = require('fontkit')

const WINE = '#360b14'
const GOLD = '#c9a877'

const font = fontkit.openSync(process.env.FONT_PATH || '.local/CormorantGaramond.ttf')
const instanced = typeof font.getVariation === 'function' ? font.getVariation({ wght: 600 }) : font
const capHeight = instanced.capHeight

function glyphPath(ch) {
  const glyph = instanced.glyphsForString(ch)[0]
  if (!glyph) throw new Error(`no glyph for ${ch}`)
  return { path: glyph.path, bbox: glyph.bbox }
}

const r2 = (n) => Math.round(n * 100) / 100

function transformPath(p, { scale, baselineY, dx }) {
  const t = p.transform(scale, 0, 0, -scale, dx, baselineY)
  return t.toSVG().replace(/\s+/g, ' ').trim()
}

// ---------------------------------------------------------------------------
// 1) Compose the letters inside the monogram's inner box (220 x 280 canvas)
// ---------------------------------------------------------------------------
const CANVAS = { w: 220, h: 280 }

const F = glyphPath('F')
const G = glyphPath('G')

const capPx = 128
const scale = capPx / capHeight

// F sits higher/left, G lower/right — arms weave through each other.
const fBaseline = 186
const gBaseline = 210
const fWidth = (F.bbox.maxX - F.bbox.minX) * scale
const gWidth = (G.bbox.maxX - G.bbox.minX) * scale
const cx = CANVAS.w / 2
const fDx = cx - fWidth * 0.72 - F.bbox.minX * scale
const gDx = cx - gWidth * 0.34 - G.bbox.minX * scale

const fPathD = transformPath(F.path, { scale, baselineY: fBaseline, dx: fDx })
const gPathD = transformPath(G.path, { scale, baselineY: gBaseline, dx: gDx })

// ---------------------------------------------------------------------------
// 2) Ornate symmetric cartouche frame (pure geometry, mirrored L/R)
// ---------------------------------------------------------------------------
const frameSvg = (stroke = 'currentColor', sw = 1.1) => `
      <g stroke="${stroke}" strokeWidth="${sw}" strokeLinecap="round" fill="none">
        <ellipse cx="110" cy="140" rx="76" ry="104" />
        <ellipse cx="110" cy="140" rx="70" ry="98" strokeWidth="0.5" opacity="0.75" />
        <path d="M38 96 C 26 84, 30 66, 46 62 C 38 74, 44 84, 56 84 C 50 90, 44 94, 38 96 Z" strokeWidth="0.9" />
        <path d="M182 96 C 194 84, 190 66, 174 62 C 182 74, 176 84, 164 84 C 170 90, 176 94, 182 96 Z" strokeWidth="0.9" />
        <path d="M38 184 C 26 196, 30 214, 46 218 C 38 206, 44 196, 56 196 C 50 190, 44 186, 38 184 Z" strokeWidth="0.9" />
        <path d="M182 184 C 194 196, 190 214, 174 218 C 182 206, 176 196, 164 196 C 170 190, 176 186, 182 184 Z" strokeWidth="0.9" />
        <path d="M32 140 C 24 132, 24 122, 33 118 M33 118 C 30 125, 33 131, 40 130" strokeWidth="0.8" opacity="0.85" />
        <path d="M188 140 C 196 132, 196 122, 187 118 M187 118 C 190 125, 187 131, 180 130" strokeWidth="0.8" opacity="0.85" />
        <path d="M32 140 C 24 148, 24 158, 33 162 M33 162 C 30 155, 33 149, 40 150" strokeWidth="0.8" opacity="0.85" />
        <path d="M188 140 C 196 148, 196 158, 187 162 M187 162 C 190 155, 187 149, 180 150" strokeWidth="0.8" opacity="0.85" />
      </g>
      <g fill="currentColor">
        <path d="M110 28 C 104 36, 104 42, 110 48 C 116 42, 116 36, 110 28 Z" />
        <circle cx="110" cy="54" r="1.6" />
        <path d="M110 252 C 104 244, 104 238, 110 232 C 116 238, 116 244, 110 252 Z" />
        <circle cx="110" cy="226" r="1.6" />
      </g>`

// ---------------------------------------------------------------------------
// 3) The letters as an SVG fragment (shared by component + rasterizer)
// ---------------------------------------------------------------------------
const monogramInner = (opts = {}) => {
  const { halo = WINE, haloWidth = 7 } = opts
  return `
      <g fill="none">
        <path d="${fPathD}" fill="currentColor" />
        <path
          d="${gPathD}"
          fill="currentColor"
          stroke="var(--monogram-halo, ${halo})"
          strokeWidth="${haloWidth}"
          strokeLinejoin="round"
          paintOrder="stroke"
        />
      </g>`
}

// Normalize the JSX-ish fragments to plain SVG: kebab-case attributes, no
// {/* */} comments. Required for raw SVG (resvg, innerHTML, validators).
const kebab = (s) =>
  s
    .replace(/\{\/\*[\s\S]*?\*\/\s*/g, '')
    .replace(/strokeWidth/g, 'stroke-width')
    .replace(/strokeLinecap/g, 'stroke-linecap')
    .replace(/strokeLinejoin/g, 'stroke-linejoin')
    .replace(/paintOrder/g, 'paint-order')

// ---------------------------------------------------------------------------
// 4) Emit src/components/monogramData.ts (the single shared source)
// ---------------------------------------------------------------------------
const ts = `/**
 * AUTO-GENERATED by .local/make-monogram.mjs — do not edit by hand.
 *
 * The ONE canonical Faraz & Gianna (FG) monogram: real Cormorant Garamond
 * letterform outlines (wght 600) inside an ornate symmetric cartouche.
 * Consumed by <FgMonogram /> for every brand surface — envelope, seal, hero,
 * footer, watermark, opening animation — and rasterized into favicon.svg,
 * apple-touch-icon, PWA icons and og-image.png by the same generator.
 */
export const MONOGRAM_VIEWBOX = { w: ${CANVAS.w}, h: ${CANVAS.h} } as const

/** Ornate symmetric cartouche frame; strokes use currentColor. */
export const MONOGRAM_FRAME = ${JSON.stringify(kebab(frameSvg()))}

/** Letter layer: F behind, G in front with a page-colored weaving halo. */
export const MONOGRAM_LETTERS = ${JSON.stringify(kebab(monogramInner()))}
`
fs.mkdirSync('src/components', { recursive: true })
fs.writeFileSync('src/components/monogramData.ts', ts)

// ---------------------------------------------------------------------------
// 5) Standalone SVGs: favicon (wine tile) + large preview
// ---------------------------------------------------------------------------
const standalone = ({ tile = WINE, halo = WINE }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS.w} ${CANVAS.h}">` +
  `<rect width="${CANVAS.w}" height="${CANVAS.h}" fill="${tile}"/>` +
  `<g color="${GOLD}">` +
  kebab(frameSvg('currentColor')) +
  kebab(monogramInner({ halo })) +
  `</g></svg>`

fs.writeFileSync('public/favicon.svg', standalone({ tile: WINE, halo: WINE }))

// ---------------------------------------------------------------------------
// 6) Raster assets via @resvg/resvg-js
// ---------------------------------------------------------------------------
const { Resvg } = require('@resvg/resvg-js')

async function renderPng(svgString, width, outPath, background) {
  const opts = {
    fitTo: { mode: 'width', value: width },
    font: { loadSystemFonts: false }
  }
  if (background) opts.background = background
  const resvg = new Resvg(svgString, opts)
  const png = resvg.render().asPng()
  fs.writeFileSync(outPath, png)
  console.log(`${outPath}: ${(png.length / 1024).toFixed(1)} kB @ ${width}px`)
}

const faviconSvg = fs.readFileSync('public/favicon.svg', 'utf8')

await renderPng(faviconSvg, 180, 'public/apple-touch-icon.png', WINE)
await renderPng(faviconSvg, 192, 'public/icon-192.png', WINE)
await renderPng(faviconSvg, 512, 'public/icon-512.png', WINE)

// og-image: monogram left, names right, wine field — one brand asset.
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${WINE}"/>
  <rect x="24" y="24" width="1152" height="582" fill="none" stroke="${GOLD}" stroke-opacity="0.45" stroke-width="1.5"/>
  <rect x="36" y="36" width="1130" height="558" fill="none" stroke="${GOLD}" stroke-opacity="0.25" stroke-width="0.75"/>
  <g color="${GOLD}" transform="translate(80 115) scale(1.45)">
    ${kebab(frameSvg('currentColor'))}
    ${kebab(monogramInner({ halo: WINE }))}
  </g>
  <g text-anchor="middle" fill="#f0e2d0" font-family="Georgia, 'Times New Roman', serif">
    <text x="640" y="268" font-size="34" letter-spacing="10" fill="${GOLD}">THE WEDDING OF</text>
    <text x="640" y="352" font-size="84" letter-spacing="4">FARAZ &amp; GIANNA</text>
    <path d="M560 392 H720" stroke="${GOLD}" stroke-width="1"/>
    <text x="640" y="446" font-size="30" letter-spacing="6" fill="${GOLD}" opacity="0.9">YOU ARE CORDIALLY INVITED</text>
  </g>
</svg>`
fs.writeFileSync('public/og-image.png', Buffer.from(new Resvg(ogSvg, { fitTo: { mode: 'width', value: 1200 }, font: { loadSystemFonts: false } }).render().asPng()))
console.log('public/og-image.png written')

console.log('\nFG monogram generated. F(dx=%s, baseline=%s) G(dx=%s, baseline=%s), cap=%spx', r2(fDx), fBaseline, r2(gDx), gBaseline, capPx)
