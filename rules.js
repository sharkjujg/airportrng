// AirportRNG badge rules. Each rule is a deterministic predicate over known fields: a value the catalog does not have never matches.
// test(m, poolDate) and evidence(m, poolDate) read the prepared member from prep().

export const RULESET = '1';

export const norm = (s) => s.normalize('NFKC').toLowerCase();

const fmt = (n) => n.toLocaleString('en');
const chars = (s) => Array.from(s);
const int = (x) => (Number.isInteger(x) && x > 0 ? x : null);          // counts and lengths: zero or absent is unknown
const text = (x) => (typeof x === 'string' && x.trim() ? x.trim() : null);

export function prep(raw) {
  const name = text(raw.name), city = text(raw.city), iata = text(raw.iata), icao = text(raw.icao);
  return {
    ...raw,
    n: name ? norm(name) : null, c: city ? norm(city).replace(/[^a-z]/g, '') : null,
    iata: iata && /^[A-Z]{3}$/.test(iata) ? iata : null, icao: icao && /^[A-Z0-9]{3,4}$/.test(icao) ? icao : null,
    elevation: typeof raw.elevation === 'number' && Number.isFinite(raw.elevation) ? raw.elevation : null, // sea level is a real 0
    runways: int(raw.runways), longest: int(raw.longest), surface: text(raw.surface),
    lighted: typeof raw.lighted === 'boolean' ? raw.lighted : null,
    lat: typeof raw.lat === 'number' && Number.isFinite(raw.lat) ? raw.lat : null, lon: typeof raw.lon === 'number' && Number.isFinite(raw.lon) ? raw.lon : null,
    web: raw.web === true,
  };
}

const ft = (m) => `${m.name} sits at ${fmt(m.elevation)} ft (${fmt(Math.round(m.elevation * 0.3048))} m)`;
const rw = (m) => `${m.name} has ${m.runways} open runway${m.runways === 1 ? '' : 's'} in the catalog`;
const lg = (m) => `${m.name}'s longest runway is ${fmt(m.longest)} ft (${fmt(Math.round(m.longest * 0.3048))} m)`;
const sf = (m) => `${m.name}'s longest runway is ${m.surface}`;
const code = (m) => `${m.name} has the code ${m.iata}`;
const nm = (m) => `"${m.name}"`;
const at = (m) => `${m.name} is at ${m.lat}°, ${m.lon}°`;
const word = (re) => (m) => m.n !== null && re.test(m.n);
const size = (t) => (m) => m.type === t;
const surface = (s) => (m) => m.surface === s;
const continent = (c) => (m) => m.continent === c;
const onCont = (m) => `${m.name} is in ${m.continent}`;

export const RULES = [
  { id: 'large-airport', name: 'Large Airport', family: 'Airport size', rule: 'Typed large in the catalog', test: size('large'), evidence: (m) => `${m.name} is a large airport` },
  { id: 'medium-airport', name: 'Medium Airport', family: 'Airport size', rule: 'Typed medium in the catalog', test: size('medium'), evidence: (m) => `${m.name} is a medium airport` },
  { id: 'small-airport', name: 'Small Airport', family: 'Airport size', rule: 'Typed small in the catalog', test: size('small'), evidence: (m) => `${m.name} is a small airport` },

  { id: 'below-sea-level', name: 'Below Sea Level', family: 'Elevation', rule: 'Elevation under 0 ft', test: (m) => m.elevation !== null && m.elevation < 0, evidence: ft },
  { id: 'near-sea-level', name: 'Near Sea Level', family: 'Elevation', rule: 'Elevation of 10 ft or less', test: (m) => m.elevation !== null && m.elevation <= 10, evidence: ft },
  { id: 'high-altitude', name: 'High Altitude', family: 'Elevation', rule: 'Elevation of 5,000 ft or more', test: (m) => m.elevation !== null && m.elevation >= 5000, evidence: ft },
  { id: 'very-high', name: 'Very High', family: 'Elevation', rule: 'Elevation of 8,000 ft or more', test: (m) => m.elevation !== null && m.elevation >= 8000, evidence: ft },
  { id: 'roof-of-the-world', name: 'Roof of the World', family: 'Elevation', rule: 'Elevation of 12,000 ft or more', test: (m) => m.elevation !== null && m.elevation >= 12000, evidence: ft },

  { id: 'twin-runways', name: 'Twin Runways', family: 'Runway count', rule: 'Exactly two open runways', test: (m) => m.runways === 2, evidence: rw },
  { id: 'triple-runways', name: 'Triple Runways', family: 'Runway count', rule: 'Three or more open runways', test: (m) => m.runways !== null && m.runways >= 3, evidence: rw },
  { id: 'quad-runways', name: 'Quad Runways', family: 'Runway count', rule: 'Four or more open runways', test: (m) => m.runways !== null && m.runways >= 4, evidence: rw },
  { id: 'five-runways', name: 'Five Runways', family: 'Runway count', rule: 'Five or more open runways', test: (m) => m.runways !== null && m.runways >= 5, evidence: rw },

  { id: 'short-runway', name: 'Short Runway', family: 'Longest runway', rule: 'Longest runway of 3,000 ft or less', test: (m) => m.longest !== null && m.longest <= 3000, evidence: lg },
  { id: 'tiny-runway', name: 'Tiny Runway', family: 'Longest runway', rule: 'Longest runway of 2,000 ft or less', test: (m) => m.longest !== null && m.longest <= 2000, evidence: lg },
  { id: 'long-runway', name: 'Long Runway', family: 'Longest runway', rule: 'Longest runway of 10,000 ft or more', test: (m) => m.longest !== null && m.longest >= 10000, evidence: lg },
  { id: 'ultra-long-runway', name: 'Ultra-Long Runway', family: 'Longest runway', rule: 'Longest runway of 12,500 ft or more', test: (m) => m.longest !== null && m.longest >= 12500, evidence: lg },

  { id: 'asphalt-runway', name: 'Asphalt Runway', family: 'Surface', rule: 'Longest runway is asphalt', test: surface('asphalt'), evidence: sf },
  { id: 'concrete-runway', name: 'Concrete Runway', family: 'Surface', rule: 'Longest runway is concrete', test: surface('concrete'), evidence: sf },
  { id: 'gravel-runway', name: 'Gravel Runway', family: 'Surface', rule: 'Longest runway is gravel', test: surface('gravel'), evidence: sf },
  { id: 'grass-runway', name: 'Grass Runway', family: 'Surface', rule: 'Longest runway is grass or turf', test: surface('grass'), evidence: sf },
  { id: 'dirt-runway', name: 'Dirt Runway', family: 'Surface', rule: 'Longest runway is dirt, sand, clay or coral', test: surface('dirt'), evidence: sf },
  { id: 'water-runway', name: 'Water Runway', family: 'Surface', rule: 'Longest runway is water', test: surface('water'), evidence: sf },
  { id: 'unlit-runway', name: 'Unlit Runway', family: 'Lighting', rule: 'The catalog lists runways and none is marked lighted', test: (m) => m.lighted === false, evidence: (m) => `none of ${m.name}'s ${m.runways} runway${m.runways === 1 ? ' is' : 's is'} marked lighted` },

  { id: 'palindrome-code', name: 'Palindrome Code', family: 'Code pattern', rule: 'IATA code reads the same backwards (like ABA)', test: (m) => m.iata !== null && m.iata[0] === m.iata[2], evidence: code },
  { id: 'double-letter-code', name: 'Double Letter Code', family: 'Code pattern', rule: 'IATA code has two equal letters side by side', test: (m) => m.iata !== null && (m.iata[0] === m.iata[1] || m.iata[1] === m.iata[2]), evidence: code },
  { id: 'ascending-code', name: 'Ascending Code', family: 'Code order', rule: 'IATA code letters rise in alphabetical order (like ABQ)', test: (m) => m.iata !== null && m.iata[0] < m.iata[1] && m.iata[1] < m.iata[2], evidence: code },
  { id: 'letter-x', name: 'Letter X', family: 'Rare letter', rule: 'IATA code contains X', test: (m) => m.iata !== null && m.iata.includes('X'), evidence: code },
  { id: 'letter-q', name: 'Letter Q', family: 'Rare letter', rule: 'IATA code contains Q', test: (m) => m.iata !== null && m.iata.includes('Q'), evidence: code },
  { id: 'icao-from-iata', name: 'K Plus Three', family: 'Matching ICAO', rule: 'ICAO code is K followed by the IATA code', test: (m) => m.iata !== null && m.icao === `K${m.iata}`, evidence: (m) => `${m.name}: ${m.icao} is K plus ${m.iata}` },
  { id: 'city-code', name: 'Spelled in the City', family: 'Spelled in city', rule: 'The city name starts with the IATA code letters', test: (m) => m.iata !== null && m.c !== null && m.c.startsWith(m.iata.toLowerCase()), evidence: (m) => `${m.city} starts with ${m.iata}` },

  { id: 'international-name', name: 'International', family: 'Name word', rule: 'Name contains "International" or "Intl"', test: word(/\b(international|intl)\b/), evidence: nm },
  { id: 'regional-name', name: 'Regional', family: 'Name word', rule: 'Name contains "Regional"', test: word(/\bregional\b/), evidence: nm },
  { id: 'memorial-name', name: 'Memorial', family: 'Name word', rule: 'Name contains "Memorial"', test: word(/\bmemorial\b/), evidence: nm },
  { id: 'field-name', name: 'Field', family: 'Name word', rule: 'Name contains the word "Field"', test: word(/\bfield\b/), evidence: nm },
  { id: 'military-name', name: 'Military Name', family: 'Name word', rule: 'Name contains Air Force Base, AFB, Air Base, Naval or Army', test: word(/(air force base|\bafb\b|air base|\bnaval\b|\barmy\b)/), evidence: nm },
  { id: 'island-name', name: 'Island Name', family: 'Name word', rule: 'Name contains "Island"', test: word(/\bisland\b/), evidence: nm },
  { id: 'numbered-name', name: 'Numbered Name', family: 'Name digits', rule: 'Name contains a digit 0-9', test: word(/[0-9]/), evidence: (m) => `${nm(m)} contains a digit` },
  { id: 'long-name', name: 'Long Name', family: 'Name length', rule: 'Name of 40 characters or more', test: (m) => m.n !== null && chars(m.n).length >= 40, evidence: (m) => `${nm(m)} has ${chars(m.n).length} characters` },

  { id: 'southern-hemisphere', name: 'Southern Hemisphere', family: 'Hemisphere', rule: 'South of the equator', test: (m) => m.lat !== null && m.lat < 0, evidence: at },
  { id: 'equatorial', name: 'Equatorial', family: 'Latitude', rule: 'Within 5 degrees of the equator', test: (m) => m.lat !== null && Math.abs(m.lat) <= 5, evidence: at },
  { id: 'polar-reach', name: 'Polar Reach', family: 'Latitude', rule: 'At 60 degrees latitude or beyond', test: (m) => m.lat !== null && Math.abs(m.lat) >= 60, evidence: at },
  { id: 'date-line', name: 'Date Line', family: 'Longitude', rule: 'Within 5 degrees of the 180th meridian', test: (m) => m.lon !== null && Math.abs(m.lon) >= 175, evidence: at },
  { id: 'oceania', name: 'Oceania', family: 'Continent', rule: 'On the continent Oceania', test: continent('Oceania'), evidence: onCont },
  { id: 'africa', name: 'Africa', family: 'Continent', rule: 'On the continent Africa', test: continent('Africa'), evidence: onCont },
  { id: 'south-america', name: 'South America', family: 'Continent', rule: 'On the continent South America', test: continent('South America'), evidence: onCont },

  { id: 'has-website', name: 'Has a Website', family: 'Website', rule: 'The catalog lists an official website', test: (m) => m.web === true, evidence: (m) => `${m.name} lists an official website` },
];
