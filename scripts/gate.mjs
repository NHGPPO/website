// The gate: runs after `astro build` and fails the build if any rule is broken.
// Rules from the NHGPPO spec: R2 no NHS identity, R3 no placeholder text, R4 no secrets,
// R5 WCAG 2.2 AA (axe), R6 same URLs, R8 security headers, plus the design's checks.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const failures = [];
const fail = (rule, msg) => failures.push(`${rule}: ${msg}`);

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

if (!existsSync(dist)) { console.error('No dist folder: run astro build first.'); process.exit(1); }
const files = walk(dist);
const html = files.filter((f) => f.endsWith('.html'));
const pageOf = (f) => '/' + relative(dist, f).replace(/index\.html$/, '').replace(/\.html$/, '/');

// R6: the existing URLs, plus the two new pages, all exist.
const required = ['/', '/about-us/', '/services/', '/the-team/', '/mission/', '/contact/', '/accessibility/', '/privacy-notice/'];
const pages = new Set(html.map(pageOf));
for (const r of required) if (!pages.has(r)) fail('R6', `missing page ${r}`);

// Source and output text checks.
const srcFiles = walk(join(root, 'src')).concat(walk(join(root, 'public')).filter((f) => /\.(js|svg|txt)$/.test(f)));
const textFiles = html.concat(srcFiles);
for (const f of textFiles) {
  const t = readFileSync(f, 'utf8');
  const where = relative(root, f);
  // R3: placeholder text.
  if (/lorem ipsum|\bTODO\b|\bTBC\b|\bTBD\b|\[(date|number)\]/i.test(t)) fail('R3', `placeholder text in ${where}`);
  // UK style: no em-dashes or en-dashes in content.
  if (/[–—]/.test(t) || /&(mdash|ndash);/.test(t)) fail('Style', `em-dash or en-dash in ${where}`);
  // R2: no NHS identity (logo or NHS blue). Mentions of NHS 111 and nhs.net addresses are fine.
  if (/#005EB8/i.test(t) || /nhs[-_ ]?logo/i.test(t)) fail('R2', `NHS identity in ${where}`);
  // R4: obvious secrets.
  if (/(sk_live_|ghp_[A-Za-z0-9]{20}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|SANITY_[A-Z_]*TOKEN\s*=\s*\S)/.test(t)) fail('R4', `possible secret in ${where}`);
}

// Per-page HTML checks.
for (const f of html) {
  const page = pageOf(f);
  const dom = new JSDOM(readFileSync(f, 'utf8'));
  const doc = dom.window.document;
  // Viewport must allow zoom.
  const vp = doc.querySelector('meta[name=viewport]')?.getAttribute('content') ?? '';
  if (/maximum-scale|user-scalable\s*=\s*(0|no)/i.test(vp)) fail('R5', `${page} blocks zoom`);
  if (doc.documentElement.lang !== 'en-GB') fail('R5', `${page} lang is not en-GB`);
  if (!doc.querySelector('title')?.textContent.trim()) fail('R5', `${page} has no title`);
  if (doc.querySelectorAll('h1').length !== 1) fail('R5', `${page} needs exactly one h1`);
  for (const img of doc.querySelectorAll('img')) if (!img.hasAttribute('alt')) fail('R5', `${page} image without alt`);
  // Internal links and anchors resolve.
  for (const a of doc.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href');
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const [path, hash] = href.split('#');
    if (path && !pages.has(path) && !existsSync(join(dist, path))) fail('Links', `${page} links to missing ${href}`);
    if (hash) {
      const target = path ? html.find((h) => pageOf(h) === path) : f;
      if (target && !new JSDOM(readFileSync(target, 'utf8')).window.document.getElementById(hash)) fail('Links', `${page} links to missing anchor ${href}`);
    }
  }
}

// R5: axe accessibility rules on every page (colour contrast needs a real browser; checked separately).
const axeSource = readFileSync(join(root, 'node_modules/axe-core/axe.min.js'), 'utf8');
for (const f of html) {
  const page = pageOf(f);
  const vc = new VirtualConsole();
  const dom = new JSDOM(readFileSync(f, 'utf8'), { runScripts: 'outside-only', virtualConsole: vc, pretendToBeVisual: true });
  dom.window.eval(axeSource);
  const res = await dom.window.axe.run(dom.window.document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    rules: { 'color-contrast': { enabled: false } },
  });
  for (const v of res.violations) fail('R5', `${page} axe ${v.id}: ${v.help} (${v.nodes.length})`);
  dom.window.close();
}

// R8: security headers are configured.
const toml = readFileSync(join(root, 'netlify.toml'), 'utf8');
for (const h of ['Strict-Transport-Security', 'X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy', 'Content-Security-Policy']) {
  if (!toml.includes(h)) fail('R8', `netlify.toml is missing ${h}`);
}

if (failures.length) {
  console.error(`\nGate failed (${failures.length}):\n- ` + failures.join('\n- '));
  process.exit(1);
}
console.log(`Gate passed: ${html.length} pages checked.`);
