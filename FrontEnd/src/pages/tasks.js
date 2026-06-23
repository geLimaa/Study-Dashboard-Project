import { button, emptyState, pageHeader } from "../components/ui.js";
import { icon } from "../components/icons.js";
import { api } from "../lib/api.js";

let cachedToken = null;
let cachedTasks = [];
let editingTaskId = null;
let activeTaskFilter = "all";
let activeTaskSort = "dueDateLabel";

export async function renderTasks({ api, token }) {
  cachedToken = token;
  const response = await api.tasks(token);
  cachedTasks = response.tasks || [];
  const filteredTasks = applyTaskView(cachedTasks, activeTaskFilter, activeTaskSort);
  const editingTask = editingTaskId ? cachedTasks.find((task) => task.id === editingTaskId) : null;

  return `
    ${pageHeader({
      title: "Tarefas",
      description: "Planeje prazos, prioridades e acompanhe o andamento das atividades.",
      action: button({ label: "Adicionar", iconName: "bx-plus", id: "toggle-task-form" }),
    })}

    <section class="toolbar-panel">
      <div class="segmented">
        <button class="${activeTaskFilter === "all" ? "active" : ""}" type="button" data-task-filter="all">Todas</button>
        <button class="${activeTaskFilter === "Pendente" ? "active" : ""}" type="button" data-task-filter="Pendente">Pendentes</button>
        <button class="${activeTaskFilter === "Concluida" ? "active" : ""}" type="button" data-task-filter="Concluida">Concluidas</button>
      </div>
      <label class="field-inline">
        ${icon("bx-filter-alt")}
        <select data-task-sort value="${activeTaskSort}">
          <option value="dueDateLabel" ${activeTaskSort === "dueDateLabel" ? "selected" : ""}>Ordenar por prazo</option>
          <option value="priority" ${activeTaskSort === "priority" ? "selected" : ""}>Prioridade</option>
          <option value="course" ${activeTaskSort === "course" ? "selected" : ""}>Materia</option>
        </select>
      </label>
    </section>

    <section class="panel task-form-panel ${editingTask ? "" : "hidden"}" id="task-form-panel">
      <div class="panel-header">
        <div>
          <h2>${editingTask ? "Editar tarefa" : "Nova tarefa"}</h2>
          <p>${editingTask ? "Ajuste os dados da atividade." : "Cadastre rapidamente uma nova atividade."}</p>
        </div>
      </div>
      <form class="quick-form" id="task-form" data-task-id="${editingTask?.id || ""}">
        <label> Titulo <input name="title" required placeholder="Ex.: Revisar slides de banco" value="${editingTask?.title || ""}" /> </label>
        <label> Materia <input name="course" required placeholder="Ex.: Banco de Dados" value="${editingTask?.course || ""}" /> </label>
        <label> Prazo <input name="dueDateLabel" required placeholder="Hoje, amanha, sex..." value="${editingTask?.dueDateLabel || ""}" /> </label>
        <label>
          Prioridade
          <select name="priority">
            <option ${editingTask?.priority === "Baixa" ? "selected" : ""}>Baixa</option>
            <option ${!editingTask || editingTask?.priority === "Media" ? "selected" : ""}>Media</option>
            <option ${editingTask?.priority === "Alta" ? "selected" : ""}>Alta</option>
          </select>
        </label>
        <label>
          Status
          <select name="status">
            <option ${!editingTask || editingTask?.status === "Pendente" ? "selected" : ""}>Pendente</option>
            <option ${editingTask?.status === "Em progresso" ? "selected" : ""}>Em progresso</option>
            <option ${editingTask?.status === "Concluida" ? "selected" : ""}>Concluida</option>
          </select>
        </label>
        <button class="btn btn-primary" type="submit">
          ${icon(editingTask ? "bx-save" : "bx-plus")}
          <span class="btn-label">${editingTask ? "Atualizar tarefa" : "Salvar tarefa"}</span>
        </button>
        ${editingTask ? button({ label: "Cancelar", iconName: "bx-x", variant: "secondary", id: "cancel-task-edit" }) : ""}
      </form>
    </section>

    <section class="table-panel" id="tasks-table">
      ${renderTaskTable(filteredTasks)}
    </section>
  `;
}

export function bindTasksEvents() {
  const formPanel = document.querySelector("#task-form-panel");
  const toggleButton = document.querySelector("#toggle-task-form");
  const form = document.querySelector("#task-form");

  document.querySelectorAll("[data-task-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeTaskFilter = button.dataset.taskFilter || "all";
      updateTasksView();
    });
  });

  document.querySelector("[data-task-sort]")?.addEventListener("change", (event) => {
    activeTaskSort = event.target.value;
    updateTasksView();
  });

  toggleButton?.addEventListener("click", () => {
    editingTaskId = null;
    form?.reset();
    formPanel?.classList.toggle("hidden");
  });

  document.querySelector("#cancel-task-edit")?.addEventListener("click", () => {
    editingTaskId = null;
    window.dispatchEvent(new Event("studyflow:refresh"));
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());

    if (form.dataset.taskId) {
      await api.updateTask(cachedToken, form.dataset.taskId, payload);
    } else {
      await api.createTask(cachedToken, payload);
    }

    editingTaskId = null;
    window.dispatchEvent(new Event("studyflow:refresh"));
  });

  bindTaskTableEvents();
}

function updateTasksView() {
  const table = document.querySelector("#tasks-table");

  document.querySelectorAll("[data-task-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.taskFilter === activeTaskFilter);
  });

  const sortSelect = document.querySelector("[data-task-sort]");
  if (sortSelect) {
    sortSelect.value = activeTaskSort;
  }

  if (!table) return;

  const nextTasks = applyTaskView(cachedTasks, activeTaskFilter, activeTaskSort);
  table.innerHTML = renderTaskTable(nextTasks);
  bindTaskTableEvents();
}

function bindTaskTableEvents() {
  document.querySelectorAll("[data-task-status]").forEach((select) => {
    select.addEventListener("change", async (event) => {
      const status = event.target.value;
      const id = select.dataset.taskId;
      await api.updateTaskStatus(cachedToken, id, status);
      window.dispatchEvent(new Event("studyflow:refresh"));
    });
  });

  document.querySelectorAll("[data-task-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      editingTaskId = button.dataset.taskId;
      window.dispatchEvent(new Event("studyflow:refresh"));
    });
  });

  document.querySelectorAll("[data-task-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Excluir esta tarefa?")) return;
      await api.deleteTask(cachedToken, button.dataset.taskId);
      window.dispatchEvent(new Event("studyflow:refresh"));
    });
  });
}

function renderTaskTable(tasks) {
  return `
    <div class="table-row table-head">
      <span>Tarefa</span>
      <span>Materia</span>
      <span>Prazo</span>
      <span>Prioridade</span>
      <span>Status</span>
    </div>
    ${tasks.length
      ? tasks.map((task) => `
        <article class="table-row">
          <strong>${task.title}</strong>
          <span>${task.course}</span>
          <span>${task.dueDateLabel}</span>
          <span>${task.priority}</span>
          <div class="row-actions">
            <label class="field-inline task-status-field">
              <select data-task-status data-task-id="${task.id}">
                <option ${task.status === "Pendente" ? "selected" : ""}>Pendente</option>
                <option ${task.status === "Em progresso" ? "selected" : ""}>Em progresso</option>
                <option ${task.status === "Concluida" ? "selected" : ""}>Concluida</option>
              </select>
            </label>
            <button class="icon-btn small" type="button" data-task-edit data-task-id="${task.id}" aria-label="Editar tarefa">
              ${icon("bx-edit")}
            </button>
            <button class="icon-btn small danger" type="button" data-task-delete data-task-id="${task.id}" aria-label="Excluir tarefa">
              ${icon("bx-trash")}
            </button>
          </div>
        </article>
      `).join("")
      : `<div class="panel-empty">${emptyState({
          iconName: "bx-task",
          title: "Sem tarefas",
          text: "Crie uma tarefa para organizar o que vem primeiro.",
        })}</div>`
    }
  `;
}

function applyTaskView(tasks, filter, sortKey) {
  const filtered = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  return [...filtered].sort((left, right) => {
    if (sortKey === "priority") {
      return priorityRank(left.priority) - priorityRank(right.priority);
    }

    if (sortKey === "course") {
      return left.course.localeCompare(right.course, "pt-BR", { sensitivity: "base" });
    }

    return left.dueDateLabel.localeCompare(right.dueDateLabel, "pt-BR", { sensitivity: "base" });
  });
}

function priorityRank(priority) {
  switch (priority) {
    case "Alta":
      return 0;
    case "Media":
      return 1;
    case "Baixa":
      return 2;
    default:
      return 3;
  }
}
