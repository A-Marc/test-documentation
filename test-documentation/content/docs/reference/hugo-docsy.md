---
title: 4.5. Docsy Documentation
linkTitle: 4.5. Docsy Documentation
weight: 5
description: Hugo + Docsy setup, project structure, content authoring, and useful commands for this documentation site
---

# Hugo Docsy Documentation Guide

## Overview

This documentation site is built with [Hugo](https://gohugo.io/) using the [Docsy](https://www.docsy.dev/) theme, a Hugo theme designed for technical documentation.

## Local Development

Start the local server:

```bash
cd documentation
hugo server
```

Then open **http://localhost:1313/** in your browser. The site live-reloads on file changes.

## Project Structure

| Path | Purpose |
|---|---|
| `hugo.yaml` | Site configuration (title, theme, menus) |
| `content/docs/` | Documentation pages (Markdown) |
| `content/docs/<section>/_index.md` | Content|
| `static/` | Static assets (images, files) |
| `layouts/` | Custom layout overrides |

## Writing Content

Each page starts with a **front matter** block:

```yaml
---
title: Page Title
weight: 10
---
```

- `title` — displayed heading and sidebar label
- `weight` — controls ordering within a section (lower = higher)

## Key Docsy Features

- **Left sidebar navigation** — auto-generated from the `content/` folder hierarchy
- **Shortcodes** — reusable components (`alert`, `tabpane`, `cardpane`, etc.)
- **Versioning & multi-language** support built-in
- **Search** via Lunr.js or Algolia

## Landing Page

The `landing/` folder contains a vibecoded React app (Vite + React + Tailwind + shadcn) that serves as the project's landing page.

To rebuild and update the landing page:

```bash
cd documentation/landing
npm run build
```

Then copy everything from `dist/` **except** `index.html` into `documentation/static/`:

```bash
cp -r dist/assets dist/*.svg dist/*.png ../static/
```

The `dist/index.html` file requires special handling: it must be adapted into `documentation/layouts/index.html` with Hugo `relURL` template functions so that asset paths resolve correctly (e.g. `src="{{ "assets/index-xxx.js" | relURL }}"`). This file only needs updating when the Vite build produces new hashed filenames.

Finally, build the Hugo site:

```bash
cd documentation
hugo
```

The landing page is now served as the Hugo homepage, while the documentation lives under `/docs/`.

## Useful Commands

| Command | Description |
|---|---|
| `hugo server` | Run dev server on localhost:1313 |
| `hugo server -D` | Include draft pages |
| `hugo` | Build static site to `public/` |
| `hugo new docs/section/page.md` | Scaffold a new page |
