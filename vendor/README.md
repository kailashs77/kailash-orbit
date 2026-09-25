# Vendored libraries

Served from this repo so the page doesn't wait on a third-party CDN. Files are unmodified copies of the official builds, verified against the SHA-256 hashes jsDelivr publishes.

| File | Package | Source | SHA-256 (base64) | Licence |
|---|---|---|---|---|
| `gsap.min.js` | gsap 3.12.5 | https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js | `KAM+RJox68w5blvosTtjFSvwMJQoj7WGcDQyGSe84Ic=` | GSAP Standard License (https://gsap.com/standard-license) |
| `ScrollTrigger.min.js` | gsap 3.12.5 | https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js | `rTPC35raimY8IUc1eCj5gNC3ynMe8z6zxuTzJ8OyzaU=` | GSAP Standard License |
| `lenis.min.js` | lenis 1.1.13 | https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js | `spWPFC+DLw1eVHze935vrfzha+pgmC/Iu/UDlaJDnfg=` | MIT |
| `matter.min.js` | matter-js 0.19.0 | https://cdn.jsdelivr.net/npm/matter-js@0.19.0/build/matter.min.js | `vfaOKX1sTshbjdaTuHgdmdsAkEScmjummUju3gjJJ1o=` | MIT |

`matter.min.js` is only loaded when the "Let's talk." drop is clicked; the others load with the page.

To update a library, download the new version from the same path, re-check its hash against `https://data.jsdelivr.com/v1/packages/npm/<package>@<version>?structure=flat`, and update this table.
