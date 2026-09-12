// Loads data.json and renders the downloads list + projects table.
// Edit data.json to update content — no need to touch this file.

async function load() {
  let data;
  try {
    const res = await fetch("data.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.error("Could not load data.json:", err);
    document.getElementById("projects-body").innerHTML =
      `<tr><td colspan="4" class="muted">Could not load data. ` +
      `If you opened this file directly, run it through a local server or GitHub Pages.</td></tr>`;
    return;
  }

  renderDownloads(data.downloads || []);
  renderReports(data.reports || []);
  renderProjects(data.projects || []);
  if (data.updated) {
    document.getElementById("updated").textContent = data.updated;
  }
}

function renderDownloads(downloads) {
  const ul = document.getElementById("downloads-list");
  if (!downloads.length) {
    ul.innerHTML = `<li class="muted">No files available.</li>`;
    return;
  }
  ul.innerHTML = downloads
    .map(
      (d) =>
        `<li><a href="${escapeAttr(encodeURI(d.href))}" ${anchorAttrs(d.href)}>${escapeHtml(d.label)}</a></li>`
    )
    .join("");
}

function renderReports(reports) {
  const ul = document.getElementById("reports-list");
  if (!reports.length) {
    ul.innerHTML = `<li class="muted">No reports available.</li>`;
    return;
  }
  ul.innerHTML = reports
    .map(
      (r) =>
        `<li class="report-item">` +
        `<span class="report-title" dir="auto">${escapeHtml(r.label)}</span>` +
        `<a class="report-link" href="${escapeAttr(encodeURI(r.href))}" ${anchorAttrs(r.href)}>Download PDF</a>` +
        `</li>`
    )
    .join("");
}

// Google Drive/HTTP links open in a new tab; local file paths keep the download attr.
function anchorAttrs(href) {
  return /^https?:\/\//i.test(href || "")
    ? `target="_blank" rel="noopener"`
    : `download`;
}

let allRows = [];

function renderProjects(projects) {
  const body = document.getElementById("projects-body");
  allRows = projects.map((p) => ({
    title: p.title || "",
    department: (p.department || "").trim(),
    supervisor: p.supervisor || "",
    committee: p.committee || "",
  }));

  body.innerHTML = allRows
    .map(
      (p) => `
      <tr>
        <td class="title" data-label="Title" dir="auto">${escapeHtml(p.title)}</td>
        <td data-label="Dept.">${deptBadge(p.department)}</td>
        <td data-label="Supervisor" dir="auto">${escapeHtml(p.supervisor) || dash()}</td>
        <td data-label="Committee" dir="auto">${escapeHtml(p.committee) || dash()}</td>
      </tr>`
    )
    .join("");

  populateDeptFilter();
  setupFilters();
}

function deptBadge(dept) {
  if (!dept) return dash();
  return `<span class="badge">${escapeHtml(dept)}</span>`;
}

function populateDeptFilter() {
  const select = document.getElementById("dept-filter");
  const depts = [...new Set(allRows.map((p) => p.department).filter(Boolean))].sort();
  for (const d of depts) {
    const opt = document.createElement("option");
    opt.value = d.toLowerCase();
    opt.textContent = d;
    select.appendChild(opt);
  }
}

function setupFilters() {
  const search = document.getElementById("search");
  const deptFilter = document.getElementById("dept-filter");
  const rows = Array.from(document.querySelectorAll("#projects-body tr"));
  const emptyState = document.getElementById("empty-state");

  function apply() {
    const q = search.value.trim().toLowerCase();
    const dept = deptFilter.value; // already lowercase
    let visible = 0;
    rows.forEach((tr, i) => {
      const p = allRows[i];
      const hay = `${p.title} ${p.department} ${p.supervisor} ${p.committee}`.toLowerCase();
      const matchesText = !q || hay.includes(q);
      const matchesDept = !dept || p.department.toLowerCase() === dept;
      const show = matchesText && matchesDept;
      tr.hidden = !show;
      if (show) visible++;
    });
    emptyState.hidden = visible !== 0;
  }

  search.addEventListener("input", apply);
  deptFilter.addEventListener("change", apply);
}

function dash() {
  return `<span class="muted">—</span>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

load();
