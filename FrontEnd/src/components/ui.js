import { icon } from "./icons.js";

export function pageHeader({ title, description, action }) {
  return `
    <header class="page-header">
      <div>
        <p class="eyebrow">StudyFlow</p>
        <h1>${title}</h1>
        <span>${description}</span>
      </div>
      ${action ? `<div class="page-action">${action}</div>` : ""}
    </header>
  `;
}

export function button({ label, iconName, variant = "primary", id = "", type = "button" }) {
  return `
    <button class="btn btn-${variant}" ${id ? `id="${id}"` : ""} type="${type}">
      ${iconName ? `<i class="bx ${iconName}" aria-hidden="true"></i>` : ""}
      ${label}
    </button>
  `;
}

export function statCard({ label, value, detail, iconName, tone = "blue" }) {
  return `
    <article class="stat-card tone-${tone}">
      <div class="stat-icon">${icon(iconName)}</div>
      <div>
        <span>${label}</span>
        <strong>${value}</strong>
        <p>${detail}</p>
      </div>
    </article>
  `;
}

export function progressBar(value, label = "") {
  return `
    <div class="progress-row">
      ${label ? `<div class="progress-label"><span>${label}</span><strong>${value}%</strong></div>` : ""}
      <div class="progress-track"><span style="width: ${value}%"></span></div>
    </div>
  `;
}

export function statusBadge(status) {
  const key = status.toLowerCase().replace(" ", "-");
  return `<span class="badge badge-${key}">${status}</span>`;
}

export function emptyState({ iconName, title, text }) {
  return `
    <section class="empty-state">
      ${icon(iconName)}
      <h2>${title}</h2>
      <p>${text}</p>
    </section>
  `;
}
