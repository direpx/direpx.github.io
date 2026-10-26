# direpx.github.io

Interactive low-poly Direpx mascot landing page at [direpx.github.io](https://direpx.github.io).

The editable React, Three.js, and Vite project lives in `source/`. The production build is committed at the repository root so GitHub Pages can publish the `main` branch directly.

The static Blog page is in `source/public/blog/`. Its announcement images are numbered `01.webp` through `11.webp` and are lossless copies of the supplied artwork. Update the article in `index.html`; slideshow behavior and layout live in `blog.js` and `blog.css`. It supports swipe, keyboard arrows, Home/End, and a full-screen image viewer without autoplay.

Run `npm ci`, `npm run typecheck`, and `npm run build`, then copy the contents of `dist/` into the repository root before publishing. For local previews of directory routes such as `/blog/`, use `npm run preview`; the Vite development server serves the public page at `/blog/index.html`.
