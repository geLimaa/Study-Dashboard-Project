import { button, pageHeader } from "../components/ui.js";
import { api } from "../lib/api.js";
import { setSession } from "../state/session.js";

let cachedToken = null;
let cachedUser = null;

export async function renderSettings({ token, user, api: remoteApi }) {
  cachedToken = token;
  cachedUser = user;
  const theme = localStorage.getItem("studyflow-theme") || user.theme || "light";

  return `
    ${pageHeader({
      title: "Configuracoes",
      description: "Ajuste perfil, seguranca e preferencias visuais.",
      action: button({ label: "Salvar", iconName: "bx-save", id: "save-settings" }),
    })}

    <p class="settings-feedback" data-settings-feedback></p>

    <section class="settings-grid">
      <form class="settings-card" id="profile-form">
        <h2>Perfil</h2>
        <label>Nome<input name="name" type="text" value="${user.name}" /></label>
        <label>Email<input type="email" value="${user.email}" disabled /></label>
        <label>Nivel<input name="level" type="text" value="${user.level}" /></label>
      </form>

      <form class="settings-card" id="security-form">
        <h2>Seguranca</h2>
        <label>Senha atual<input name="currentPassword" type="password" placeholder="Senha atual" /></label>
        <label>Nova senha<input name="newPassword" type="password" placeholder="Minimo 6 caracteres" /></label>
        <label>Confirmar senha<input name="confirmPassword" type="password" placeholder="Repita a senha" /></label>
        <button class="btn btn-secondary" type="submit">Atualizar senha</button>
      </form>

      <article class="settings-card">
        <h2>Aparencia</h2>
        <label class="switch-row">
          <span>
            Modo escuro
            <small>Preferencia salva no navegador e no backend.</small>
          </span>
          <input type="checkbox" id="settings-theme" ${theme === "dark" ? "checked" : ""} />
        </label>
      </article>
    </section>
  `;
}

export function bindSettingsEvents() {
  const feedback = document.querySelector("[data-settings-feedback]");
  const profileForm = document.querySelector("#profile-form");
  const securityForm = document.querySelector("#security-form");
  const themeToggle = document.querySelector("#settings-theme");

  document.querySelector("#save-settings")?.addEventListener("click", async () => {
    const profileData = Object.fromEntries(new FormData(profileForm).entries());
    const nextTheme = themeToggle?.checked ? "dark" : "light";
    const payload = {
      name: profileData.name,
      level: profileData.level,
      theme: nextTheme,
    };

    feedback.textContent = "Salvando...";

    try {
      const response = await api.updateMe(cachedToken, payload);
      setSession({ token: cachedToken, user: response.user });
      document.documentElement.dataset.theme = nextTheme;
      localStorage.setItem("studyflow-theme", nextTheme);
      feedback.textContent = "Configuracoes atualizadas.";
      window.dispatchEvent(new Event("studyflow:refresh"));
    } catch (error) {
      feedback.textContent = error.message || "Nao foi possivel salvar.";
    }
  });

  themeToggle?.addEventListener("change", () => {
    const nextTheme = themeToggle.checked ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("studyflow-theme", nextTheme);
  });

  securityForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(securityForm).entries());
    feedback.textContent = "Atualizando senha...";

    try {
      await api.updatePassword(cachedToken, payload);
      securityForm.reset();
      feedback.textContent = "Senha atualizada.";
    } catch (error) {
      feedback.textContent = error.message || "Nao foi possivel atualizar a senha.";
    }
  });
}
