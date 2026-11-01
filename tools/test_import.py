#!/usr/bin/env python3
"""Check import_ourairports.py against a few hand-made rows in OurAirports' column layout. Usage: python tools/test_import.py"""
import import_ourairports as imp

A = ["id", "ident", "type", "name", "latitude_deg", "longitude_deg", "elevation_ft", "continent", "iso_country", "municipality", "scheduled_service", "icao_code", "iata_code", "home_link", "wikipedia_link"]
R = ["airport_ref", "length_ft", "surface", "lighted", "closed"]
row = lambda cols, vals: dict(zip(cols, vals))
airports = [
    row(A, ["3", "KAAA", "large_airport", "Big Intl", "40.5", "-100.25", "1500", "NA", "US", "Townsville", "yes", "KAAA", "AAA", "http://x", "http://w"]),
    row(A, ["1", "ZBBB", "small_airport", "Tiny Strip", "-5", "170", "", "OC", "KI", "", "yes", "", "BBB", "", ""]),
    row(A, ["2", "KCCC", "heliport", "Helipad", "40", "-100", "10", "NA", "US", "X", "yes", "", "CCC", "", ""]),          # not an airport type
    row(A, ["4", "KDDD", "medium_airport", "No Service", "40", "-100", "10", "NA", "US", "X", "no", "", "DDD", "", ""]),     # no scheduled service
    row(A, ["5", "KEEE", "medium_airport", "No Code", "40", "-100", "10", "NA", "US", "X", "yes", "", "", "", ""]),          # no IATA code
    row(A, ["6", "KFFF", "medium_airport", "Bad Place", "95", "-100", "10", "NA", "US", "X", "yes", "", "FFF", "", ""]),     # latitude out of range
    row(A, ["7", "XGGG", "medium_airport", "Nowhere", "10", "10", "10", "AF", "ZZ", "X", "yes", "", "GGG", "", ""]),         # unknown country
]
runways = [row(R, ["3", "11000", "ASPH-G", "1", "0"]), row(R, ["3", "9000", "CON", "0", "0"]), row(R, ["3", "15000", "ASP", "1", "1"]), row(R, ["1", "", "", "0", "0"])]
got = {m["id"]: m for m in imp.convert(airports, runways, {"US": "United States", "KI": "Kiribati"})}

assert list(got) == ["ZBBB", "KAAA"], list(got)  # ordered by OurAirports id; every ineligible row is gone
a = got["KAAA"]
assert (a["type"], a["runways"], a["longest"], a["surface"], a["lighted"], a["web"], a["country"], a["continent"]) == ("large", 2, 11000, "asphalt", True, True, "United States", "North America"), a  # the closed 15,000 ft runway is ignored
b = got["ZBBB"]
assert (b["elevation"], b["city"], b["icao"], b["longest"], b["surface"], b["web"], b["wiki"]) == (None, None, None, None, None, False, None), b  # blank stays unknown; a runway row with no length is no length
assert b["runways"] == 1 and b["lighted"] is False, b
assert [imp.surface_class(s) for s in ("ASP", "ASPH-G", "CON", "GRVL-DIRT-F", "TURF-G", "WATER", "UNK", "", "CORAL", "MARBLE")] == \
    ["asphalt", "asphalt", "concrete", "gravel", "grass", "water", None, None, "dirt", "other"]
print("OK")
