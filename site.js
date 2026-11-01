// Everything specific to AirportRNG: names, copy, card art, and which facts the result card shows. app.js is generic.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = (n) => n.toLocaleString('en');
const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; };
const band = (x, cuts) => cuts.find(([max]) => x < max)[1];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const unknown = 'not in the catalog';
const metres = (ft) => fmt(Math.round(ft * 0.3048));
const wikiOk = (u) => typeof u === 'string' && /^https:\/\/en\.wikipedia\.org\/wiki\/[^\s"'<>]+$/.test(u);

export default {
  key: 'airportrng',
  name: 'AirportRNG',
  pageTitle: 'AirportRNG: a daily airport discovery game',
  noun: 'airport', nouns: 'airports', thing: 'Airport',
  worldNote: 'every airport on Earth',
  repo: 'https://github.com/sharkjujg/airportrng',
  headline: 'Discover an airport. Once a day.',
  intro: (n) => `Roll once to draw one airport with scheduled flights from a pool of <b>${fmt(n)}</b>. Every airport has the same 1-in-${fmt(n)} chance, busy hub or grass strip. Badges explain what is unusual about it, and rarer badges earn more rarity points (RP). The daily limit resets at 00:00 UTC.`,
  notice: 'Prototype: the airport facts are real (from OurAirports), but there are no photos or accounts yet, and your results are saved only in this browser. Not for navigation or flight planning. <a href="#/about">What that means</a>',
  header: (m) => ({ title: m.name, sub: `${m.iata}${m.icao ? ` / ${m.icao}` : ''} · ${[m.city, m.country].filter(Boolean).join(', ')}` }),
  label: (m) => `${m.name} (${m.iata})`,
  shelves: (m) => [
    ['Country', m.country], ['Continent', m.continent], ['Size', cap(m.type)],
    ...(m.elevation !== null ? [['Elevation', band(m.elevation, [[0, 'Below sea level'], [500, '0 to 499 ft'], [2000, '500 to 1,999 ft'], [5000, '2,000 to 4,999 ft'], [8000, '5,000 to 7,999 ft'], [Infinity, '8,000 ft or more']])]] : []),
    ...(m.runways ? [['Open runways', m.runways >= 4 ? '4 or more' : String(m.runways)]] : []),
    ...(m.longest ? [['Longest runway', band(m.longest, [[3000, 'Under 3,000 ft'], [6000, '3,000 to 5,999 ft'], [9000, '6,000 to 8,999 ft'], [12000, '9,000 to 11,999 ft'], [Infinity, '12,000 ft or more']])]] : []),
    ...(m.surface ? [['Surface', cap(m.surface)]] : []),
    ['Code starts with', m.iata[0]], ...(m.city ? [['City starts with', m.city.trim()[0].toUpperCase()]] : []),
    ['Hemisphere', m.lat < 0 ? 'Southern' : 'Northern'],
  ],
  facts: (m) => [
    ['IATA code', m.iata], ['ICAO code', m.icao || unknown], ['Size', cap(m.type)], ['Location', [m.city, m.country].filter(Boolean).join(', ')], ['Continent', m.continent],
    ['Elevation', m.elevation === null ? unknown : `${fmt(m.elevation)} ft (${metres(m.elevation)} m)`],
    ['Open runways', m.runways ? String(m.runways) : unknown],
    ['Longest runway', m.longest ? `${fmt(m.longest)} ft (${metres(m.longest)} m)` : unknown],
    ['Surface of the longest', m.surface ? cap(m.surface) : unknown],
    ['Runway lighting', m.lighted === null ? unknown : m.lighted ? 'At least one runway is lighted' : 'No runway is marked lighted'],
    ['Coordinates', `${m.lat}°, ${m.lon}°`], ['Official website listed', m.web ? 'Yes' : 'No'],
    ...(wikiOk(m.wiki) ? [['Wikipedia', 'Article', m.wiki]] : []),
    ['Source', `OurAirports ${m.id}`, `https://ourairports.com/airports/${encodeURIComponent(m.id)}/`],
  ],
  art(m) { // original runway diagram: the strip's length follows the longest runway, the stripes follow the open runway count; it never affects scoring
    const h = hash(m.id), hue = 190 + (h % 40), ang = 10 + ((h >>> 5) % 70);
    const len = 26 + 56 * Math.min(1, (m.longest || 4000) / 14000);
    const ground = { grass: '#3f7d3a', water: '#2a6f97', gravel: '#9a8a6a', dirt: '#8a6a4a', ice: '#cfe3ee' }[m.surface] || `hsl(${hue} 18% 24%)`;
    const strips = Math.min(m.runways || 1, 3);
    const bars = Array.from({ length: strips }, (_, i) => {
      const dy = (i - (strips - 1) / 2) * 12;
      return `<g transform="translate(50 ${40 + dy}) rotate(${ang + i * 5})"><rect x="${-len / 2}" y="-3.2" width="${len}" height="6.4" rx="1" fill="#22262d"/><line x1="${-len / 2 + 3}" y1="0" x2="${len / 2 - 3}" y2="0" stroke="#f4f4f0" stroke-width=".9" stroke-dasharray="3 2.6"/></g>`;
    }).join('');
    return `<svg class="avatar" viewBox="0 0 100 100" role="img" aria-label="Generated runway diagram for ${esc(m.name)}. Not a photograph or a map.">
      <rect width="100" height="100" rx="8" fill="${ground}"/>
      <rect x="0" y="0" width="100" height="100" rx="8" fill="hsl(${hue} 50% 12%)" opacity=".38"/>
      ${bars}
      <text x="50" y="82" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="17" letter-spacing="2" fill="#f4f6fa">${esc(m.iata)}</text>
      <text x="50" y="94" text-anchor="middle" font-family="system-ui,sans-serif" font-size="5.5" letter-spacing=".6" fill="#b8c2d2">GENERATED DIAGRAM</text></svg>`;
  },
  poolNotice: 'Every airport comes from <a href="https://ourairports.com/data/">OurAirports</a>, whose data is released to the public domain, as a snapshot: airports the catalog marks as having scheduled airline service, typed large, medium or small, with a three-letter IATA code. Heliports, seaplane bases, closed fields and airfields without airline service are not included. The catalog is maintained by volunteers and some fields are blank, so a badge only counts what is recorded. The pool describes this catalog, not every runway on Earth.',
  poolExtra(pool) {
    const tally = (get) => { const c = new Map(); for (const m of pool.members) for (const v of get(m)) c.set(v, (c.get(v) || 0) + 1); return [...c]; };
    const table = (title, rows) => `<table><thead><tr><th>${title}</th><th class="n">Airports</th></tr></thead><tbody>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="n">${fmt(v)}</td></tr>`).join('')}</tbody></table>`;
    const top = (rows, k) => rows.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, k);
    return `<h2>What is in the pool</h2><p class="small muted">Disclosed because a badge is only rare relative to this mix.</p>
      ${table('Size', top(tally((m) => [cap(m.type)]), 3))}${table('Continent', top(tally((m) => [m.continent]), 7))}${table('Surface of the longest runway', top(tally((m) => (m.surface ? [cap(m.surface)] : [])), 8))}${table('Top countries', top(tally((m) => [m.country]), 10))}`;
  },
  aboutData: `<h2>Where the facts come from</h2>
    <p>Name, codes, location, elevation, runways (count, longest length, surface of the longest, lighting) and the website flag come from <a href="https://ourairports.com/data/">OurAirports</a> bulk downloads, whose data is released to the public domain. It is a volunteer-maintained catalog, so values can be missing or wrong; a missing value never earns a badge, it is shown as "not in the catalog". Only runways the catalog does not mark closed are counted. Runway surfaces are free text in the catalog and are grouped here (asphalt, concrete, gravel, grass, dirt, water, other), so a surface this site cannot read is left unknown. The artwork is a generated diagram, not a photograph or a map. This is a game, not an aviation source: do not use it for navigation or flight planning.</p>`,
  terms: 'It is not affiliated with OurAirports or any airport, airline or aviation authority. Badges describe catalog facts, not how busy, safe or important an airport is.',
};
