# grad-guide

A small static site listing graduation projects (title / supervisor / committee)
with a few downloadable files. No build step.

## Edit content

Everything lives in **`data.json`**:

- `downloads` — buttons that link to files in the `files/` folder
- `projects` — table rows; leave `committee` as `""` and it shows `—`
- `updated` — the date shown in the footer

Drop your actual files into `files/` and make sure the names match the `href`
values in `data.json`.

## Run locally

`fetch()` needs a server (opening `index.html` directly won't load `data.json`):

```sh
python -m http.server 8000
# then open http://localhost:8000
```

## Deploy (GitHub Pages)

1. Push to GitHub.
2. Repo → **Settings → Pages** → Source: **Deploy from a branch** → `main` / root.
3. Visit the published URL.
