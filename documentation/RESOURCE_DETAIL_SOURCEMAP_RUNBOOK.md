# ResourceDetail sourcemap runbook

Date: 2026-04-02

## Production sourcemaps
`frontend/vite.config.ts` now enables production sourcemaps with `build.sourcemap = true`, so every `dist/assets/index-*.js` bundle will emit an adjacent `.map` file.

## Stack-frame mapping for `index-DBTmCftW.js`
Use:

```bash
cd frontend
npm run build
npm run map:stackframes -- index-DBTmCftW.js wd,Q6,H6
```

The mapper script (`frontend/scripts/map-stackframes.mjs`) resolves generated symbol locations in the minified bundle, then uses the sourcemap to print original `source:line:column` for each symbol.

## Notes
- If `index-DBTmCftW.js` is not present in `dist/assets`, the script falls back to the current `index-*.js` bundle.
- For crash reports, pass the exact bundle filename from the stack trace for precise symbol mapping.
