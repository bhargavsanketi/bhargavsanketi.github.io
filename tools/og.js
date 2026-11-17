#!/usr/bin/env node
// Renders assets/img/og.png, a plain black card with the name in Newsreader.
// Needs Playwright with Chromium. Usage: node tools/og.js
'use strict';
const path = require('path');
const { chromium } = require('playwright');
const root = path.join(__dirname, '..');
const font = 'file://' + path.join(root, 'assets/fonts/newsreader-opsz.woff2');
const html = `<!doctype html><style>
@font-face{font-family:N;src:url("${font}") format("woff2");font-weight:200 800}
html,body{margin:0;background:#08090b}
.c{width:1200px;height:630px;box-sizing:border-box;padding:0 96px 104px;display:flex;align-items:flex-end}
h1{margin:0;font:380 112px/1 N;font-variation-settings:"opsz" 72;letter-spacing:-0.02em;color:#f2f0ec}
</style><div class="c"><h1>Bhargav D Sanketi</h1></div>`;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(html);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(root, 'assets/img/og.png') });
  await b.close();
  console.log('Wrote assets/img/og.png');
})();
