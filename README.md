# bhargavsanketi.github.io

Static site served by GitHub Pages from the root of `master`.

- Edit papers, preprints, and figures in `data/site.json`.
- Rebuild with `node tools/build.js`. It writes `index.html`, `papers.html`, and `404.html`.
- Regenerate the social card with `node tools/og.js` (needs Playwright).
- Commit the built HTML. There is no build step on GitHub.
