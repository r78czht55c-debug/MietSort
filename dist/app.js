const phases = [
  { id: "inquiry", label: "Anfrage", short: "Kontakt & Termin" },
  { id: "viewing", label: "Besichtigung", short: "Termin organisieren" },
  { id: "interest", label: "Konkretes Interesse", short: "Sachliche Angaben" },
  { id: "selection", label: "Vorauswahl", short: "Nachweise prüfen" },
  { id: "decision", label: "Abschluss", short: "Vertrag oder Absage" }
];

const defaultSettings = {
  warmRent: 1150,
  extraCosts: 0,
  moveInStart: "2027-01-01",
  moveInEnd: "2027-01-15",
  alternativeEnd: "2027-02-01",
  occupancyMax: 2,
  applicationDeadline: "2026-12-02",
  replyDays: 3,
  wbsRequired: false,
  petRelevant: true
};

const sampleApplications = [
  {
    id: 1, name: "Anna Weber", email: "anna.weber@beispiel.de", people: 1,
    moveIn: "2027-01-01", income: "3.500–4.499 €", pets: "Keine",
    message: "Ich arbeite unbefristet als Physiotherapeutin in Neukölln und suche langfristig eine ruhige Wohnung.",
    created: "2026-11-24T07:24:00", phase: "interest", shortlist: false,
    replyDue: "2026-11-27", deleteReview: "2027-05-24", note: ""
  },
  {
    id: 2, name: "Jonas & Lea", email: "jonas.lea@beispiel.de", people: 2,
    moveIn: "2027-01-01", income: "4.500–5.499 €", pets: "Katze",
    message: "Wir wohnen bereits im Kiez und möchten uns gern vergrößern. Unsere Wohnungskatze ist sieben Jahre alt.",
    created: "2026-11-23T16:12:00", phase: "selection", shortlist: true,
    replyDue: "2026-11-26", deleteReview: "2027-05-23", note: "Nachweis erst bei Erstwahl prüfen."
  },
  {
    id: 3, name: "Mehmet Kaya", email: "mehmet.kaya@beispiel.de", people: 2,
    moveIn: "2027-02-01", income: "", pets: "Keine",
    message: "Meine Tochter und ich suchen eine Wohnung in der Nähe ihrer Schule.",
    created: "2026-11-23T13:43:00", phase: "interest", shortlist: false,
    replyDue: "2026-11-25", deleteReview: "2027-05-23", note: ""
  },
  {
    id: 4, name: "Sophie Brandt", email: "sophie.brandt@beispiel.de", people: null,
    moveIn: "", income: "", pets: "", appointment: "Samstag, 28.11. · 10:00 Uhr",
    message: "", created: "2026-11-24T06:07:00", phase: "inquiry", shortlist: false,
    replyDue: "2026-11-26", deleteReview: "2027-05-24", note: ""
  },
  {
    id: 5, name: "Lukas Neumann", email: "lukas.n@beispiel.de", people: null,
    moveIn: "", income: "", pets: "", appointment: "Samstag, 28.11. · 12:00 Uhr",
    message: "", created: "2026-11-22T12:31:00", phase: "viewing", shortlist: false,
    replyDue: "2026-11-24", deleteReview: "2027-05-22", note: "Termin noch nicht bestätigt."
  },
  {
    id: 6, name: "Mara Hoffmann", email: "mara.h@beispiel.de", people: 1,
    moveIn: "2027-03-01", income: "2.500–3.499 €", pets: "Keine",
    message: "Ein früherer Einzug wäre eventuell möglich, müsste ich aber noch abstimmen.",
    created: "2026-11-21T17:20:00", phase: "interest", shortlist: false,
    replyDue: "2026-11-28", deleteReview: "2027-05-21", note: ""
  },
  {
    id: 7, name: "David Krüger", email: "david.k@beispiel.de", people: 1,
    moveIn: "2027-01-10", income: "ab 5.500 €", pets: "Keine",
    message: "Die Lage passt sehr gut zu meinem Arbeitsweg.",
    created: "2026-11-20T11:14:00", phase: "decision", shortlist: true,
    replyDue: "2026-11-25", deleteReview: "2026-11-24", note: "Vertragsentwurf vorbereiten."
  }
];

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const appStorageKey = "mietsort-applications-v2";
const settingsStorageKey = "mietsort-settings-v2";
const tenantStorageKey = "mietsort-tenant-v1";

const defaultTenantState = {
  profile: {
    name: "Anna Weber", email: "anna.weber@beispiel.de", people: 1,
    moveIn: "2027-01-01", income: "3.500–4.499 €", pets: "Keine",
    message: "Ich arbeite unbefristet als Physiotherapeutin in Neukölln und suche langfristig eine ruhige Wohnung."
  },
  viewingConfirmed: false,
  interestConfirmed: false,
  documentShared: true,
  documents: [
    { id: 1, name: "Einkommensnachweis", detail: "Prüfergebnis vorbereitet · gültig bis 31.01.2027", status: "Bereit" },
    { id: 2, name: "Mietschuldenfreiheit", detail: "Noch nicht hinterlegt", status: "Offen" }
  ]
};

let tenantState = { ...defaultTenantState, ...(JSON.parse(localStorage.getItem(tenantStorageKey) || "null") || {}) };
tenantState.profile = { ...defaultTenantState.profile, ...(tenantState.profile || {}) };
tenantState.documents = tenantState.documents || defaultTenantState.documents;

let tenantApplications = [
  { id: "sonnenallee", address: "Sonnenallee 142", area: "Berlin-Neukölln", facts: "58 m² · 1.150 € warm", phase: "viewing", deadline: "2026-11-25", next: "Besichtigungstermin bestätigen", image: "sun" },
  { id: "hafenstrasse", address: "Hafenstraße 8", area: "Berlin-Mitte", facts: "64 m² · 1.290 € warm", phase: "interest", deadline: "2026-11-29", next: "Rückmeldung abwarten", image: "harbor" },
  { id: "parkweg", address: "Parkweg 21", area: "Berlin-Tempelhof", facts: "52 m² · 980 € warm", phase: "selection", deadline: "2026-11-28", next: "Nachweisfreigabe prüfen", image: "park" }
];

let settings = { ...defaultSettings, ...(JSON.parse(localStorage.getItem(settingsStorageKey) || "null") || {}) };
let applications = loadApplications();
let currentPhase = "all";
let currentSelected = null;
let currentRole = localStorage.getItem("mietsort-role") || "landlord";

function saveTenantState() {
  localStorage.setItem(tenantStorageKey, JSON.stringify(tenantState));
}

function loadApplications() {
  const current = localStorage.getItem(appStorageKey);
  if (current) return JSON.parse(current);

  const legacy = localStorage.getItem("mietsort-applications");
  if (legacy) {
    try {
      return JSON.parse(legacy).map(item => ({
        ...item,
        phase: item.status === "shortlist" ? "selection" : "interest",
        shortlist: item.status === "shortlist",
        replyDue: addDays(dateOnly(item.created), 3),
        deleteReview: addDays(dateOnly(item.created), 180),
        note: ""
      }));
    } catch {
      return sampleApplications;
    }
  }
  return sampleApplications;
}

function saveApplications() {
  localStorage.setItem(appStorageKey, JSON.stringify(applications));
}

function saveSettings() {
  localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
}

function dateOnly(value = new Date()) {
  const d = new Date(value);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + Number(days));
  return dateOnly(d);
}

function daysUntil(date) {
  if (!date) return 9999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${date}T00:00:00`);
  return Math.round((target - today) / 86400000);
}

function initials(name) {
  return name.split(/\s|&/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

function formatDate(date, options = {}) {
  if (!date) return "offen";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit", month: "2-digit", year: options.short ? "2-digit" : "numeric"
  }).format(new Date(`${date}T12:00:00`));
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) +
    " · " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function money(value) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[char]));
}

function phaseOf(app) {
  return phases.find(phase => phase.id === app.phase) || phases[0];
}

function phaseIndex(phaseId) {
  return phases.findIndex(phase => phase.id === phaseId);
}

function incomeBounds(income) {
  const map = {
    "2.500–3.499 €": [2500, 3499],
    "3.500–4.499 €": [3500, 4499],
    "4.500–5.499 €": [4500, 5499],
    "ab 5.500 €": [5500, null]
  };
  return map[income] || null;
}

function rentRatio(app) {
  const bounds = incomeBounds(app.income);
  if (!bounds) return null;
  const totalRent = Number(settings.warmRent) + Number(settings.extraCosts || 0);
  const high = totalRent / bounds[0] * 100;
  if (bounds[1] === null) {
    return { low: 0, high, label: `≤ ${Math.ceil(high)} %` };
  }
  const low = totalRent / bounds[1] * 100;
  return { low, high, label: `${Math.floor(low)}–${Math.ceil(high)} %` };
}

function moveInAssessment(app) {
  if (!app.moveIn) return { type: "missing", label: "Einzugstermin offen" };
  if (app.moveIn >= settings.moveInStart && app.moveIn <= settings.moveInEnd) {
    return { type: "fit", label: "Einzug im Zeitfenster" };
  }
  if (settings.alternativeEnd && app.moveIn > settings.moveInEnd && app.moveIn <= settings.alternativeEnd) {
    return { type: "check", label: "Einzug im Ausweichzeitraum" };
  }
  return { type: "check", label: "Einzug außerhalb Zeitfenster" };
}

function criteriaFor(app) {
  if (phaseIndex(app.phase) < phaseIndex("interest")) {
    return [
      { type: "missing", label: "Sachliche Angaben erst nach Besichtigung" }
    ];
  }

  const ratio = rentRatio(app);
  const result = [
    moveInAssessment(app),
    app.people
      ? { type: app.people <= settings.occupancyMax ? "fit" : "check", label: app.people <= settings.occupancyMax ? "Belegung passt" : "Belegung prüfen" }
      : { type: "missing", label: "Belegung offen" },
    ratio
      ? { type: ratio.high <= 33.34 ? "fit" : "check", label: `Warmmietanteil ca. ${ratio.label}` }
      : { type: "missing", label: "Einkommensstufe offen" }
  ];

  if (settings.petRelevant) {
    if (!app.pets) result.push({ type: "missing", label: "Tierhaltung offen" });
    else if (app.pets === "Keine" || app.pets === "Kleintiere") result.push({ type: "fit", label: app.pets === "Keine" ? "Keine Tierhaltung" : "Kleintiere" });
    else result.push({ type: "check", label: "Tierhaltung prüfen" });
  }

  if (settings.wbsRequired) {
    result.push({ type: app.wbs ? "fit" : "missing", label: app.wbs ? "WBS angegeben" : "WBS klären" });
  }
  return result;
}

function isComplete(app) {
  if (phaseIndex(app.phase) < phaseIndex("interest")) return Boolean(app.name && app.email);
  return Boolean(app.people && app.moveIn && app.income && app.pets);
}

function nextAction(app) {
  if (app.phase === "inquiry") return "Besichtigung anbieten";
  if (app.phase === "viewing") return "Termin bestätigen oder abschließen";
  if (app.phase === "interest" && !app.income) return "Einkommensstufe erfragen";
  if (app.phase === "interest" && !isComplete(app)) return "Offene Angaben klären";
  if (app.phase === "interest") return "Sachliche Kriterien prüfen";
  if (app.phase === "selection") return "Erforderliche Nachweise prüfen";
  return app.note || "Vertrag oder Absage abschließen";
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  window.setTimeout(() => element.classList.remove("show"), 2600);
}

function renderStats() {
  const due = applications.filter(app => daysUntil(app.replyDue) >= 0 && daysUntil(app.replyDue) <= 3).length;
  const deletion = applications.filter(app => daysUntil(app.deleteReview) <= 0).length;
  $("#statTotal").textContent = applications.length;
  $("#statNew").textContent = `${applications.filter(app => app.phase === "inquiry").length} neue Anfragen`;
  $("#statDue").textContent = due;
  $("#statSelection").textContent = applications.filter(app => app.phase === "selection").length;
  $("#statDelete").textContent = deletion;
  $("#navCount").textContent = applications.length;
}

function renderDashboardPipeline() {
  $("#dashboardPipeline").innerHTML = phases.map(phase => {
    const count = applications.filter(app => app.phase === phase.id).length;
    return `<div class="pipeline-step"><span>${escapeHtml(phase.label)}</span><b>${count}</b><small>${escapeHtml(phase.short)}</small></div>`;
  }).join("");
}

function renderRecent() {
  const ordered = applications.slice().sort((a, b) => {
    const aDue = daysUntil(a.replyDue);
    const bDue = daysUntil(b.replyDue);
    return aDue - bDue || phaseIndex(b.phase) - phaseIndex(a.phase);
  }).slice(0, 5);

  $("#recentApplications").innerHTML = ordered.map(app => `
    <div class="recent-item" data-open-app="${app.id}">
      <span class="applicant-avatar">${initials(app.name)}</span>
      <div>
        <h3>${escapeHtml(app.name)}</h3>
        <p>${escapeHtml(phaseOf(app).label)} · Frist ${formatDate(app.replyDue, { short: true })}</p>
      </div>
      <div class="next-action-mini"><b>${escapeHtml(nextAction(app))}</b><small>Nächster Schritt</small></div>
    </div>
  `).join("");

  $$("[data-open-app]").forEach(item => {
    item.addEventListener("click", () => {
      switchView("applications");
      selectApplication(Number(item.dataset.openApp));
    });
  });
}

function renderProperty() {
  $("#propertyRent").textContent = money(Number(settings.warmRent) + Number(settings.extraCosts || 0));
  $("#propertyMoveIn").textContent = formatDate(settings.moveInStart, { short: true });
  $("#propertyWindow").textContent = `${formatDate(settings.moveInStart, { short: true })}–${formatDate(settings.moveInEnd, { short: true })}`;
  $("#propertyOccupancy").textContent = `max. ${settings.occupancyMax} Personen`;
}

function renderPhaseFilters() {
  const items = [{ id: "all", label: "Alle" }, ...phases];
  $("#phaseFilters").innerHTML = items.map(item => {
    const count = item.id === "all" ? applications.length : applications.filter(app => app.phase === item.id).length;
    return `<button class="${currentPhase === item.id ? "active" : ""}" data-phase-filter="${item.id}"><span>${count}</span>${escapeHtml(item.label)}</button>`;
  }).join("");
  $$("[data-phase-filter]").forEach(button => button.addEventListener("click", () => {
    currentPhase = button.dataset.phaseFilter;
    renderPhaseFilters();
    renderApplications();
  }));
}

function filteredApplications() {
  const query = ($("#searchInput")?.value || "").toLowerCase();
  const status = $("#statusFilter")?.value || "all";
  const sort = $("#sortSelect")?.value || "next";

  let list = applications.filter(app => (app.name + " " + (app.message || "")).toLowerCase().includes(query));
  if (currentPhase !== "all") list = list.filter(app => app.phase === currentPhase);
  if (status === "due") list = list.filter(app => daysUntil(app.replyDue) <= 3);
  if (status === "incomplete") list = list.filter(app => !isComplete(app));
  if (status === "shortlist") list = list.filter(app => app.shortlist);

  if (sort === "next") list.sort((a, b) => daysUntil(a.replyDue) - daysUntil(b.replyDue) || phaseIndex(b.phase) - phaseIndex(a.phase));
  if (sort === "newest") list.sort((a, b) => new Date(b.created) - new Date(a.created));
  if (sort === "deadline") list.sort((a, b) => String(a.replyDue).localeCompare(String(b.replyDue)));
  if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "de"));
  return list;
}

function renderApplications() {
  const list = filteredApplications();
  $("#resultCount").textContent = `${list.length} ${list.length === 1 ? "Bewerbung" : "Bewerbungen"}`;
  $("#applicationList").innerHTML = list.length ? list.map(app => {
    const due = daysUntil(app.replyDue);
    return `
      <article class="application-card ${currentSelected === app.id ? "selected" : ""}" data-id="${app.id}">
        <span class="applicant-avatar">${initials(app.name)}</span>
        <div>
          <div class="card-title">
            <h3>${escapeHtml(app.name)}</h3>
            <span class="badge phase">${escapeHtml(phaseOf(app).label)}</span>
            ${due <= 3 ? '<span class="badge due">Frist</span>' : ""}
            ${app.shortlist ? '<span class="badge shortlist">Vorgemerkt</span>' : ""}
          </div>
          <div class="card-meta">
            <span>${app.people ? `${app.people} ${app.people === 1 ? "Person" : "Personen"}` : "Belegung noch offen"}</span>
            <span>Einzug ${app.moveIn ? formatDate(app.moveIn) : "noch offen"}</span>
            <span>Frist ${formatDate(app.replyDue)}</span>
          </div>
          <div class="criteria-row">${criteriaFor(app).slice(0, 4).map(item => `<span class="criterion ${item.type}">${escapeHtml(item.label)}</span>`).join("")}</div>
        </div>
        <div class="card-side">
          <time>${formatDateTime(app.created)}</time>
          <span class="card-next">${escapeHtml(nextAction(app))}</span>
          <button class="star ${app.shortlist ? "active" : ""}" data-star="${app.id}" aria-label="Vormerken">★</button>
        </div>
      </article>
    `;
  }).join("") : '<div class="empty-detail panel"><h3>Keine Treffer</h3><p>Ändere den Filter oder den Suchbegriff.</p></div>';

  $$(".application-card").forEach(card => card.addEventListener("click", event => {
    if (event.target.closest("[data-star]")) return;
    selectApplication(Number(card.dataset.id));
  }));
  $$("[data-star]").forEach(button => button.addEventListener("click", () => toggleShortlist(Number(button.dataset.star))));
}

function selectApplication(id) {
  currentSelected = id;
  const app = applications.find(item => item.id === id);
  if (!app) return;
  const ratio = rentRatio(app);
  const criteria = criteriaFor(app);

  $("#detailPanel").innerHTML = `
    <div class="detail-content">
      <div class="detail-head">
        <span class="applicant-avatar">${initials(app.name)}</span>
        <div><h2>${escapeHtml(app.name)}</h2><p>Eingegangen ${formatDateTime(app.created)}</p></div>
        <button class="detail-close" aria-label="Schließen">×</button>
      </div>

      <div class="phase-editor">
        <label>Aktuelle Phase
          <select id="detailPhase">${phases.map(phase => `<option value="${phase.id}" ${phase.id === app.phase ? "selected" : ""}>${escapeHtml(phase.label)}</option>`).join("")}</select>
        </label>
        <div class="next-step-box"><span>Nächster Schritt</span><b>${escapeHtml(nextAction(app))}</b></div>
      </div>

      <section class="detail-section">
        <h3>Sachliche Angaben</h3>
        <div class="detail-facts">
          <span>Personen<b>${app.people || "Noch offen"}</b></span>
          <span>Einzug<b>${app.moveIn ? formatDate(app.moveIn) : "Noch offen"}</b></span>
          <span>Einkommensstufe<b>${escapeHtml(app.income || "Noch offen")}</b></span>
          <span>Warmmietanteil<b>${ratio ? `ca. ${ratio.label}` : "Nicht berechenbar"}</b></span>
          <span>Tierhaltung<b>${escapeHtml(app.pets || "Noch offen")}</b></span>
          <span>Termin<b>${escapeHtml(app.appointment || "Nicht eingetragen")}</b></span>
        </div>
      </section>

      <section class="detail-section">
        <h3>Nachvollziehbare Hinweise</h3>
        <div class="hint-list">${criteria.map(item => `<div class="hint ${item.type}"><span>${item.type === "fit" ? "✓" : item.type === "check" ? "!" : "–"}</span>${escapeHtml(item.label)}</div>`).join("")}</div>
      </section>

      ${app.message ? `<section class="detail-section"><h3>Nachricht</h3><div class="message-box">${escapeHtml(app.message)}</div></section>` : ""}

      <section class="detail-section">
        <h3>Fristen & Löschung</h3>
        <div class="date-controls">
          <label>Rückmeldung bis<input id="detailReplyDue" type="date" value="${app.replyDue || ""}"></label>
          <label>Löschung prüfen<input id="detailDeleteReview" type="date" value="${app.deleteReview || ""}"></label>
        </div>
      </section>

      <section class="detail-section">
        <h3>Entscheidungsvermerk</h3>
        <input id="detailNote" value="${escapeHtml(app.note || "")}" placeholder="Kurz und sachlich dokumentieren">
      </section>

      <div class="detail-actions">
        <button class="button ${app.shortlist ? "primary" : "secondary"}" id="shortlistBtn">★ ${app.shortlist ? "Vorgemerkt" : "Vormerken"}</button>
        <button class="button secondary" id="saveDetailBtn">Änderungen speichern</button>
        <button class="button dark full-row" id="openTemplatesBtn">Nachricht vorbereiten</button>
      </div>
    </div>
  `;

  $(".detail-close").addEventListener("click", closeDetail);
  $("#detailPhase").addEventListener("change", event => {
    app.phase = event.target.value;
    app.replyDue = addDays(dateOnly(), settings.replyDays);
    saveApplications();
    renderAll();
    selectApplication(id);
    toast("Bewerbungsphase aktualisiert");
  });
  $("#shortlistBtn").addEventListener("click", () => toggleShortlist(id));
  $("#saveDetailBtn").addEventListener("click", () => {
    app.replyDue = $("#detailReplyDue").value;
    app.deleteReview = $("#detailDeleteReview").value;
    app.note = $("#detailNote").value.trim();
    saveApplications();
    renderAll();
    selectApplication(id);
    toast("Fristen und Vermerk gespeichert");
  });
  $("#openTemplatesBtn").addEventListener("click", () => {
    switchView("templates");
    $("#templateApplicant").value = String(id);
    renderTemplates();
  });
  renderApplications();
}

function closeDetail() {
  currentSelected = null;
  $("#detailPanel").innerHTML = '<div class="empty-detail"><span>☷</span><h3>Bewerbung auswählen</h3><p>Klicke links auf einen Eintrag, um Phase, Angaben, Fristen und den nächsten Schritt zu bearbeiten.</p></div>';
  renderApplications();
}

function toggleShortlist(id) {
  const app = applications.find(item => item.id === id);
  app.shortlist = !app.shortlist;
  if (app.shortlist && phaseIndex(app.phase) < phaseIndex("selection")) app.phase = "selection";
  saveApplications();
  renderAll();
  if (currentSelected === id) selectApplication(id);
  toast(app.shortlist ? "Bewerbung vorgemerkt" : "Vormerkung entfernt");
}

function renderProcessBoard() {
  $("#processBoard").innerHTML = phases.map(phase => {
    const items = applications.filter(app => app.phase === phase.id);
    return `
      <div class="process-column">
        <div class="process-column-head"><div><b>${escapeHtml(phase.label)}</b><small>${escapeHtml(phase.short)}</small></div><span>${items.length}</span></div>
        ${items.map(app => `<div class="process-card" data-process-app="${app.id}"><strong>${escapeHtml(app.name)}</strong><small>${escapeHtml(nextAction(app))}</small></div>`).join("")}
      </div>
    `;
  }).join("");
  $$("[data-process-app]").forEach(card => card.addEventListener("click", () => {
    switchView("applications");
    selectApplication(Number(card.dataset.processApp));
  }));
}

function populateCriteriaForm() {
  const form = $("#criteriaForm");
  Object.entries(settings).forEach(([key, value]) => {
    const field = form.elements[key];
    if (!field) return;
    if (field.type === "checkbox") field.checked = Boolean(value);
    else field.value = value;
  });
}

const templateDefinitions = [
  {
    id: "invite", title: "Einladung zur Besichtigung", tag: "Anfrage",
    build: app => `Guten Tag ${app.name},\n\nvielen Dank für Ihre Anfrage zur Wohnung in der Sonnenallee 142. Ich kann Ihnen eine Besichtigung am Samstag, 28.11., um 10:00 Uhr oder um 12:00 Uhr anbieten. Welcher Termin passt Ihnen? Bitte bestätigen Sie ihn innerhalb der nächsten drei Tage.\n\nFür die Besichtigung brauchen Sie keine Bewerbungsunterlagen mitzubringen.\n\nFreundliche Grüße\nEric Kriedemann`
  },
  {
    id: "reminder", title: "Erinnerung nach Termin", tag: "Besichtigung",
    build: app => `Guten Tag ${app.name},\n\nwir hatten einen Besichtigungstermin für die Wohnung in der Sonnenallee 142. Falls Sie weiterhin Interesse haben, melden Sie sich bitte innerhalb der nächsten drei Tage. Dann schaue ich, ob ich Ihnen einen Ersatztermin anbieten kann.\n\nFreundliche Grüße\nEric Kriedemann`
  },
  {
    id: "missing", title: "Offene Angaben klären", tag: "Interesse",
    build: app => `Guten Tag ${app.name},\n\nvielen Dank für Ihr konkretes Interesse an der Wohnung. Für die weitere sachliche Prüfung fehlt mir noch folgende Angabe: [Angabe ergänzen]. Bitte senden Sie mir die Information bis zum ${formatDate(app.replyDue)}. Noch sind keine Dokumente erforderlich.\n\nFreundliche Grüße\nEric Kriedemann`
  },
  {
    id: "selection", title: "Nachweis bei Erstwahl", tag: "Vorauswahl",
    build: app => `Guten Tag ${app.name},\n\nich möchte Ihre Bewerbung für die Wohnung gern weiter berücksichtigen. Für die abschließende Prüfung benötige ich bis zum ${formatDate(app.replyDue)} noch [konkret erforderlicher Nachweis]. Nicht benötigte Angaben können Sie schwärzen. Bitte nutzen Sie dafür einen geschützten Übermittlungsweg.\n\nFreundliche Grüße\nEric Kriedemann`
  },
  {
    id: "accept", title: "Zusage nach Prüfung", tag: "Abschluss",
    build: app => `Guten Tag ${app.name},\n\nich möchte die Wohnung in der Sonnenallee 142 gerne an Sie vermieten. Als Mietbeginn haben wir den ${app.moveIn ? formatDate(app.moveIn) : "[Datum]"} besprochen. Ich sende Ihnen den Vertragsentwurf zur Durchsicht und schlage [Termin] für die Unterzeichnung vor. Passt Ihnen das?\n\nFreundliche Grüße\nEric Kriedemann`
  },
  {
    id: "decline", title: "Neutrale Absage", tag: "Abschluss",
    build: app => `Guten Tag ${app.name},\n\nvielen Dank für Ihr Interesse an der Wohnung und für Ihre Zeit. Ich habe mich bei der Vergabe für eine andere Bewerbung entschieden. Ich wünsche Ihnen für Ihre weitere Wohnungssuche alles Gute.\n\nFreundliche Grüße\nEric Kriedemann`
  }
];

function renderTemplateApplicantOptions() {
  const currentValue = $("#templateApplicant").value;
  $("#templateApplicant").innerHTML = applications.map(app => `<option value="${app.id}">${escapeHtml(app.name)}</option>`).join("");
  if (applications.some(app => String(app.id) === currentValue)) $("#templateApplicant").value = currentValue;
}

function renderTemplates() {
  const applicantId = Number($("#templateApplicant").value) || applications[0]?.id;
  const app = applications.find(item => item.id === applicantId) || applications[0];
  if (!app) return;
  $("#templateGrid").innerHTML = templateDefinitions.map(template => {
    const text = template.build(app);
    return `
      <article class="template-card">
        <header><h2>${escapeHtml(template.title)}</h2><span class="template-tag">${escapeHtml(template.tag)}</span></header>
        <div class="template-text">${escapeHtml(text)}</div>
        <button class="button secondary" data-copy-template="${template.id}">Text kopieren</button>
      </article>
    `;
  }).join("");
  $$("[data-copy-template]").forEach(button => button.addEventListener("click", async () => {
    const template = templateDefinitions.find(item => item.id === button.dataset.copyTemplate);
    const text = template.build(app);
    try {
      await navigator.clipboard.writeText(text);
      toast("Nachricht kopiert");
    } catch {
      toast("Kopieren ist in dieser Vorschau nicht verfügbar");
    }
  }));
}

function tenantPhase(app) {
  return phases.find(item => item.id === app.phase) || phases[0];
}

function tenantNextAction(app) {
  if (app.id === "sonnenallee" && tenantState.viewingConfirmed) return "Termin bestätigt – Besichtigung vorbereiten";
  if (app.id === "parkweg" && !tenantState.documentShared) return "Nachweisfreigabe erneut prüfen";
  return app.next;
}

function tenantTimeline(app) {
  const activeIndex = Math.max(0, phaseIndex(app.phase));
  return `<div class="tenant-timeline">${phases.map((phase, index) => `
    <div class="${index < activeIndex ? "done" : index === activeIndex ? "active" : ""}">
      <span>${index < activeIndex ? "✓" : index + 1}</span><small>${escapeHtml(phase.label)}</small>
    </div>`).join("")}</div>`;
}

function tenantApplicationCard(app, compact = false) {
  const due = daysUntil(app.deadline);
  return `<article class="panel tenant-application-card ${compact ? "compact" : ""}">
    <div class="tenant-property-thumb ${app.image}"></div>
    <div class="tenant-application-main">
      <div class="tenant-card-head"><div><span class="eyebrow">${escapeHtml(app.area)}</span><h2>${escapeHtml(app.address)}</h2><p>${escapeHtml(app.facts)}</p></div><span class="badge phase">${escapeHtml(tenantPhase(app).label)}</span></div>
      ${compact ? "" : tenantTimeline(app)}
      <div class="tenant-next-row"><div><small>Nächster Schritt</small><b>${escapeHtml(tenantNextAction(app))}</b></div><div><small>Frist</small><b class="${due <= 2 ? "deadline-urgent" : ""}">${formatDate(app.deadline)}</b></div></div>
      ${compact ? "" : `<div class="inline-actions">${app.id === "sonnenallee" && !tenantState.viewingConfirmed ? '<button class="button primary" data-tenant-action="confirm-viewing">Termin bestätigen</button>' : ""}${app.id === "hafenstrasse" && !tenantState.interestConfirmed ? '<button class="button primary" data-tenant-action="confirm-interest">Interesse bestätigen</button>' : ""}${app.id === "parkweg" ? '<button class="button secondary" data-view="tenantDocuments">Freigabe ansehen</button>' : ""}<button class="button secondary" data-tenant-message="${app.id}">Nachricht vorbereiten</button></div>`}
    </div>
  </article>`;
}

function renderTenantApplications() {
  $("#tenantDashboardApplications").innerHTML = tenantApplications.map(app => tenantApplicationCard(app, true)).join("");
  $("#tenantApplicationList").innerHTML = tenantApplications.map(app => tenantApplicationCard(app)).join("");
  $("#tenantNavCount").textContent = tenantApplications.length;
}

function renderTenantTasks() {
  const tasks = [
    tenantState.viewingConfirmed ? null : { title: "Besichtigung bestätigen", text: "Sonnenallee 142 · Samstag, 28.11. · 10:00 Uhr", due: "Bis morgen", action: "confirm-viewing", button: "Bestätigen" },
    tenantState.documentShared ? { title: "Dokumentfreigabe prüfen", text: "Parkweg 21 · Einkommensnachweis bis 30.11. freigegeben", due: "Bis 28.11.", view: "tenantDocuments", button: "Freigabe öffnen" } : null
  ].filter(Boolean);
  $("#tenantOpenTasks").innerHTML = tasks.length ? tasks.map(task => `<div class="tenant-task"><span class="task-check">○</span><div><h3>${escapeHtml(task.title)}</h3><p>${escapeHtml(task.text)}</p></div><span class="badge due">${escapeHtml(task.due)}</span><button class="button secondary" ${task.action ? `data-tenant-action="${task.action}"` : `data-view="${task.view}"`}>${escapeHtml(task.button)}</button></div>`).join("") : '<div class="task-empty"><span>✓</span><h3>Alles erledigt</h3><p>Aktuell stehen keine Aufgaben an.</p></div>';
  const taskCount = tasks.length;
  $("#tenantTaskCount").textContent = taskCount;
  $("#tenantTaskStat").textContent = taskCount;
  $("#tenantTaskStatText").textContent = taskCount === 0 ? "aktuell alles erledigt" : taskCount === 1 ? "eine Aufgabe offen" : `${taskCount} Aufgaben offen`;
  $("#tenantIntroText").textContent = taskCount === 0
    ? "Aktuell ist alles erledigt. Alle Bewerbungen und Freigaben bleiben unter deiner Kontrolle."
    : `Du hast heute ${taskCount === 1 ? "eine Aufgabe" : `${taskCount} Aufgaben`}. Alle Bewerbungen und Freigaben bleiben unter deiner Kontrolle.`;
  if (tenantState.viewingConfirmed) {
    $("#tenantFocusTitle").textContent = "Besichtigung vorbereiten";
    $("#tenantFocusBadge").textContent = "Termin bestätigt";
    $("#tenantFocusBadge").classList.remove("due");
    $("#tenantFocusText").textContent = "Dein Termin am Samstag, 28.11., um 10:00 Uhr ist bestätigt. Treffpunkt ist am Hauseingang.";
    $("#tenantFocusActions").innerHTML = '<button class="button secondary" data-view="tenantApplications">Bewerbung ansehen</button>';
  } else {
    $("#tenantFocusTitle").textContent = "Termin bestätigen";
    $("#tenantFocusBadge").textContent = "Bis morgen";
    $("#tenantFocusBadge").classList.add("due");
    $("#tenantFocusText").textContent = "Dir wurde ein Besichtigungstermin am Samstag, 28.11., um 10:00 Uhr angeboten.";
    $("#tenantFocusActions").innerHTML = '<button class="button primary" data-tenant-action="confirm-viewing">Termin bestätigen</button><button class="button secondary" data-view="tenantApplications">Bewerbung ansehen</button>';
  }
  $$('[data-tenant-action="confirm-viewing"]').forEach(button => {
    if (!button.closest("#tenantFocusActions")) button.hidden = Boolean(tenantState.viewingConfirmed);
  });
}

function renderTenantDocuments() {
  $("#tenantDocumentList").innerHTML = tenantState.documents.map(doc => `<div class="document-item"><span class="document-icon">▣</span><div><strong>${escapeHtml(doc.name)}</strong><small>${escapeHtml(doc.detail)}</small></div><span class="document-status ${doc.status === "Bereit" ? "ready" : ""}">${escapeHtml(doc.status)}</span><button aria-label="Dokumentoptionen">•••</button></div>`).join("");
  $("#documentShareToggle").checked = Boolean(tenantState.documentShared);
  $("#tenantShareStat").textContent = tenantState.documentShared ? "1" : "0";
}

function bindTenantDynamicActions() {
  $$('[data-tenant-action="confirm-viewing"]').forEach(button => button.addEventListener("click", () => {
    tenantState.viewingConfirmed = true;
    saveTenantState();
    renderTenantAll();
    toast("Besichtigungstermin bestätigt");
  }));
  $$('[data-tenant-action="confirm-interest"]').forEach(button => button.addEventListener("click", () => {
    tenantState.interestConfirmed = true;
    saveTenantState();
    renderTenantAll();
    toast("Interesse bestätigt");
  }));
  $$('[data-tenant-message]').forEach(button => button.addEventListener("click", () => toast("Nachrichtenvorlage vorbereitet")));
}

function renderTenantProfile() {
  const form = $("#tenantProfileForm");
  if (!form) return;
  Object.entries(tenantState.profile).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value;
  });
}

function renderTenantAll() {
  renderTenantApplications();
  renderTenantTasks();
  renderTenantDocuments();
  renderTenantProfile();
  bindTenantDynamicActions();
}

function setRole(role, targetView) {
  currentRole = role;
  localStorage.setItem("mietsort-role", role);
  document.body.dataset.role = role;
  $$('[data-role]').forEach(button => button.classList.toggle("active", button.dataset.role === role));
  if (role === "tenant") {
    $("#contextEyebrow").textContent = "Wohnungssuche";
    $("#contextTitle").textContent = "3 aktive Bewerbungen";
    $("#profileAvatar").textContent = "AW";
    $("#profileName").textContent = tenantState.profile.name || "Anna Weber";
    $("#profileRole").textContent = "Wohnungssuchend · Demo";
    $("#sidebarNote").innerHTML = '<span class="note-icon">✓</span><p><strong>Du behältst die Kontrolle</strong><br>Status, Aufgaben und Freigaben – ohne öffentliche Bewertung oder versteckten Score.</p>';
    renderTenantAll();
    switchView(targetView || "tenantDashboard");
  } else {
    $("#contextEyebrow").textContent = "Aktives Objekt";
    $("#contextTitle").textContent = "Sonnenallee 142, Berlin";
    $("#profileAvatar").textContent = "EK";
    $("#profileName").textContent = "Eric Kriedemann";
    $("#profileRole").textContent = "Vermieter · Demo";
    $("#sidebarNote").innerHTML = '<span class="note-icon">✓</span><p><strong>Du triffst die Entscheidung</strong><br>MietSort strukturiert Angaben und Arbeitsschritte – ohne automatische Zu- oder Absage.</p>';
    switchView(targetView || "dashboard");
  }
}

function enterApp(role, targetView) {
  document.body.classList.add("authenticated");
  setRole(role, targetView);
  window.scrollTo({ top: 0, behavior: "auto" });
}

function leaveApp() {
  document.body.classList.remove("authenticated");
  window.scrollTo({ top: 0, behavior: "auto" });
}

function renderAll() {
  renderStats();
  renderDashboardPipeline();
  renderRecent();
  renderProperty();
  renderPhaseFilters();
  renderApplications();
  renderProcessBoard();
  renderTemplateApplicantOptions();
  renderTemplates();
  populateCriteriaForm();
  renderTenantAll();
}

function switchView(name) {
  $$(".view").forEach(view => view.classList.remove("active"));
  const target = $(`#${name}View`);
  if (!target) return;
  target.classList.add("active");
  $$(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.view === name));
  $("#sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (name === "applications") renderApplications();
  if (name === "process") renderProcessBoard();
  if (name === "templates") renderTemplates();
}

document.addEventListener("click", event => {
  const logoutButton = event.target.closest("[data-logout]");
  if (logoutButton) {
    leaveApp();
    return;
  }
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) switchView(viewButton.dataset.view);
  const goButton = event.target.closest("[data-go]");
  if (goButton) switchView(goButton.dataset.go);
});
$$('[data-role]').forEach(button => button.addEventListener("click", () => setRole(button.dataset.role)));
$$('[data-login-role]').forEach(button => button.addEventListener("click", () => enterApp(button.dataset.loginRole)));
$("#mobileMenu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
$("#criteriaShortcut").addEventListener("click", () => switchView("process"));
$("#searchInput").addEventListener("input", renderApplications);
$("#statusFilter").addEventListener("change", renderApplications);
$("#sortSelect").addEventListener("change", renderApplications);
$("#templateApplicant").addEventListener("change", renderTemplates);

$("#criteriaForm").addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(event.target);
  settings = {
    warmRent: Number(data.get("warmRent")),
    extraCosts: Number(data.get("extraCosts") || 0),
    moveInStart: data.get("moveInStart"),
    moveInEnd: data.get("moveInEnd"),
    alternativeEnd: data.get("alternativeEnd"),
    occupancyMax: Number(data.get("occupancyMax")),
    applicationDeadline: data.get("applicationDeadline"),
    replyDays: Number(data.get("replyDays")),
    wbsRequired: data.has("wbsRequired"),
    petRelevant: data.has("petRelevant")
  };
  saveSettings();
  renderAll();
  $("#criteriaSaved").classList.add("show");
  window.setTimeout(() => $("#criteriaSaved").classList.remove("show"), 2200);
  toast("Objektregeln gespeichert");
});

$$("[data-form-mode]").forEach(button => button.addEventListener("click", () => {
  $$("[data-form-mode]").forEach(item => item.classList.toggle("active", item === button));
  $("#inquiryForm").classList.toggle("active-form", button.dataset.formMode === "inquiry");
  $("#interestForm").classList.toggle("active-form", button.dataset.formMode === "interest");
}));

$("#inquiryForm").addEventListener("submit", event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  const today = dateOnly();
  const app = {
    id: Date.now(), name: data.name, email: data.email, appointment: data.appointment,
    people: null, moveIn: "", income: "", pets: "", message: "",
    created: new Date().toISOString(), phase: "inquiry", shortlist: false,
    replyDue: addDays(today, settings.replyDays), deleteReview: addDays(today, 180), note: ""
  };
  applications.unshift(app);
  saveApplications();
  event.target.reset();
  renderAll();
  if (currentRole === "tenant") {
    tenantApplications.unshift({ id: `new-${app.id}`, address: "Sonnenallee 142", area: "Berlin-Neukölln", facts: "58 m² · 1.150 € warm", phase: "inquiry", deadline: app.replyDue, next: "Rückmeldung zur Besichtigung abwarten", image: "sun" });
    renderTenantAll();
    switchView("tenantApplications");
    toast("Besichtigungsanfrage gespeichert");
  } else {
    switchView("applications");
    selectApplication(app.id);
    toast("Besichtigungsanfrage hinzugefügt");
  }
});

$("#interestForm").addEventListener("submit", event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  const today = dateOnly();
  const app = {
    id: Date.now(), name: data.name, email: data.email, people: Number(data.people),
    moveIn: data.moveIn, income: data.income, pets: data.pets, message: data.message,
    created: new Date().toISOString(), phase: "interest", shortlist: false,
    replyDue: addDays(today, settings.replyDays), deleteReview: addDays(today, 180), note: ""
  };
  applications.unshift(app);
  saveApplications();
  event.target.reset();
  renderAll();
  if (currentRole === "tenant") {
    tenantApplications.unshift({ id: `new-${app.id}`, address: "Sonnenallee 142", area: "Berlin-Neukölln", facts: "58 m² · 1.150 € warm", phase: "interest", deadline: app.replyDue, next: "Rückmeldung abwarten", image: "sun" });
    renderTenantAll();
    switchView("tenantApplications");
    toast("Interesse bestätigt");
  } else {
    switchView("applications");
    selectApplication(app.id);
    toast("Konkretes Interesse hinzugefügt");
  }
});

$("#tenantProfileForm").addEventListener("submit", event => {
  event.preventDefault();
  tenantState.profile = Object.fromEntries(new FormData(event.target));
  tenantState.profile.people = Number(tenantState.profile.people || 1);
  saveTenantState();
  $("#profileName").textContent = tenantState.profile.name;
  $("#tenantProfileSaved").classList.add("show");
  window.setTimeout(() => $("#tenantProfileSaved").classList.remove("show"), 2200);
  toast("Bewerberprofil gespeichert");
});

$("#documentShareToggle").addEventListener("change", event => {
  tenantState.documentShared = event.target.checked;
  saveTenantState();
  renderTenantAll();
  toast(tenantState.documentShared ? "Freigabe aktiviert" : "Freigabe widerrufen");
});

$("#addDemoDocument").addEventListener("click", () => {
  if (!tenantState.documents.some(doc => doc.name === "Identitätsnachweis")) {
    tenantState.documents.push({ id: Date.now(), name: "Identitätsnachweis", detail: "Noch nicht geprüft", status: "Offen" });
    saveTenantState();
    renderTenantAll();
  }
  toast("Dokumentplatzhalter hinzugefügt");
});

$("#copyLinkBtn").addEventListener("click", async () => {
  const link = location.href.split("#")[0] + "#bewerben";
  try {
    await navigator.clipboard.writeText(link);
    toast("Bewerbungslink kopiert");
  } catch {
    toast("Link konnte nicht kopiert werden");
  }
});

renderAll();
if (location.hash === "#bewerben") enterApp("tenant", "form");
else setRole(currentRole);
