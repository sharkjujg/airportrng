// AirportRNG fixtures for check.html: one row per case, [rule id, field overrides, expected match].
export const V = '2026-11-01';
export const base = { id: 'KAAA', name: 'Sample Airport', iata: 'BAD', icao: 'ZZZZ', type: 'medium', city: 'Elsewhere', country: 'United States', cc: 'US', continent: 'North America',
  lat: 40, lon: -100, elevation: 1000, runways: 1, longest: 6000, surface: 'asphalt', lighted: true, web: false, wiki: null };

const bands = (id, key, rows) => rows.map(([v, want]) => [id, { [key]: v }, want]);
const names = (id, yes, no) => [...yes.map((n) => [id, { name: n }, true]), ...no.map((n) => [id, { name: n }, false])];

export const cases = [
  ...['large', 'medium', 'small'].flatMap((t) => [[`${t}-airport`, { type: t }, true], [`${t}-airport`, { type: 'other' }, false], [`${t}-airport`, { type: null }, false]]),

  ...bands('below-sea-level', 'elevation', [[-1, true], [0, false], [null, false], [undefined, false]]),
  ...bands('near-sea-level', 'elevation', [[10, true], [0, true], [-5, true], [11, false], [null, false]]),
  ...bands('high-altitude', 'elevation', [[5000, true], [4999, false], [null, false]]),
  ...bands('very-high', 'elevation', [[8000, true], [7999, false], [null, false]]),
  ...bands('roof-of-the-world', 'elevation', [[12000, true], [11999, false], [null, false], ['12000', false]]),

  ...bands('twin-runways', 'runways', [[2, true], [1, false], [3, false], [null, false], [0, false]]),
  ...bands('triple-runways', 'runways', [[3, true], [2, false], [null, false]]),
  ...bands('quad-runways', 'runways', [[4, true], [3, false], [null, false]]),
  ...bands('five-runways', 'runways', [[5, true], [4, false], [null, false]]),

  ...bands('short-runway', 'longest', [[3000, true], [3001, false], [null, false], [0, false]]),
  ...bands('tiny-runway', 'longest', [[2000, true], [2001, false], [null, false], [0, false]]),
  ...bands('long-runway', 'longest', [[10000, true], [9999, false], [null, false]]),
  ...bands('ultra-long-runway', 'longest', [[12500, true], [12499, false], [null, false]]),

  ...['asphalt', 'concrete', 'gravel', 'grass', 'dirt', 'water'].flatMap((s) => [[`${s}-runway`, { surface: s }, true], [`${s}-runway`, { surface: 'other' }, false], [`${s}-runway`, { surface: null }, false]]),
  ...bands('unlit-runway', 'lighted', [[false, true], [true, false], [null, false]]),

  ...bands('palindrome-code', 'iata', [['ABA', true], ['AAA', true], ['ABC', false], ['AB', false], [null, false], ['aba', false]]),
  ...bands('double-letter-code', 'iata', [['AAB', true], ['ABB', true], ['ABA', false], ['ABC', false], [null, false]]),
  ...bands('ascending-code', 'iata', [['ABQ', true], ['ABB', false], ['BAC', false], ['CBA', false], [null, false]]),
  ...bands('letter-x', 'iata', [['LAX', true], ['LAS', false], [null, false]]),
  ...bands('letter-q', 'iata', [['ABQ', true], ['LAX', false], [null, false]]),
  ['icao-from-iata', { iata: 'JFK', icao: 'KJFK' }, true], ['icao-from-iata', { iata: 'JFK', icao: 'EGLL' }, false], ['icao-from-iata', { iata: 'JFK', icao: null }, false], ['icao-from-iata', { iata: null, icao: 'KJFK' }, false],
  ['city-code', { iata: 'DAL', city: 'Dallas' }, true], ['city-code', { iata: 'DAL', city: 'Fort Dallas' }, false], ['city-code', { iata: 'DAL', city: null }, false], ['city-code', { iata: 'NYC', city: 'New York' }, false],
  ['city-code', { iata: 'SAN', city: 'São Paulo' }, false], ['city-code', { iata: 'SAO', city: 'São Paulo' }, false], // accents are not letters a-z: "so paulo" never starts with SAO

  ...names('international-name', ['Dallas Fort Worth International Airport', 'Seoul Incheon INTL', 'Sample Intl.'], ['Internationale Halle', 'Interstate Field', '']),
  ...names('regional-name', ['Sample Regional Airport'], ['Sample Region Airport']),
  ...names('memorial-name', ['Veterans Memorial Airport'], ['Memorials Airport']),
  ...names('field-name', ['Wiley Post Field', 'FIELD'], ['Fieldstone Airport']),
  ...names('military-name', ['Wright-Patterson Air Force Base', 'Sample AFB', 'Naval Air Station', 'Sample Army Airfield'], ['Armyville Airport', 'Navalino Airport']),
  ...names('island-name', ['Block Island State Airport'], ['Islander Airport', 'Islandia']),
  ...names('numbered-name', ['Runway 9 Field', 'Route 66 Airport'], ['Sample Airport']),
  ...names('long-name', ['x'.repeat(40)], ['x'.repeat(39)]),
  ['numbered-name', { name: undefined }, false], ['long-name', { name: '  ' }, false],

  ...bands('southern-hemisphere', 'lat', [[-0.1, true], [0, false], [10, false], [null, false]]),
  ...bands('equatorial', 'lat', [[5, true], [-5, true], [5.1, false], [-5.1, false], [null, false]]),
  ...bands('polar-reach', 'lat', [[60, true], [-60, true], [59.9, false], [null, false]]),
  ...bands('date-line', 'lon', [[175, true], [-175, true], [174.9, false], [null, false]]),
  ...['Oceania', 'Africa', 'South America'].flatMap((c) => [[c.toLowerCase().replace(' ', '-'), { continent: c }, true], [c.toLowerCase().replace(' ', '-'), { continent: 'Europe' }, false], [c.toLowerCase().replace(' ', '-'), { continent: null }, false]]),
  ...bands('has-website', 'web', [[true, true], [false, false], [null, false], ['yes', false]]),
];

export function poolChecks(raw, pool, ok) {
  const ms = raw.members, iatas = ms.map((m) => m.iata);
  const SURF = new Set(['asphalt', 'concrete', 'gravel', 'grass', 'dirt', 'water', 'ice', 'other', null]);
  const CONT = new Set(['Africa', 'Antarctica', 'Asia', 'Europe', 'North America', 'Oceania', 'South America']);
  ok('every airport has a name, a country, a continent and a type', ms.every((m) => m.name && m.country && CONT.has(m.continent) && ['large', 'medium', 'small'].includes(m.type)));
  ok('IATA codes are three capital letters and unique', ms.every((m) => /^[A-Z]{3}$/.test(m.iata)) && new Set(iatas).size === ms.length);
  ok('coordinates are in range', ms.every((m) => Math.abs(m.lat) <= 90 && Math.abs(m.lon) <= 180));
  ok('elevations are plausible feet (or unknown)', ms.every((m) => m.elevation === null || (m.elevation > -1500 && m.elevation < 30000)));
  ok('runway count and length are positive (or unknown)', ms.every((m) => (m.runways === null || m.runways > 0) && (m.longest === null || (m.longest > 0 && m.longest < 30000))));
  ok('surfaces are known classes', ms.every((m) => SURF.has(m.surface)));
  ok('a surface or length is only recorded when a runway is', ms.every((m) => m.runways !== null || (m.longest === null && m.surface === null && m.lighted === null)));
  ok('the pool is large enough to be a game (>= 1000)', pool.n >= 1000);
}
