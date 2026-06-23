import { button } from "../components/ui.js";
import { api } from "../lib/api.js";
import { setSession } from "../state/session.js";

export function renderLogin() {
  return `
    <main class="auth-page">
      <section class="auth-panel">
        <div class="auth-copy">
          <a class="brand auth-brand" href="#login">
            <span class="brand-mark">S</span>
            <span>StudyFlow</span>
          </a>
          <h1>Organize seus estudos com menos atrito.</h1>
          <p>Centralize tarefas, habitos e progresso academico em uma interface preparada para receber backend real.</p>
          <div class="auth-highlights">
            <span><i class="bx bx-check"></i> Dashboard por usuario</span>
            <span><i class="bx bx-check"></i> Tarefas e habitos</span>
            <span><i class="bx bx-check"></i> Progresso visual</span>
          </div>
        </div>

        <div class="auth-card">
          <div class="auth-tabs" role="tablist">
            <button class="auth-tab active" type="button" data-auth-tab="signin">Entrar</button>
            <button class="auth-tab" type="button" data-auth-tab="signup">Cadastrar</button>
          </div>

          <p class="auth-feedback" data-auth-feedback></p>

          <form class="auth-form" data-auth-form="signin">
            <label>
              Email
              <input type="email" name="email" value="gean@studyflow.dev" required />
            </label>
            <label>
              Senha
              <input type="password" name="password" value="123456" required />
            </label>
            <a href="#login" class="muted-link">Esqueci minha senha</a>
            ${button({ label: "Entrar", iconName: "bx-log-in", type: "submit" })}
          </form>

          <form class="auth-form hidden" data-auth-form="signup">
            <label>
              Nome
              <input type="text" name="name" placeholder="Seu nome" required />
            </label>
            <label>
              Email
              <input type="email" name="email" placeholder="voce@email.com" required />
            </label>
            <label>
              Senha
              <input type="password" name="password" placeholder="Minimo 6 caracteres" required />
            </label>
            ${button({ label: "Criar conta", iconName: "bx-user-plus", type: "submit" })}
          </form>
        </div>
      </section>
    </main>
  `;
}

export function bindLoginEvents() {
  const feedback = document.querySelector("[data-auth-feedback]");

  document.querySelectorAll("[data-auth-tab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.authTab;
      feedback.textContent = "";
      document.querySelectorAll("[data-auth-tab]").forEach((item) => item.classList.toggle("active", item === tab));
      document.querySelectorAll("[data-auth-form]").forEach((form) => {
        form.classList.toggle("hidden", form.dataset.authForm !== target);
      });
    });
  });

  document.querySelectorAll(".auth-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      feedback.textContent = "Carregando...";

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      try {
        const response = form.dataset.authForm === "signup"
          ? await api.register(payload)
          : await api.login(payload);

        setSession({ token: response.token, user: response.user });
        document.documentElement.dataset.theme = response.user.theme || "light";
        localStorage.setItem("studyflow-theme", response.user.theme || "light");
        window.location.hash = "dashboard";
      } catch (error) {
        feedback.textContent = error.message || "Nao foi possivel autenticar.";
      }
    });
  });
}
