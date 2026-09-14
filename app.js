// Loads data.json and renders downloads, past reports and the projects table.
// Edit data.json to update content — no need to touch this file.

const $ = (id) => document.getElementById(id);

const state = {
  projects: [],
  reports: [],
  dept: "", // "" = all
  query: "",
};

/* ---------------- Theme ---------------- */

(function initTheme() {
  const saved = safeGet("grad-guide-theme");
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  const theme = saved || (prefersLight ? "light" : "dark");
  document.documentElement.setAttribute("data-theme", theme);

  document.addEventListener("DOMContentLoaded", () => {
    $("theme-toggle").addEventListener("click", () => {
      const next =
        document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      safeSet("grad-guide-theme", next);
    });
  });
})();

function safeGet(k) {
  try { return localStorage.getItem(k); } catch { return null; }
}
function safeSet(k, v) {
  try { localStorage.setItem(k, v); } catch { /* ignore */ }
}

/* ---------------- Load ---------------- */

async function load() {
  let data;
  try {
    const res = await fetch("data.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.error("Could not load data.json:", err);
    showLoadError();
    return;
  }

  state.projects = (data.projects || []).map((p) => ({
    title: p.title || "",
    department: (p.department || "").trim(),
    supervisor: p.supervisor || "",
    committee: p.committee || "",
  }));
  state.reports = data.reports || [];

  renderDownloads(data.downloads || []);
  renderReports();
  renderDeptChips();
  renderProjects();

  $("stat-projects").textContent = state.projects.length;
  $("stat-reports").textContent = state.reports.length;
  $("stat-files").textContent = (data.downloads || []).length;
  if (data.updated) $("updated").textContent = data.updated;

  wireSearch();
  wireScrollSpy();
  wireToTop();
}

function showLoadError() {
  $("downloads-list").innerHTML =
    `<li class="error-box">Could not load <b>data.json</b>. If you opened this file directly, ` +
    `serve it over a local server (<code>python -m http.server 8000</code>) or GitHub Pages.</li>`;
  $("reports-list").innerHTML = "";
  $("projects-body").innerHTML = "";
}

/* ---------------- Downloads ---------------- */

function renderDownloads(downloads) {
  const ul = $("downloads-list");
  if (!downloads.length) {
    ul.innerHTML = `<li class="muted">No files available.</li>`;
    return;
  }
  ul.innerHTML = downloads
    .map(
      (d) =>
        `<li><a href="${escapeAttr(encodeURI(d.href))}" ${anchorAttrs(d.href)} dir="auto">` +
        `${escapeHtml(d.label)}</a></li>`
    )
    .join("");
}

/* ---------------- Reports ---------------- */

function renderReports() {
  const ul = $("reports-list");
  const empty = $("reports-empty");
  const q = ($("reports-search").value || "").trim().toLowerCase();

  const rows = state.reports
    .map((r, i) => ({ ...r, index: i + 1 }))
    .filter((r) => !q || String(r.label).toLowerCase().includes(q));

  empty.hidden = rows.length !== 0 || state.reports.length === 0;

  if (!state.reports.length) {
    ul.innerHTML = `<li class="muted">No reports available.</li>`;
    return;
  }

  ul.innerHTML = rows
    .map(
      (r) =>
        `<li class="report-item">` +
        `<span class="report-num" aria-hidden="true">${r.index}</span>` +
        `<span class="report-title" dir="auto">${highlight(r.label, q)}</span>` +
        `<a class="report-link" href="${escapeAttr(encodeURI(r.href))}" ${anchorAttrs(r.href)}>` +
        `Open PDF</a></li>`
    )
    .join("");
}

// Google Drive/HTTP links open in a new tab; local file paths keep the download attr.
function anchorAttrs(href) {
  return /^https?:\/\//i.test(href || "")
    ? `target="_blank" rel="noopener"`
    : `download`;
}

/* ---------------- Projects ---------------- */

function renderDeptChips() {
  const wrap = $("dept-filter");
  const counts = new Map();
  for (const p of state.projects) {
    if (p.department) counts.set(p.department, (counts.get(p.department) || 0) + 1);
  }
  const chips = [["", "All", state.projects.length]].concat(
    [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([d, n]) => [d, d, n])
  );

  wrap.innerHTML = chips
    .map(
      ([value, label, n]) =>
        `<button type="button" class="chip" data-dept="${escapeAttr(value)}" ` +
        `aria-pressed="${value === state.dept}">${escapeHtml(label)} <b>${n}</b></button>`
    )
    .join("");

  wrap.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.dept = btn.dataset.dept;
      wrap.querySelectorAll(".chip").forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.dept === state.dept))
      );
      renderProjects();
    });
  });
}

function renderProjects() {
  const body = $("projects-body");
  const q = state.query;
  const dept = state.dept.toLowerCase();

  const rows = state.projects
    .map((p, i) => ({ ...p, index: i + 1 }))
    .filter((p) => {
      const matchesDept = !dept || p.department.toLowerCase() === dept;
      if (!matchesDept) return false;
      if (!q) return true;
      return `${p.title} ${p.department} ${p.supervisor} ${p.committee}`
        .toLowerCase()
        .includes(q);
    });

  body.innerHTML = rows
    .map(
      (p) => `
      <tr>
        <td class="num" data-label="#">${p.index}</td>
        <td class="title" data-label="Title" dir="auto">${highlight(p.title, q)}</td>
        <td data-label="Dept.">${deptBadge(p.department)}</td>
        <td class="people" data-label="Supervisor" dir="auto">${highlight(p.supervisor, q) || dash()}</td>
        <td class="people" data-label="Committee" dir="auto">${highlight(p.committee, q) || dash()}</td>
      </tr>`
    )
    .join("");

  $("empty-state").hidden = rows.length !== 0;
  $("result-count").textContent = `Showing ${rows.length} of ${state.projects.length} projects`;
}

function deptBadge(dept) {
  return dept ? `<span class="badge">${escapeHtml(dept)}</span>` : dash();
}

/* ---------------- Search + chrome ---------------- */

function wireSearch() {
  const search = $("search");
  search.addEventListener("input", debounce(() => {
    state.query = search.value.trim().toLowerCase();
    renderProjects();
  }, 120));

  $("reports-search").addEventListener("input", debounce(renderReports, 120));

  // "/" focuses the projects search, Escape clears the focused field.
  document.addEventListener("keydown", (e) => {
    const typing = /^(input|textarea|select)$/i.test(e.target.tagName);
    if (e.key === "/" && !typing) {
      e.preventDefault();
      search.focus();
    } else if (e.key === "Escape" && typing) {
      e.target.value = "";
      e.target.dispatchEvent(new Event("input"));
    }
  });
}

function wireScrollSpy() {
  const links = Array.from(document.querySelectorAll(".nav-links a"));
  const sections = links
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) =>
          a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`)
        );
      });
    },
    { rootMargin: "-72px 0px -60% 0px", threshold: 0 }
  );
  sections.forEach((s) => observer.observe(s));
}

function wireToTop() {
  const btn = $("to-top");
  const onScroll = () => { btn.hidden = window.scrollY < 500; };
  window.addEventListener("scroll", onScroll, { passive: true });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  onScroll();
}

/* ---------------- Helpers ---------------- */

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// Escapes first, then wraps query matches in <mark>.
function highlight(text, q) {
  const safe = escapeHtml(text);
  if (!q) return safe;
  const re = new RegExp(escapeRegex(escapeHtml(q)), "gi");
  return safe.replace(re, (m) => `<mark>${m}</mark>`);
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
