# ell0.uz

The source for [ell0.uz](https://ell0.uz), a personal site and portfolio.

## About

This is a small static website with no build step. `index.html` contains the page structure, styles
are split into focused files in `css/`, and interactive behavior lives in `js/`. The saved theme is
restored inline in `index.html` to avoid a flash before styles load. UI icons use Material Symbols
Rounded from Google Fonts. The site's text fonts, favicon, and social preview image are stored
alongside the page.

The header theme switch remembers the selected dark or light theme. The site uses Material
3-inspired tonal surfaces, with its aqua scroll palette active only in light mode. The scrollbar and
animated starfield follow the current theme. Once a content card is in view, the page background is
tinted by its accent in either theme; dark mode keeps that tint subdued.

## Adding a content section

`index.html` contains a reusable starter inside `<template id="content-section-template">`. Copy its
`<section>` alongside the About section when adding a section, then give it a unique `id` and heading
ID. The template is inert and does not appear on the page.

Choose a section layout with one of these classes:

- `content-section--right`: align the card to the right.
- `content-section--center`: center the card in the viewport.
- `content-section--bottom`: align the card to the bottom (used by About).
- `content-section--bottom-right`: align the card to the bottom-right.
- `content-section--fullscreen`: fill the available viewport area with the card.

Cards default to the left. Add `content-card--narrow` or `content-card--wide` to change the width,
and `content-card--centered` to center the card's contents. Set per-card colors using CSS custom
properties, for example `style="--content-card-accent: #a78bfa; --content-card-surface: #20272a"`.
Use `<span class="accent">...</span>` in a `.content-title` to highlight part of the heading in that
accent. Project or other repeatable items can use `.content-grid` and `.content-tile`.

## Preview

Open `index.html` in a browser, or serve this directory with any static file server.

## Formatting

The repository includes a Prettier configuration. Check or format the HTML, CSS, and JavaScript with:

```sh
npx prettier --check index.html "css/**/*.css" "js/**/*.js"
npx prettier --write index.html "css/**/*.css" "js/**/*.js"
```

## License

This project is available under the MIT License. See [LICENSE](./LICENSE).
