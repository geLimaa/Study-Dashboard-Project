import { icon } from "./icons.js";
import { clearSession } from "../state/session.js";

const navItems = [
  { route: "dashboard", label: "Dashboard", icon: "bx-home" },
  { route: "tasks", label: "Tarefas", icon: "bx-task" },
  { route: "habits", label: "Habitos", icon: "bx-repeat" },
  { route: "studies", label: "Estudos", icon: "bx-book" },
  { route: "communities", label: "Comunidades", icon: "bx-group" },
];

export function renderAppShell(route, content, user) {
  const initials = getInitials(user?.name || "StudyFlow User");

  return `
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand" href="#dashboard" aria-label="StudyFlow dashboard">
          <span class="brand-mark">S</span>
          <span>StudyFlow</span>
        </a>

        <nav class="sidebar-nav" aria-label="Principal">
          ${navItems.map((item) => navLink(item, route)).join("")}
        </nav>

        <div class="sidebar-footer">
          ${navLink({ route: "settings", label: "Configuracoes", icon: "bx-cog" }, route)}
          <a class="nav-link logout-link" href="#login">${icon("bx-log-out")}<span>Sair</span></a>
        </div>
      </aside>

      <div class="workspace">
        <header class="topbar">
          <button class="icon-btn menu-toggle" type="button" aria-label="Abrir menu">
            ${icon("bx-menu")}
          </button>
          <div class="search-box">
            ${icon("bx-search")}
            <input type="search" placeholder="Buscar tarefas, habitos ou estudos" />
          </div>
          <button class="icon-btn theme-toggle" type="button" aria-label="Alternar tema">
            ${icon("bx-moon")}
          </button>
          <div class="user-chip">
            <span>${initials}</span>
            <div>
              <strong>${user?.name || "StudyFlow"}</strong>
              <small>${user?.level || "Universitario"}</small>
            </div>
          </div>
        </header>

        <main class="content" id="page-content">
          ${content}
        </main>
      </div>
    </div>
  `;
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function navLink(item, activeRoute) {
  const active = item.route === activeRoute ? " active" : "";
  return `
    <a class="nav-link${active}" href="#${item.route}">
      ${icon(item.icon)}
      <span>${item.label}</span>
    </a>
  `;
}

export function bindLayoutEvents() {
  document.querySelector(".theme-toggle")?.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("studyflow-theme", nextTheme);
  });

  document.querySelector(".menu-toggle")?.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-open");
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => document.body.classList.remove("sidebar-open"));
  });

  document.querySelector(".logout-link")?.addEventListener("click", (event) => {
    event.preventDefault();
    clearSession();
    window.location.hash = "login";
  });
}
