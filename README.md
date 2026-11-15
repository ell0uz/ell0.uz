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
animated starfield follow the current theme.

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
