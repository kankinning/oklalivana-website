# OKLA LIVANA — website

Static site. No build step: every page is plain HTML that loads `support.js`,
`site.css` and `site.js` from the same folder.

## Publish on GitHub Pages

1. Push this folder to a repository.
2. Settings → Pages → Source: **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. The site appears at `https://<user>.github.io/<repo>/`.

`.nojekyll` is present so Jekyll does not filter any files.

## Pages

| URL | Source to edit |
| --- | --- |
| `index.html` | `home.dc.html` |
| `about.html` | `about.dc.html` |
| `why-btr.html` | `why-btr.dc.html` |
| `invest.html` | `invest.dc.html` |
| `albany.html` | `albany.dc.html` |
| `okla-btr.html` | `okla-btr.dc.html` |
| `contact.html` | `contact.dc.html` |

The `.dc.html` files are the working copies. After editing them, the matching
`.html` file must be regenerated (same content, internal links renamed).

Shared parts — `site-nav.dc.html`, `site-footer.dc.html`, `site.css`, `site.js` —
are used by both sets, so a change there needs no regeneration.

## Still hosted externally

Two Vimeo embeds are intentional. The following still load from the old Wix CDN
and will break if that account lapses — export the originals and drop them into
`assets/` to replace:

- `okla-btr` — 13 render images (A History of Kingsman, The Design, Community
  Inspired, Shovel-Ready)
- `albany` — 4 short films in the Golden Triangle carousels
- `index` — the hero background video

## Password gate

Handled client-side in `site.js`. It deters casual visitors; it is not real
security, since the page source is public.
