# ell0.uz

The source for [ell0.uz](https://ell0.uz), a personal site and portfolio.

## About

This is a small, dependency-free static website. `index.html` contains the page structure, styles are
split into focused files in `css/`, and interactive behavior lives in `js/`. Fonts, the favicon, and
the social preview image are stored alongside the page.

The header theme switch remembers the selected dark or light theme. The aqua scroll palette is used
only in light mode, and the scrollbar is styled to match the active palette.

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
