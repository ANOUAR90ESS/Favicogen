# Favicogen — Logo & Favicon Studio

A browser-based studio for designing a logo once and exporting every asset a
product needs from it: favicon packages (SVG, PNG, ICO, WebP, JPG), PWA and
Apple touch icons, Google Play feature graphics, YouTube channel art, and
social media kits. Everything renders client-side from a single vector source.

Bilingual (English / Arabic) with full RTL support.

## Getting started

```bash
bun install      # or: npm install
bun run dev      # http://localhost:3000
```

The dev server runs Express with Vite in middleware mode, so the API and the
app share one origin.

## Scripts

| Command | What it does |
| --- | --- |
| `bun run dev` | Dev server with HMR |
| `bun run build` | Production client build plus a bundled server |
| `bun run start` | Serve the production build |
| `bun run typecheck` | `tsc --noEmit` (strict) |
| `bun run lint` | ESLint |
| `bun run test` | Vitest |
| `bun run test:coverage` | Vitest with coverage |
| `bun run check:i18n` | Fail if a `t()` key is undefined or the locales have drifted |
| `bun run verify` | Everything CI runs |

## Environment

Copy `.env.example` to `.env`. Every variable is optional.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Listening port. Cloud hosts usually set this. |
| `HOST` | `0.0.0.0` | Bind address. |
| `NODE_ENV` | `development` | `production` enables static serving and the CSP. |
| `GEMINI_API_KEY` | — | Enables the AI logo generator. The app runs fine without it. |
| `ALLOWED_ORIGINS` | — | Comma-separated origins allowed to call `/api/*`. Blank means same-origin only. |

## How it is put together

```
src/
  components/     UI. Every dialog goes through components/Modal.tsx.
  utils/
    canvasRenderer.ts   Builds the SVG for a config; all exports start here.
    fontEmbedder.ts     Inlines web fonts into exported SVG.
    svgSanitizer.ts     Allow-list filter for user-supplied SVG.
    configSchema.ts     Validates untrusted project JSON.
    storage.ts / idb.ts Projects, in IndexedDB.
    imageIntake.ts      The one gate for uploaded images.
  i18n/locales/   All UI strings. Nothing user-facing belongs in a component.
public/legal/     Privacy policy and terms — the single source, served and
                  imported into the in-app viewer at build time.
```

A few decisions worth knowing before changing things:

- **Exports embed their fonts.** An SVG loaded through `<img>` renders in an
  isolated document that cannot fetch Google Fonts, so text would silently
  fall back to a system face. `rasterizeSvg` is the choke point that inlines
  them; keep new export paths going through it.
- **Every generated SVG id is namespaced per render.** Two SVGs from one
  config in the same document would otherwise share gradient and clip-path
  ids, and the browser resolves `url(#id)` against the first match.
- **Anything that reaches the DOM as markup is sanitized first.** Uploaded SVG
  and imported project JSON are attacker input; `svgSanitizer` and
  `configSchema` are the boundary.
- **Projects live in IndexedDB, not localStorage.** Base64 images blow past
  the 5MB origin cap, and a failed write must be surfaced, never swallowed.
- **UI strings live in `src/i18n/locales/`.** A lint rule flags Arabic string
  literals in components to keep them from creeping back.

## Testing

```bash
bun run test
```

Coverage focuses on the parts where a regression is silent or unsafe: the ICO
binary writer, the SVG generator's escaping and id uniqueness, the sanitizer's
payload handling, the config validator, and unit conversion.

## License

See `public/legal/TERMS_OF_SERVICE.md`.
