#!/usr/bin/env node
// Renders index.html, papers.html and 404.html from data/site.json.
// Usage: node tools/build.js
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'site.json'), 'utf8'));

const SITE = 'https://bhargavsanketi.github.io';
const NAME = 'Bhargav D Sanketi';
const ME = 'Sanketi';
const LINKEDIN = 'https://www.linkedin.com/in/bhargavdsanketi';
const X = 'https://twitter.com/BSanketi';
const EMAIL = 'bhargav.d.sanketi@gmail.com';

const crypto = require('crypto');
// Content hash query string, so a changed file gets a new URL and skips stale caches.
const v = (rel) => `/${rel}?v=${crypto.createHash('sha1').update(fs.readFileSync(path.join(root, rel))).digest('hex').slice(0, 8)}`;

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Every character as a numeric entity. Still a working link with scripts off.
const entities = (s) => [...s].map((c) => `&#${c.codePointAt(0)};`).join('');

// First three authors, extended to include the site owner, then et al.
function authors(list) {
  const mine = list.indexOf(ME);
  const n = Math.max(3, mine + 1);
  const shown = list.slice(0, n).map((a) => (a === ME ? `<strong>${esc(a)}</strong>` : esc(a)));
  return list.length > n ? `${shown.join(', ')}, et al.` : shown.join(', ');
}

function cite(p) {
  const doi = p.doi
    ? ` <a class="cite__doi" href="https://doi.org/${esc(p.doi)}">doi:${esc(p.doi)}</a>`
    : '';
  return `<li>
            <span class="cite__title">${esc(p.title)}</span>
            <span class="cite__meta">${authors(p.authors).replace(/\.$/, '')}. <span class="cite__venue">${esc(p.venue)}</span>, <span class="tnum">${p.year}</span>.${doi}</span>
          </li>`;
}

function chapterPapers(chapter) {
  const papers = data.publications
    .filter((p) => p.chapter === chapter)
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const prep = data.inPreparation.filter((p) => p.chapter === chapter);
  let out = '';
  if (papers.length) {
    out += `
      <div class="papers reveal">
        <h3 class="papers__head">Papers and preprints</h3>
        <ol class="cites">
          ${papers.map(cite).join('\n          ')}
        </ol>
      </div>`;
  }
  if (prep.length) {
    out += `
      <div class="papers reveal">
        <h3 class="papers__head">In preparation</h3>
        <ul class="cites cites--prep">
          ${prep.map((p) => `<li><span class="cite__title">${esc(p.title)}</span></li>`).join('\n          ')}
        </ul>
      </div>`;
  }
  return out;
}

function figure(m) {
  const caption = `<figcaption>${esc(m.caption)} <span class="figure__credit">${esc(m.credit)}</span></figcaption>`;
  if (m.type === 'video') {
    return `
      <figure class="figure reveal">
        <div class="figure__frame">
          <video class="js-loop" muted loop playsinline preload="metadata" poster="${v(m.poster)}" width="${m.width}" height="${m.height}" aria-label="${esc(m.alt)}">
            <source src="${v(m.src)}" type="video/mp4">
          </video>
          <button class="play" type="button" hidden>Play</button>
        </div>
        ${caption}
      </figure>`;
  }
  return `
      <figure class="figure reveal">
        <div class="figure__frame">
          <picture>
            <source type="image/webp" srcset="${v(m.webp)}">
            <img src="${v(m.src)}" width="${m.width}" height="${m.height}" alt="${esc(m.alt)}" loading="lazy" decoding="async">
          </picture>
        </div>
        ${caption}
      </figure>`;
}

const figures = (chapter) => data.media.filter((m) => m.chapter === chapter).map(figure).join('');

const ICONS = {
  email: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="2.75" y="5" width="18.5" height="14" rx="1.5"/><path d="M3.5 6.25 12 12.75l8.5-6.5"/></svg>',
  // LinkedIn and X marks from Simple Icons, which sources each from the company's brand resources.
  linkedin: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true" focusable="false"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true" focusable="false"><path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/></svg>',
};

function head({ title, description, url, jsonld = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">
  <meta name="theme-color" content="#08090b">
  <meta name="color-scheme" content="dark">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${NAME}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${SITE}/assets/img/og.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${NAME}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:creator" content="@BSanketi">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${SITE}/assets/img/og.png">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preload" href="/assets/fonts/newsreader-opsz.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/source-sans-3.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${v('assets/css/site.css')}">
  <script>document.documentElement.classList.add('js')</script>${jsonld}
</head>`;
}

function nav(current) {
  const cur = (k) => (current === k ? ' aria-current="page"' : '');
  return `<a class="skip" href="#main">Skip to content</a>
  <nav class="nav" aria-label="Site">
    <div class="nav__inner">
      <a class="nav__home" href="/"${current === 'home' ? ' aria-current="page"' : ''}>${NAME}</a>
      <ul>
        <li><a href="/#work"${cur('work')}>Work</a></li>
        <li><a href="/papers.html"${cur('papers')}>Papers</a></li>
      </ul>
    </div>
  </nav>`;
}

const SCRIPT = `<script>
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var io = 'IntersectionObserver' in window;
  var items = document.querySelectorAll('.reveal');
  if (!reduce && io) {
    var r = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); r.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { r.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }
  document.querySelectorAll('video.js-loop').forEach(function (v) {
    var btn = v.parentNode.querySelector('.play');
    if (reduce || !io) {
      btn.hidden = false;
      btn.addEventListener('click', function () {
        if (v.paused) { v.play(); btn.textContent = 'Pause'; } else { v.pause(); btn.textContent = 'Play'; }
      });
      return;
    }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () { btn.hidden = false; }); }
        else { v.pause(); }
      });
    }, { threshold: 0.25 }).observe(v);
    btn.addEventListener('click', function () { v.play(); btn.hidden = true; });
  });
})();
</script>`;

// ---------- Home ----------
const personLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: NAME,
  honorificSuffix: 'PhD',
  url: `${SITE}/`,
  image: `${SITE}/assets/img/portrait.jpg`,
  sameAs: [LINKEDIN, X],
  alumniOf: { '@type': 'CollegeOrUniversity', name: 'Cornell University' },
};

const home = `${head({
  title: `${NAME}, PhD`,
  description: 'Bhargav D Sanketi studies tissue state. How tissues build themselves. How they break. How to rewrite them.',
  url: `${SITE}/`,
  jsonld: `\n  <script type="application/ld+json">${JSON.stringify(personLd)}</script>`,
})}
<body>
  ${nav('home')}

  <main id="main" class="wrap">
    <header class="masthead">
      <picture>
        <source type="image/webp" srcset="${v('assets/img/portrait.webp')}">
        <img class="portrait" src="${v('assets/img/portrait.jpg')}" width="480" height="480" alt="Bhargav D Sanketi crouching in a field of orange poppies with his beagle">
      </picture>
      <h1 class="name">Bhargav D <span class="nowrap">Sanketi<span class="name__suffix">, PhD</span></span></h1>
      <p class="tagline">How tissues build themselves. How they break. How to rewrite them.</p>
      <ul class="contact">
        <li><a href="${entities('mailto:' + EMAIL)}" aria-label="Email">${ICONS.email}</a></li>
        <li><a href="${LINKEDIN}" aria-label="LinkedIn" rel="me">${ICONS.linkedin}</a></li>
        <li><a href="${X}" aria-label="X, @BSanketi" rel="me">${ICONS.x}</a></li>
      </ul>
    </header>

    <section id="work" class="opening" aria-label="Overview">
      <div class="prose">
        <p class="lede">I study tissue state.</p>
        <p>Tissues are not fixed by their genes. They move between states to get things done. They build during development. They repair after injury. They drift in disease and age.</p>
        <p>Those shifts run on mechanics, signaling, transcription, metabolism, and chromatin. They set whether a tissue builds itself up or breaks itself down.</p>
        <p>I have spent ten years learning to read those decisions and rewrite them. I read tissue state with single cell and spatial genomics, lineage tracing, and imaging. I rewrite it with protein, gene, and cell based tools.</p>
        <p class="coda">The circuits that build an organ can be redeployed to restore it.</p>
      </div>
    </section>

    <section class="chapter" id="building" aria-labelledby="building-title">
      <div class="reveal">
        <p class="label"><span>Cornell</span><span>2017 to 2023</span></p>
        <h2 class="chapter__title" id="building-title">Building tissues</h2>
      </div>
      <div class="prose reveal">
        <p class="opener">I asked how the gut gets its shape.</p>
        <p>The mammalian intestine loops and layers itself early, and when that goes wrong it causes congenital malformation and metabolic disease. We built tools to measure and move mechanical forces inside a living embryo. We found that rotation starts when local mechanical feedback amplifies the body plan. An organ can begin to build itself from a local source of asymmetry.</p>
        <p>Then we built a single cell atlas of the developing intestine and traced the origin of its fat absorption machinery. Villus myofibroblasts turned out to be the progenitors of gut lymphatic musculature, in the embryo and in the adult.</p>
      </div>
      <p class="pull reveal">Developmental programs are modular. They get reused far beyond the organ that first deploys them.</p>
      ${chapterPapers('building')}
      ${figures('building')}
    </section>

    <section class="chapter" id="breaking" aria-labelledby="breaking-title">
      <div class="reveal">
        <p class="label"><span>Altos Labs</span><span>2023 to 2026</span></p>
        <h2 class="chapter__title" id="breaking-title">Breaking tissues</h2>
      </div>
      <div class="prose reveal">
        <p class="opener">I turned to how tissues fail.</p>
        <p>Across more than forty human age associated diseases, cells near injury drift toward a mesenchymal state. We defined that drift and showed partial reprogramming reverses it.</p>
        <p>Reprogramming rejuvenates cells, but left running it erases their identity and forms tumors. We separated the two. The chromatin activity that rejuvenates can be uncoupled from the identity loss. That makes epigenetic reprogramming safer to pursue as a medicine.</p>
        <p>We also showed that cell identity factors reverse state drift and restore function in aging and diseased muscle and liver in live animals.</p>
      </div>
      <p class="pull reveal">Fibrosis, cancer, and aging are miscued state transitions. The circuitry that builds an organ can be redirected to restore one.</p>
      ${chapterPapers('breaking')}
      ${figures('breaking')}
    </section>

    <section class="chapter" id="enhancing" aria-labelledby="enhancing-title">
      <div class="reveal">
        <p class="label"><span>Co-founder at stealth</span><span>Now</span></p>
        <h2 class="chapter__title" id="enhancing-title">Enhancing tissues</h2>
      </div>
      <p class="pull pull--lead reveal">The secretome is an especially tractable entry point into tissue state, and the one that translates most directly to the clinic.</p>
    </section>

    <section class="closing" aria-labelledby="recognition-title">
      <h2 id="recognition-title">Recognition</h2>
      <ul class="honours reveal">
        <li>Rising Star in Bioengineering, Princeton, <span class="tnum">2023</span></li>
        <li>Altos Above and Beyond Award, <span class="tnum">2024</span></li>
        <li>North American National 3MT Winner, Council of Graduate Schools, <span class="tnum">2022</span></li>
        <li>Birnstiel Award honourable mention, IMP Austria, <span class="tnum">2023</span></li>
        <li>Presidential Life Science Fellowship, Cornell, <span class="tnum">2017</span></li>
      </ul>
      <div class="service reveal">
        <p>Co-chair of the Gordon Research Seminar on Vascular Cell Biology in <span class="tnum">2025</span>.</p>
        <p>Taught and mentored at Cornell and Ithaca College, including through the HHMI CHAMPS program.</p>
      </div>
    </section>
  </main>
  ${SCRIPT}
</body>
</html>
`;

// ---------- Papers ----------
const years = [...new Set(data.publications.map((p) => p.year))].sort((a, b) => b - a);
const papersPage = `${head({
  title: `Papers · ${NAME}`,
  description: 'Peer reviewed papers and preprints by Bhargav D Sanketi. Newest first.',
  url: `${SITE}/papers.html`,
})}
<body>
  ${nav('papers')}

  <main id="main" class="wrap">
    <header class="pubs-head">
      <h1>Papers</h1>
      <p>Peer reviewed papers and preprints. Newest first.</p>
    </header>
    ${years.map((y) => `
    <section class="year-group" aria-label="${y}">
      <p class="year-group__year" aria-hidden="true">${y}</p>
      <ol class="cites">
          ${data.publications.filter((p) => p.year === y).map(cite).join('\n          ')}
      </ol>
    </section>`).join('')}
  </main>
</body>
</html>
`;

// ---------- 404 ----------
const notFound = `${head({
  title: `Not found · ${NAME}`,
  description: 'This page does not exist.',
  url: `${SITE}/404.html`,
})}
<body>
  ${nav('')}

  <main id="main" class="wrap">
    <div class="lost">
      <h1>This page does not exist.</h1>
      <p><a href="/">Go to the home page.</a></p>
    </div>
  </main>
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'index.html'), home);
fs.writeFileSync(path.join(root, 'papers.html'), papersPage);
fs.writeFileSync(path.join(root, '404.html'), notFound);
console.log('Built index.html, papers.html, 404.html');
