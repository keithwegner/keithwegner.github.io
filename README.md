# keithwegner.github.io

Personal website for Keith Wegner, built as a static GitHub Pages site.

Live site: https://keithwegner.github.io

## Overview

This site is a minimalist personal homepage with a four-section layout, animated canvas background, timeline section, and links to GitHub, LinkedIn, and Bestgate Engineering.

## Tech Stack

- Jekyll / GitHub Pages
- HTML
- SCSS
- Vanilla JavaScript canvas animation

## Local Development

Install Jekyll if needed:

```sh
gem install jekyll webrick
```

Run the site locally:

```sh
jekyll serve
```

Then open:

```txt
http://127.0.0.1:4000/
```

## Deployment

This is a GitHub Pages user site. Changes pushed to `master` are published at:

```txt
https://keithwegner.github.io
```

GitHub Pages may take a minute or two to rebuild after a push.

## Project Structure

- `index.html` - homepage content
- `style.scss` - site styling
- `living-grid.js` - animated background
- `_layouts/default.html` - shared page shell
- `_includes/meta.html` - metadata tags

## Notes

The site intentionally avoids external frontend dependencies and keeps the animation self-contained.
