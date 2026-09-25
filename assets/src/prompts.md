# Image-generation prompt log

No image-generation model was used. No prompts were submitted, and there are no raw generated raster drawings.

All three images are deterministic SVG compositions made by `build.cjs`, including the simple cup, device silhouettes, text, marks, and arrows. This keeps the icon clean at 16 px and makes every product value editable without regenerating artwork. The PNGs are raster exports of these SVGs.

## Design brief used by the composition script

- Icon: 1024 × 1024. A solid cream coffee cup under a single copper cave-mouth arch on dark roast. No text, steam, saucer, gradients, or glow. A separately simplified 16 px SVG favicon.
- Hero: 1800 × 900. Counter tablet on the left, kitchen display on the right, one copper arrow between them. Order Recap; Table 2; Flat White ×1 €3.75; Almond Croissant ×1 €3.50. Kitchen toggle: Prep (2) selected, Serve (0) inactive. One Table 2 ticket with the same items and a gold Tree Nuts tag attached to the croissant. Only Counter and Kitchen outside the devices.
- Workflow: 1800 × 700. Five boxes in one left-to-right chain: Counter tablet → Coffee Cave server → Postgres → Zero sync → Kitchen screen. Captions: shows it at once; checks role and café; one database; streams changes; updates live. Zero sync has the copper border.
- Colors: background #211410; device bezels #151513; cards #2B1B14; accents/arrows #C08960; allergen tag #E8B33C; text #F7EDE6.
- Typography: Instrument Sans for labels; IBM Plex Mono for table and ticket text. Font glyphs are SVG paths; no image model renders text.
