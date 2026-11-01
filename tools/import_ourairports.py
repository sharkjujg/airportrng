#!/usr/bin/env python3
"""Build data/pool-v1.json from OurAirports (public domain: https://ourairports.com/data/).

Eligible: an airport the catalog marks as having scheduled airline service, typed large, medium or small, with a name, a three-letter
IATA code, a known country and coordinates. Closed airports, heliports, seaplane bases and airfields without airline service are out.
A missing value stays missing (elevation, runway data, city), so it can never satisfy a badge. Runway facts count only runways the
catalog does not mark closed; the longest one decides "longest" and "surface".

Usage:
  mkdir dl && cd dl
  curl -LO https://davidmegginson.github.io/ourairports-data/airports.csv   (and runways.csv, countries.csv)
  python tools/import_ourairports.py dl     (from the repository root; run tools/test_import.py first)
"""
import csv
import datetime as dt
import json
import pathlib
import re
import sys

CONTINENTS = {"AF": "Africa", "AN": "Antarctica", "AS": "Asia", "EU": "Europe", "NA": "North America", "OC": "Oceania", "SA": "South America"}
TYPES = {"large_airport": "large", "medium_airport": "medium", "small_airport": "small"}


def surface_class(raw):
    """OurAirports surface codes are free text ("ASPH-G", "GRVL-DIRT-F", "CRUSHED ROCK"). Reduce to a few honest classes; no text is unknown."""
    s = (raw or "").upper().strip()
    if not s or s in {"UNK", "N", "HARD"}:
        return None
    for key, cls in (("WATER", "water"), ("ASP", "asphalt"), ("BIT", "asphalt"), ("MAC", "asphalt"), ("CON", "concrete"), ("PEM", "concrete"), ("PER", "concrete"),
                     ("PAVED", "asphalt"), ("GVL", "gravel"), ("GRAVEL", "gravel"), ("GRVL", "gravel"), ("CRUSHED", "gravel"), ("TURF", "grass"), ("GRASS", "grass"),
                     ("GRS", "grass"), ("DIRT", "dirt"), ("EARTH", "dirt"), ("SAND", "dirt"), ("CLAY", "dirt"), ("CORAL", "dirt"), ("GRADED", "dirt"), ("SNOW", "ice"), ("ICE", "ice")):
        if key in s:
            return cls
    return "other"


def num(x, kind=int):
    try:
        return kind(float(x)) if str(x).strip() != "" else None
    except ValueError:
        return None


def convert(airports, runways, countries, wikipedia_only=False):
    pool, runs = [], {}
    for r in runways:
        if r["closed"] != "1":
            runs.setdefault(r["airport_ref"], []).append(r)
    for a in sorted(airports, key=lambda r: int(r["id"])):
        iata = (a["iata_code"] or "").strip()
        lat, lon = num(a["latitude_deg"], float), num(a["longitude_deg"], float)
        if not (a["scheduled_service"] == "yes" and a["type"] in TYPES and re.fullmatch("[A-Z]{3}", iata) and a["name"].strip()
                and a["iso_country"] in countries and lat is not None and lon is not None and -90 <= lat <= 90 and -180 <= lon <= 180):
            continue
        rows = runs.get(a["id"], [])
        longest = max(rows, key=lambda r: num(r["length_ft"]) or 0, default=None)
        length = num(longest["length_ft"]) if longest else None
        pool.append({
            "id": a["ident"], "name": a["name"].strip(), "iata": iata, "icao": (a["icao_code"] or "").strip() or None, "type": TYPES[a["type"]],
            "city": a["municipality"].strip() or None, "country": countries[a["iso_country"]], "cc": a["iso_country"],
            "continent": CONTINENTS.get(a["continent"]), "lat": round(lat, 4), "lon": round(lon, 4), "elevation": num(a["elevation_ft"]),
            "runways": len(rows) or None,                                             # no runway rows is unknown, not zero
            "longest": length if length else None, "surface": surface_class(longest["surface"]) if longest and length else None,
            "lighted": any(r["lighted"] == "1" for r in rows) if rows else None,
            "web": bool(a["home_link"].strip()), "wiki": a["wikipedia_link"].strip() or None,
        })
    return pool


def main(folder):
    d = pathlib.Path(folder)
    read = lambda n: list(csv.DictReader(open(d / n, encoding="utf-8", newline="")))
    countries = {r["code"]: r["name"] for r in read("countries.csv")}
    members = convert(read("airports.csv"), read("runways.csv"), countries)
    n, today = len(members), dt.datetime.now(dt.timezone.utc).date().isoformat()
    known = lambda f, what: f"known for {sum(m[f] is not None for m in members):,} of {n:,}; {what}"
    meta = {"version": "v1", "publishedAt": today, "capturedAt": today, "source": "OurAirports, public domain (https://ourairports.com/data/)",
            "provenance": f"Snapshot of the OurAirports CSV downloads taken {today}, converted by tools/import_ourairports.py. Facts only; no photographs or maps.",
            "selection": "Airports the catalog marks as having scheduled airline service, typed large, medium or small, with a name, a three-letter IATA code, a country and coordinates.",
            "fieldStatus": {"id": "known (OurAirports ident)", "name": "known", "iata": "known", "icao": known("icao", "unknown never satisfies a badge"), "type": "known",
                            "city": known("city", "unknown never satisfies a badge"), "country": "known", "continent": "known", "lat": "known", "lon": "known",
                            "elevation": known("elevation", "feet above sea level; unknown never satisfies a badge"),
                            "runways": known("runways", "open runways in the catalog; unknown never satisfies a badge"),
                            "longest": known("longest", "feet; unknown never satisfies a badge"), "surface": known("surface", "surface of the longest runway, grouped; unknown never satisfies a badge"),
                            "lighted": known("lighted", "any open runway marked lighted; unknown never satisfies a badge"), "web": "known (an official website is listed)", "wiki": known("wiki", "link to Wikipedia")}}
    lines = ",\n".join("  " + json.dumps(m, ensure_ascii=False, separators=(",", ":")) for m in members)
    out = pathlib.Path(__file__).resolve().parent.parent / "data" / "pool-v1.json"
    out.parent.mkdir(exist_ok=True)
    out.write_bytes(('{"meta":' + json.dumps(meta, ensure_ascii=False) + ',\n"members":[\n' + lines + "\n]}\n").encode("utf-8"))
    print(f"wrote {out}: {n} airports")


if __name__ == "__main__":
    main(sys.argv[1])
