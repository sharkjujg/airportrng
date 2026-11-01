# AirportRNG

A daily airport discovery game: roll once per UTC day, draw one airport with scheduled flights from an OurAirports snapshot, and see which badges make it unusual. A sibling of CinemaRNG, BrickRNG, ExoRNG, QuakeRNG, PeakRNG, AsteroidRNG, BookRNG and SpeciesRNG on the same engine.

**This is a prototype.** Airport facts are a snapshot of [OurAirports](https://ourairports.com/data/) (released to the public domain). There is no backend, so results live in the player's browser. No photographs or maps are used. Not for navigation or flight planning. Unofficial fan project, not affiliated with OurAirports or any airport, airline or aviation authority.

## What is built

| Area | Status |
| --- | --- |
| Daily roll, unbiased secure draw, one per UTC day, retry-safe | Done, browser-local (the day comes from the host's `Date` header, not the device clock) |
| 46 badge rules, families, RP = 100 / p, overall rarity tiers, tie rules | Done, tested in `rules.js`; `check.html` fails if any airport earns no badge |
| Animated reveal, badges appearing from worst to best, reduced-motion aware | Done |
| Achievements derived from your rolls, with goals scaled to the pool size (1,512 for 4,010 airports) | Done (`achievements.js`) |
| Badge catalog, badge pages, levels, history, export, delete, pool page | Done |
| Sign-in, ranked limit, leaderboards, friends | Needs a server (see the `rng-accounts` design) |

## Run it

No build step.

```
python -m http.server 8765
```

Open <http://localhost:8765>. Open `/check.html` for the self-check; its title becomes `PASS` or `FAIL n`.

## Layout

- `engine.js` and `achievements.js` generic scoring, tiers, sampling, day helpers and achievements (shared with sibling RNG games)
- `rules.js` this game's badge rules; `site.js` its names, copy, art and shelves; `fixtures.js` rule fixtures for `check.html`
- `app.js`, `index.html`, `style.css` the site (hash routes, so it works on any static host)
- `data/pool-v1.json` the published pool; `tools/import_ourairports.py` rebuilds it from the OurAirports CSV downloads (`airports.csv`, `runways.csv`, `countries.csv`), and `tools/test_import.py` checks the conversion. A missing value stays missing, so it never earns a badge. Only runways the catalog does not mark closed are counted

## Publishing

GitHub Pages serves the repository root from `main`. Push to `main` to update the site.
