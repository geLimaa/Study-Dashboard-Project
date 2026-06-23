import { button, pageHeader, progressBar, statCard, statusBadge, emptyState } from "../components/ui.js";
import { icon } from "../components/icons.js";

export async function renderDashboard({ api, token }) {
  const data = await api.dashboard(token);
  const { summary, tasks, habits, studies, communities, files } = data;

  return `
    ${pageHeader({
      title: "Dashboard",
      description: "Resumo do seu dia, progresso dos estudos e proximas prioridades.",
      action: button({ label: "Nova tarefa", iconName: "bx-plus", id: "quick-task" }),
    })}

    <section class="stats-grid">
      ${statCard({ label: "Tarefas", value: summary.tasks.total, detail: `${summary.tasks.completed} concluidas`, iconName: "bx-task", tone: "blue" })}
      ${statCard({ label: "Habitos hoje", value: `${summary.habits.doneToday}/${summary.habits.total}`, detail: "concluidos no dia", iconName: "bx-repeat", tone: "green" })}
      ${statCard({ label: "Horas estudadas", value: `${summary.studies.totalHours}h`, detail: "registradas na semana", iconName: "bx-time-five", tone: "orange" })}
      ${statCard({ label: "Comunidades", value: summary.communities.total, detail: "ativas para acompanhar", iconName: "bx-group", tone: "purple" })}
    </section>

    <section class="dashboard-grid">
      <article class="panel panel-large">
        <div class="panel-header">
          <div>
            <h2>Progresso de estudos</h2>
            <p>Materias com maior impacto na semana.</p>
          </div>
          ${icon("bx-line-chart")}
        </div>
        <div class="progress-list">
          ${studies.length
            ? studies.map((study) => progressBar(study.progress, study.title)).join("")
            : emptyState({
                iconName: "bx-book-open",
                title: "Sem materias registradas",
                text: "Adicione sua primeira materia para acompanhar o progresso.",
              })}
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">
          <h2>Proximas tarefas</h2>
          ${icon("bx-calendar")}
        </div>
        <div class="item-list">
          ${tasks.length
            ? tasks.map((task) => `
              <div class="list-item task-list-item">
                <div>
                  <strong>${task.title}</strong>
                  <span>${task.course} - ${task.dueDateLabel}</span>
                </div>
                ${statusBadge(task.status)}
              </div>
            `).join("")
            : emptyState({
                iconName: "bx-task",
                title: "Sem tarefas",
                text: "Crie uma tarefa para organizar o que vem primeiro.",
              })}
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">
          <h2>Habitos</h2>
          ${icon("bx-check-shield")}
        </div>
        <div class="habit-strip">
          ${habits.length
            ? habits.map((habit) => `
              <div class="habit-dot ${habit.doneToday ? "done" : ""}">
                <span>${habit.doneToday ? icon("bx-check") : icon("bx-minus")}</span>
                <strong>${habit.title}</strong>
              </div>
            `).join("")
            : emptyState({
                iconName: "bx-repeat",
                title: "Sem habitos",
                text: "Cadastre um habito para acompanhar sua consistencia.",
              })}
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">
          <h2>Arquivos recentes</h2>
          ${icon("bx-file")}
        </div>
        <div class="item-list">
          ${files.length
            ? files.map((file) => `
              <div class="list-item compact">
                <div>
                  <strong>${file.name}</strong>
                  <span>${file.area} - ${file.dateLabel}</span>
                </div>
                ${file.downloadUrl
                  ? `<a class="file-link" href="${file.downloadUrl}" target="_blank" rel="noreferrer">${icon("bx-download")}</a>`
                  : icon("bx-download")}
              </div>
            `).join("")
            : emptyState({
                iconName: "bx-file",
                title: "Sem arquivos",
                text: "Quando arquivos forem enviados, eles aparecem aqui.",
              })}
        </div>
      </article>

      <article class="panel panel-large">
        <div class="panel-header">
          <h2>Comunidades em destaque</h2>
          ${icon("bx-group")}
        </div>
        <div class="community-grid">
          ${communities.length
            ? communities.map((community) => `
              <article class="community-card">
                <div class="community-icon">${icon(community.icon)}</div>
                <h3>${community.title}</h3>
                <p>${community.description}</p>
                <span>${community.members.toLocaleString("pt-BR")} membros</span>
              </article>
            `).join("")
            : emptyState({
                iconName: "bx-group",
                title: "Sem comunidades",
                text: "As comunidades cadastradas aparecem aqui.",
              })}
        </div>
      </article>
    </section>
  `;
}

export function bindDashboardEvents() {
  document.querySelector("#quick-task")?.addEventListener("click", () => {
    window.location.hash = "tasks";
  });
}
