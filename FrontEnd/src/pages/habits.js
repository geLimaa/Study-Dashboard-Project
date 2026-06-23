import { button, emptyState, pageHeader } from "../components/ui.js";
import { icon } from "../components/icons.js";
import { api } from "../lib/api.js";

let cachedToken = null;

export async function renderHabits({ token, api: remoteApi }) {
  cachedToken = token;
  const response = await remoteApi.habits(token);
  const habits = response.habits || [];

  return `
    ${pageHeader({
      title: "Habitos",
      description: "Acompanhe consistencia diaria e mantenha sequencias visiveis.",
      action: button({ label: "Novo habito", iconName: "bx-plus", id: "toggle-habit-form" }),
    })}

    <section class="panel habit-form-panel hidden" id="habit-form-panel">
      <div class="panel-header">
        <div>
          <h2>Novo habito</h2>
          <p>Crie uma rotina para acompanhar no dashboard.</p>
        </div>
      </div>
      <form class="quick-form" id="habit-form">
        <label> Titulo <input name="title" required placeholder="Ex.: Estudar 2h" /> </label>
        <label>
          Frequencia
          <select name="frequency">
            <option selected>Diario</option>
            <option>Seg-Sex</option>
            <option>Semanal</option>
          </select>
        </label>
        <button class="btn btn-primary" type="submit">
          ${icon("bx-plus")}
          <span class="btn-label">Salvar habito</span>
        </button>
      </form>
    </section>

    <section class="cards-grid">
      ${habits.length
        ? habits.map((habit) => `
          <article class="habit-card">
            <label class="check-line">
              <input type="checkbox" ${habit.doneToday ? "checked" : ""} data-habit-toggle data-habit-id="${habit.id}" />
              <span>${icon("bx-check")}</span>
            </label>
            <div>
              <h2>${habit.title}</h2>
              <p>${habit.frequency}</p>
            </div>
            <div class="card-side-actions">
              <strong>${habit.streak} dias</strong>
              <button class="icon-btn small danger" type="button" data-habit-delete data-habit-id="${habit.id}" aria-label="Excluir habito">
                ${icon("bx-trash")}
              </button>
            </div>
          </article>
        `).join("")
        : `${emptyState({
            iconName: "bx-repeat",
            title: "Sem habitos",
            text: "Cadastre um habito para acompanhar sua consistencia.",
          })}`
      }
    </section>
  `;
}

export function bindHabitsEvents() {
  const formPanel = document.querySelector("#habit-form-panel");
  const toggleButton = document.querySelector("#toggle-habit-form");
  const form = document.querySelector("#habit-form");

  toggleButton?.addEventListener("click", () => {
    formPanel?.classList.toggle("hidden");
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    await api.createHabit(cachedToken, payload);
    window.dispatchEvent(new Event("studyflow:refresh"));
  });

  document.querySelectorAll("[data-habit-toggle]").forEach((input) => {
    input.addEventListener("change", async () => {
      await api.toggleHabit(cachedToken, input.dataset.habitId);
      window.dispatchEvent(new Event("studyflow:refresh"));
    });
  });

  document.querySelectorAll("[data-habit-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Excluir este habito?")) return;
      await api.deleteHabit(cachedToken, button.dataset.habitId);
      window.dispatchEvent(new Event("studyflow:refresh"));
    });
  });
}
