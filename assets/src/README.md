# Coffee Cave README artwork

`build.cjs` is the editable source of truth for the compositions, strings, sizes, colors, and SVG glyph layout. It writes the three full-size SVG sources here, PNG exports to `../`, and the standalone favicon to both directories. No generated raster art is used; see `prompts.md`.

## Rebuild

From the worktree root, using Node.js 22 or newer and npm:

```sh
npm ci --prefix assets/src --cache /tmp/coffee-cave-npm-cache --no-audit --no-fund
node assets/src/build.cjs
```

The lockfile pins the renderer and font layout dependencies. The fonts are bundled so rebuilding does not depend on fonts installed on the computer. The generated SVGs contain outlined glyphs with the original strings in `aria-label` attributes; edit strings in the script and rebuild. All geometry, including device silhouettes, remains SVG.

## Outputs and review

- `../icon-1024.png`: 1024 × 1024, with `icon-1024.svg` source.
- `../favicon.svg`: simplified 16 × 16 viewBox with its source copy here.
- `../hero.png`: 1800 × 900, with `hero.svg` source.
- `../how-it-works.png`: 1800 × 700, with `how-it-works.svg` source.
- `previews/`: hero/workflow at 900 and 390 px wide; icon at 32 and 16 px; favicon rasterized at 16 px.

The images and all previews were inspected with `view_image`. Item text and workflow captions were enlarged after the first phone-width review. Only the specified product strings appear in the artwork. The hero deliberately shows the supplied Tree Nuts example rather than an exhaustive allergen list.

## Fonts

Bundled under their SIL Open Font Licenses, included alongside the font files:

- Instrument Sans: https://github.com/google/fonts/tree/main/ofl/instrumentsans — variable font rendered at weight 550, width 100.
- IBM Plex Mono: https://github.com/google/fonts/tree/main/ofl/ibmplexmono — Regular.

Font binaries and dependency lockfile are retained to make future rebuilds consistent.
