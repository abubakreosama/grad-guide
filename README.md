# grad-guide

A small static site listing graduation projects (title / supervisor / committee)
with a few downloadable files. No build step.

## Edit content

Everything lives in **`data.json`**:

- `downloads` — buttons that link to files in the `files/` folder or Google Drive
- `reports` — the Past Reports list, same link style as `downloads`
- `projects` — table rows; leave `committee` as `""` and it shows `—`
- `updated` — the date shown in the footer

## Links (local files vs Google Drive)

Any `href` that starts with `http://` or `https://` opens in a new tab —
this is how Google Drive links work today. Local paths like
`files/foo.pdf` keep the browser download behaviour.

To use a Google Drive file: open it in Drive → **Share → Copy link** and paste
it into the `href` field, e.g.:

```json
{
  "label": "دليل التقرير",
  "href": "https://drive.google.com/file/d/1Xwi1unY3aWTHe5zfTbmVRJv31s5J1b_9/view?usp=drive_link"
}
```

The site is now fully Drive-ready: when you switch an entry to a Drive URL,
no other change is needed.

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
