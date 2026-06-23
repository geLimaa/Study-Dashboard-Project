import { bindLayoutEvents, renderAppShell } from "./components/layout.js";
import { bindDashboardEvents, renderDashboard } from "./pages/dashboard.js";
import { bindTasksEvents, renderTasks } from "./pages/tasks.js";
import { bindHabitsEvents, renderHabits } from "./pages/habits.js";
import { bindStudiesEvents, renderStudies } from "./pages/studies.js";
import { bindCommunitiesEvents, renderCommunities } from "./pages/communities.js";
import { bindSettingsEvents, renderSettings } from "./pages/settings.js";
import { bindLoginEvents, renderLogin } from "./pages/login.js";
import { api } from "./lib/api.js";
import { clearSession, getStoredUser, getToken, setSession } from "./state/session.js";

const routes = {
  dashboard: { render: renderDashboard, bind: bindDashboardEvents },
  tasks: { render: renderTasks, bind: bindTasksEvents },
  habits: { render: renderHabits, bind: bindHabitsEvents },
  studies: { render: renderStudies, bind: bindStudiesEvents },
  communities: { render: renderCommunities, bind: bindCommunitiesEvents },
  settings: { render: renderSettings, bind: bindSettingsEvents },
};

let routeVersion = 0;

export async function renderRoute() {
  const currentVersion = ++routeVersion;
  const route = getRoute();
  const app = document.querySelector("#app");
  const token = getToken();

  if (route !== "login" && !token) {
    window.location.hash = "login";
    return renderRoute();
  }

  if (route === "login") {
    if (token) {
      try {
        const response = await api.me(token);
        setSession({ token, user: response.user });
        window.location.hash = "dashboard";
        return renderRoute();
      } catch {
        clearSession();
      }
    }

    if (currentVersion !== routeVersion) return;
    app.innerHTML = renderLogin();
    bindLoginEvents();
    return;
  }

  let user = getStoredUser();

  try {
    const me = await api.me(token);
    user = me.user;
    setSession({ token, user });
  } catch (error) {
    clearSession();
    window.location.hash = "login";
    return renderRoute();
  }

  try {
    const page = routes[route] || routes.dashboard;
    const content = await page.render({ token, user, api });

    if (currentVersion !== routeVersion) return;

    app.innerHTML = renderAppShell(route, content, user);
    bindLayoutEvents();
    page.bind?.();
  } catch (error) {
    if (currentVersion !== routeVersion) return;

    app.innerHTML = renderErrorScreen(error.message || "Nao foi possivel carregar a pagina.");
  }
}

function getRoute() {
  return window.location.hash.replace("#", "") || "login";
}

function renderErrorScreen(message) {
  return `
    <main class="auth-page">
      <section class="auth-panel">
        <div class="auth-copy">
          <a class="brand auth-brand" href="#login">
            <span class="brand-mark">S</span>
            <span>StudyFlow</span>
          </a>
          <h1>Falha ao carregar o sistema.</h1>
          <p>${message}</p>
        </div>
        <div class="auth-card">
          <button class="btn btn-primary" type="button" onclick="window.location.reload()">
            <span class="btn-label">Tentar novamente</span>
          </button>
        </div>
      </section>
    </main>
  `;
}
