import localFont from "next/font/local";

// Lab Book type, kept in the repo so a build never has to reach Google Fonts:
// Barlow for the interface, Barlow Condensed for printed labels and headings,
// Spectral for reading, JetBrains Mono for code only. The files in ./files are
// the ones Google Fonts serves, one per script, and each script is declared
// with the range of characters it covers, so a browser downloads Cyrillic or
// Vietnamese only for a page that has some. Only Latin is preloaded, and only
// Latin carries the metric-matched fallback that keeps text from shifting
// while the font arrives. Licences are in ./licenses.
//
// next/font wants each call written out at the top level of a module, which
// is why this isn't a loop.

// Barlow
const barlowVietnamese = localFont({
  src: [
    { path: "./files/barlow-vietnamese-400.woff2", weight: "400", style: "normal" },
    { path: "./files/barlow-vietnamese-500.woff2", weight: "500", style: "normal" },
    { path: "./files/barlow-vietnamese-600.woff2", weight: "600", style: "normal" },
    { path: "./files/barlow-vietnamese-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB" }],
});

const barlowLatinExt = localFont({
  src: [
    { path: "./files/barlow-latin-ext-400.woff2", weight: "400", style: "normal" },
    { path: "./files/barlow-latin-ext-500.woff2", weight: "500", style: "normal" },
    { path: "./files/barlow-latin-ext-600.woff2", weight: "600", style: "normal" },
    { path: "./files/barlow-latin-ext-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
});

const barlow = localFont({
  src: [
    { path: "./files/barlow-latin-400.woff2", weight: "400", style: "normal" },
    { path: "./files/barlow-latin-500.woff2", weight: "500", style: "normal" },
    { path: "./files/barlow-latin-600.woff2", weight: "600", style: "normal" },
    { path: "./files/barlow-latin-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" }],
});

// Barlow Condensed
const barlowCondensedVietnamese = localFont({
  src: [
    { path: "./files/barlow-condensed-vietnamese-500.woff2", weight: "500", style: "normal" },
    { path: "./files/barlow-condensed-vietnamese-600.woff2", weight: "600", style: "normal" },
    { path: "./files/barlow-condensed-vietnamese-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB" }],
});

const barlowCondensedLatinExt = localFont({
  src: [
    { path: "./files/barlow-condensed-latin-ext-500.woff2", weight: "500", style: "normal" },
    { path: "./files/barlow-condensed-latin-ext-600.woff2", weight: "600", style: "normal" },
    { path: "./files/barlow-condensed-latin-ext-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
});

const barlowCondensed = localFont({
  src: [
    { path: "./files/barlow-condensed-latin-500.woff2", weight: "500", style: "normal" },
    { path: "./files/barlow-condensed-latin-600.woff2", weight: "600", style: "normal" },
    { path: "./files/barlow-condensed-latin-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" }],
});

// Spectral
const spectralCyrillicExt = localFont({
  src: [
    { path: "./files/spectral-cyrillic-ext-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./files/spectral-cyrillic-ext-500-italic.woff2", weight: "500", style: "italic" },
    { path: "./files/spectral-cyrillic-ext-600-italic.woff2", weight: "600", style: "italic" },
    { path: "./files/spectral-cyrillic-ext-400.woff2", weight: "400", style: "normal" },
    { path: "./files/spectral-cyrillic-ext-500.woff2", weight: "500", style: "normal" },
    { path: "./files/spectral-cyrillic-ext-600.woff2", weight: "600", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F" }],
});

const spectralCyrillic = localFont({
  src: [
    { path: "./files/spectral-cyrillic-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./files/spectral-cyrillic-500-italic.woff2", weight: "500", style: "italic" },
    { path: "./files/spectral-cyrillic-600-italic.woff2", weight: "600", style: "italic" },
    { path: "./files/spectral-cyrillic-400.woff2", weight: "400", style: "normal" },
    { path: "./files/spectral-cyrillic-500.woff2", weight: "500", style: "normal" },
    { path: "./files/spectral-cyrillic-600.woff2", weight: "600", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116" }],
});

const spectralVietnamese = localFont({
  src: [
    { path: "./files/spectral-vietnamese-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./files/spectral-vietnamese-500-italic.woff2", weight: "500", style: "italic" },
    { path: "./files/spectral-vietnamese-600-italic.woff2", weight: "600", style: "italic" },
    { path: "./files/spectral-vietnamese-400.woff2", weight: "400", style: "normal" },
    { path: "./files/spectral-vietnamese-500.woff2", weight: "500", style: "normal" },
    { path: "./files/spectral-vietnamese-600.woff2", weight: "600", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB" }],
});

const spectralLatinExt = localFont({
  src: [
    { path: "./files/spectral-latin-ext-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./files/spectral-latin-ext-500-italic.woff2", weight: "500", style: "italic" },
    { path: "./files/spectral-latin-ext-600-italic.woff2", weight: "600", style: "italic" },
    { path: "./files/spectral-latin-ext-400.woff2", weight: "400", style: "normal" },
    { path: "./files/spectral-latin-ext-500.woff2", weight: "500", style: "normal" },
    { path: "./files/spectral-latin-ext-600.woff2", weight: "600", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
});

const spectral = localFont({
  src: [
    { path: "./files/spectral-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./files/spectral-latin-500-italic.woff2", weight: "500", style: "italic" },
    { path: "./files/spectral-latin-600-italic.woff2", weight: "600", style: "italic" },
    { path: "./files/spectral-latin-400.woff2", weight: "400", style: "normal" },
    { path: "./files/spectral-latin-500.woff2", weight: "500", style: "normal" },
    { path: "./files/spectral-latin-600.woff2", weight: "600", style: "normal" },
  ],
  display: "swap",
  preload: true,
  adjustFontFallback: "Times New Roman",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" }],
});

// JetBrains Mono
const jetbrainsMonoCyrillicExt = localFont({
  src: "./files/jetbrains-mono-cyrillic-ext-100-800.woff2",
  weight: "100 800",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0460-052F, U+1C80-1C8A, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F" }],
});

const jetbrainsMonoCyrillic = localFont({
  src: "./files/jetbrains-mono-cyrillic-100-800.woff2",
  weight: "100 800",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116" }],
});

const jetbrainsMonoGreek = localFont({
  src: "./files/jetbrains-mono-greek-100-800.woff2",
  weight: "100 800",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0370-0377, U+037A-037F, U+0384-038A, U+038C, U+038E-03A1, U+03A3-03FF" }],
});

const jetbrainsMonoVietnamese = localFont({
  src: "./files/jetbrains-mono-vietnamese-100-800.woff2",
  weight: "100 800",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB" }],
});

const jetbrainsMonoLatinExt = localFont({
  src: "./files/jetbrains-mono-latin-ext-100-800.woff2",
  weight: "100 800",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
});

const jetbrainsMono = localFont({
  src: "./files/jetbrains-mono-latin-100-800.woff2",
  weight: "100 800",
  style: "normal",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" }],
});

type Font = { style: { fontFamily: string } };
const stack = (...fonts: Font[]) => fonts.map((font) => font.style.fontFamily).join(", ");

/**
 * The font families as the CSS variables globals.css builds its --lk-font-*
 * tokens from. They go on <html> as an inline style.
 */
export const fontVariables = {
  "--font-barlow": stack(barlowVietnamese, barlowLatinExt, barlow),
  "--font-barlow-condensed": stack(barlowCondensedVietnamese, barlowCondensedLatinExt, barlowCondensed),
  "--font-spectral": stack(spectralCyrillicExt, spectralCyrillic, spectralVietnamese, spectralLatinExt, spectral),
  "--font-jetbrains": stack(jetbrainsMonoCyrillicExt, jetbrainsMonoCyrillic, jetbrainsMonoGreek, jetbrainsMonoVietnamese, jetbrainsMonoLatinExt, jetbrainsMono),
};
