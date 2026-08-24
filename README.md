# Favicogen — Logo & Favicon Studio

A browser-based studio for designing a logo once and exporting every asset a
product needs from it: favicon packages (SVG, PNG, ICO, WebP, JPG), PWA and
Apple touch icons, Google Play feature graphics, YouTube channel art, and
social media kits. Everything renders client-side from a single vector source.

Bilingual (English / Arabic) with full RTL support.

## AI logo generation — supported, and optional

The AI generator (prompt, plus an optional reference image, via Google Gemini)
is **a supported feature**. Set `GEMINI_API_KEY` to enable it; leave it unset
and the button reports the key is missing while everything else works
normally. Nothing else in the app depends on it.

This is worth stating plainly because commit `bbbf3ae` is titled
"refactor: remove the AI features" and that removal never happened — the
modal, both endpoints and the `@google/genai` dependency all stayed wired up.
The title is misleading; the feature is live. Its endpoints are rate-limited
per IP (5/minute, 30/hour) and covered by the privacy policy's "Optional AI
Features" section, which discloses that prompts and any attached reference
image are sent to Google.

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
- **An uploaded picture usually arrives with its background painted in.**
  Auto-trim only crops empty margins, which does nothing when the flat field
  reaches all four edges — and it then rides along into every export as a
  white box behind the logo. `backgroundRemover.ts` takes the colour out
  instead. Two rules keep it from destroying artwork: it only clears what is
  connected to the border, so a light glyph *inside* a badge survives; and it
  refuses outright when the border is not one colour, because guessing a
  background on a photo would eat the subject. The pixel algorithm is
  DOM-free precisely so it can be tested, and it is.
- **A phone held sideways is its own layout.** Width does not tell you how
  much vertical room there is: a 740×360 landscape phone is wider than a
  390×844 portrait one and has half the height. So the workspace splits on
  `max-md:landscape:` (side by side, never a stacked column that has nowhere
  to go), and anything that only earns its place when there is height —
  a button's text label, the size-comparison strip, the canvas's generous
  padding — is opted **in** with the `tall:` variant from `index.css`. Opting
  in rather than out keeps the base `hidden`/`p-3` as the fallback, so no rule
  has to out-order another. Dialogs cap at `max-h-full`, not `max-h-[92vh]`:
  92vh plus the overlay's own padding is taller than the screen once the
  screen is short.
- **Interface text lives in `src/i18n/locales/`, and that is enforced.** An
  Arabic string literal or JSX text node inside `src/components/` is an
  ESLint *error*, not a warning. Two exemptions are deliberate and
  documented in `eslint.config.js`: `ErrorBoundary`, whose fallback must
  render when i18n itself may be what broke, and the language toggle's own
  "عربي" label, since a language's name belongs in that language.
  `src/utils/` data modules are exempt too — they hold both languages side
  by side as `nameAr`/`nameEn` pairs, which is the right shape for data.
  `check:i18n` also fails on a key written as a bare string with the `t()`
  left off — the whole AI dialog once shipped that way, printing
  `aiGeneratorModal.…` at the user, and a check that only looks inside `t()`
  can never see it. Keys legitimately held as data are the exception, and
  are recognised by their shape: a `…Key` property or a `…KEYS` list.
- **Design content is not interface text** — with one deliberate exception.
  The template previews are Arabic on purpose: they are artwork, not chrome.
  The *opening* sample design is the exception; its brand name and tagline
  follow the interface language, because a first-run sample is closer to a
  welcome screen than to the user's work. The swap only ever applies while
  the text still matches a sample in some language — the moment someone types
  their own name, switching language leaves it alone. `sampleCopy.test.ts`
  guards that rule.
- **The AI feature is opt-in at runtime, not compile time.** It ships in the
  bundle and activates when `GEMINI_API_KEY` is present. If you do decide to
  remove it, four things go together: `AILogoGeneratorModal`, both
  `/api/ai/*` routes, the `@google/genai` dependency, and the privacy
  policy's AI section.

## Testing

```bash
bun run test
```

Coverage focuses on the parts where a regression is silent or unsafe: the ICO
binary writer, the SVG generator's escaping and id uniqueness, the sanitizer's
payload handling, the config validator, and unit conversion.

## License

See `public/legal/TERMS_OF_SERVICE.md`.
