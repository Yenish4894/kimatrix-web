"""Build the self-hosted woff2 fonts in src/app/fonts from Google's upstream variable TTFs.

Usage: pip install fonttools brotli && python scripts/build-fonts.py src/app/fonts
Upstream TTFs are downloaded into scripts/.font-src (git-ignored) on first run.

Output: variable-weight woff2 files subset to Google's `latin` + `latin-ext` ranges, so
glyph coverage matches what next/font/google served before. Inter is pinned to opsz=14
(text size) because the site never uses display sizes and the axis doubles the file.
"""
import os
import sys
import urllib.request

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

OUT = sys.argv[1]
SRC = os.path.join(os.path.dirname(__file__), ".font-src")
os.makedirs(OUT, exist_ok=True)

# Google Fonts' own unicode-range for the `latin` and `latin-ext` subsets.
LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"
LATIN_EXT = "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF"

FONTS = [
    # (output name, upstream path in google/fonts, axis limits)
    ("inter", "ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf", {"opsz": 14, "wght": (400, 600)}),
    ("plus-jakarta-sans", "ofl/plusjakartasans/PlusJakartaSans%5Bwght%5D.ttf", {"wght": (400, 800)}),
    ("jetbrains-mono", "ofl/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf", {"wght": 400}),
]

for name, path, limits in FONTS:
    ttf = os.path.join(SRC, name + ".ttf")
    if not os.path.exists(ttf):
        urllib.request.urlretrieve("https://raw.githubusercontent.com/google/fonts/main/" + path, ttf)
    font = TTFont(ttf)
    font = instancer.instantiateVariableFont(font, limits, inplace=False, updateFontNames=False)
    inst = os.path.join(SRC, name + "-instanced.ttf")
    font.save(inst)

    out = os.path.join(OUT, name + ".woff2")
    unicodes = LATIN if name == "jetbrains-mono" else LATIN + "," + LATIN_EXT
    subset.main([
        inst,
        "--unicodes=" + unicodes,
        "--flavor=woff2",
        "--layout-features=*",
        "--name-IDs=*",
        "--notdef-outline",
        "--output-file=" + out,
    ])
    check = TTFont(out)
    axes = [(a.axisTag, a.minValue, a.maxValue) for a in check["fvar"].axes] if "fvar" in check else "static"
    print(f"{name}.woff2  {os.path.getsize(out)//1024} KB  glyphs={len(check.getGlyphOrder())}  axes={axes}")
