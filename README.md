# Portfolio

Plain HTML, CSS and JS. No build step and no dependencies.

## Preview locally
Double-click `index.html`, or run a local server from this folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Files
| File | What it is |
| --- | --- |
| `index.html` | Home: hero, selected work, about, contact |
| `work/project-one.html` … `project-three.html` | Case studies (same template) |
| `css/styles.css` | All styles. Colors, fonts and spacing are set at the top under **1. Tokens** |
| `js/main.js` | Draggable hero cards, header, case study contents and lightbox, experience filter, copy email |
| `assets/` | Put your photos, cover images and `resume.pdf` here |

## Filling in content
- Search for `EDIT` to find each spot that needs your content. Anything in `[brackets]` is a placeholder.
- **Your name** appears in the header and footer of every page and in each `<title>`.
- **Email** appears in `index.html` (link, copy button) and in each case study footer.
- **Images:** replace the placeholder block with the `<img>` line shown in the comment above it. Always write real `alt` text, except on decorative covers where `alt=""` is already set.
- **Experience roles:** add or remove `<li class="exp__item">`. Set `data-kind` to `research`, `design` or `research design` so the filter works.
- **Adding a 4th project:** copy a card in `index.html`, copy a case study file in `work/`, and update the "Next project" links so they loop.
- **Project color:** each case study sets `--cover` and `--cover-deep` on `<body>`.

## Publishing
Push this folder to a GitHub repo, then go to Settings → Pages → Deploy from branch → `main` / root. Netlify and Vercel also work: drag and drop the folder.
