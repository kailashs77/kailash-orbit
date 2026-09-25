# Self-hosted fonts

Latin-subset WOFF2 files, downloaded unmodified from Google Fonts (fonts.gstatic.com). Their `@font-face` rules at the top of `css/style.css` mirror the ones Google serves: same weight/width ranges and the same Latin `unicode-range`.

| File | Font | Styles covered | Licence |
|---|---|---|---|
| `archivo-latin.woff2` | Archivo (variable) | normal, weights 100–900, widths 62–125% | SIL Open Font License 1.1, see `OFL-Archivo.txt` |
| `archivo-italic-latin.woff2` | Archivo (variable) | italic, weights 100–900, widths 62–125% | SIL Open Font License 1.1, see `OFL-Archivo.txt` |
| `jetbrains-mono-latin.woff2` | JetBrains Mono (variable) | normal, weights 400–500 | SIL Open Font License 1.1, see `OFL-JetBrainsMono.txt` |

The licence texts come from the official google/fonts repository (`ofl/archivo/OFL.txt`, `ofl/jetbrainsmono/OFL.txt`).

Only the Latin character set is included, which covers everything on the site. Characters outside it (e.g. the ✦ and ↗ symbols) fall back to system fonts, just as they did with Google Fonts.
