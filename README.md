# Portfolio

Plain HTML, CSS and JS. No build step and no dependencies.

## Pages
| File | Page |
| --- | --- |
| `index.html` | Work: intro and project grid |
| `experiments.html` | Experiments: masonry gallery (click to enlarge) |
| `about.html` | About: ticket card, bio, experience, education, "Recently logged" films |
| `work/project-one.html`, `work/project-three.html` | Full case study template |
| `work/project-two.html` | Short template for confidential (NDA) work |

`css/styles.css` holds all styles; colors and type sizes are at the top. `js/main.js` handles the "last updated" date, the ticket swing and the lightbox.

## Filling in content
- Search for `EDIT` and `[brackets]`. Brackets are placeholders.
- **Project taglines:** the line under each project title on the home page (`.work-card__tagline`) fades in on hover and is always shown on touch screens.
- **Images:** put files in `assets/` and replace each placeholder with the `<img>` shown in the comment above it. Write real `alt` text.
- **Email and profiles** are in the footer of every page, and email is also on the About ticket and the confidential case study.
- **Project covers** on the Work page: replace the mock inside `.work-card__cover` with an `<img>`.
- **Adding a project:** copy a `<li>` in `index.html` and a file in `work/`, then update the "Next project" links.

## Preview locally
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000.

## Publish with GitHub Pages
Settings → Pages → Deploy from a branch → `main` / root.
