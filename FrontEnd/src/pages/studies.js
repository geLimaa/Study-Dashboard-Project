import { button, emptyState, pageHeader, progressBar } from "../components/ui.js";
import { icon } from "../components/icons.js";
import { api } from "../lib/api.js";

let cachedToken = null;

export async function renderStudies({ token, api: remoteApi }) {
  cachedToken = token;
  const [studiesResponse, filesResponse, communitiesResponse] = await Promise.all([
    remoteApi.studies(token),
    remoteApi.files(token),
    remoteApi.communities(token),
  ]);

  const studies = studiesResponse.studies || [];
  const files = filesResponse.files || [];
  const communities = communitiesResponse.communities || [];

  return `
    ${pageHeader({
      title: "Estudos",
      description: "Materias, pastas, arquivos e progresso reunidos em um lugar.",
      action: button({ label: "Registrar sessao", iconName: "bx-timer", id: "toggle-study-form" }),
    })}

    <section class="panel study-form-panel hidden" id="study-form-panel">
      <div class="panel-header">
        <div>
          <h2>Nova materia</h2>
          <p>Registre uma materia e o progresso inicial.</p>
        </div>
      </div>
      <form class="quick-form" id="study-form">
        <label> Titulo <input name="title" required placeholder="Ex.: Algoritmos" /> </label>
        <label> Progresso <input name="progress" type="number" min="0" max="100" value="0" /> </label>
        <label> Horas <input name="hours" type="number" step="0.5" min="0" value="0" /> </label>
        <label>
          Cor
          <select name="color">
            <option>blue</option>
            <option>green</option>
            <option>orange</option>
            <option>purple</option>
          </select>
        </label>
        <button class="btn btn-primary" type="submit">
          ${icon("bx-plus")}
          <span class="btn-label">Salvar materia</span>
        </button>
      </form>
    </section>

    <section class="cards-grid studies-grid">
      ${studies.length
        ? studies.map((study) => `
          <article class="study-card tone-${study.color}">
            <div class="study-ring" style="--value: ${study.progress}">
              <span>${study.progress}%</span>
            </div>
            <div>
              <h2>${study.title}</h2>
              <p>${study.hours}h estudadas esta semana</p>
              ${progressBar(study.progress)}
            </div>
            <div class="card-side-actions">
              <button class="icon-btn small danger" type="button" data-study-delete data-study-id="${study.id}" aria-label="Excluir materia">
                ${icon("bx-trash")}
              </button>
            </div>
          </article>
        `).join("")
        : `${emptyState({
            iconName: "bx-book-open",
            title: "Sem materias",
            text: "Registre sua primeira materia para acompanhar o progresso.",
          })}`
      }
    </section>

    <section class="dashboard-grid">
      <article class="panel">
        <div class="panel-header"><h2>Pastas</h2>${icon("bx-folder")}</div>
        <div class="folder-grid">
          ${studies.length
            ? studies.map((study) => `
              <a class="folder-card" href="#studies">
                ${icon("bx-folder-open")}
                <span>${study.title}</span>
              </a>
            `).join("")
            : emptyState({
                iconName: "bx-folder",
                title: "Sem pastas",
                text: "As materias registradas aparecem como pastas.",
              })}
        </div>
      </article>

      <article class="panel">
        <div class="panel-header"><h2>Arquivos</h2>${icon("bx-file")}</div>

        <form class="upload-form" id="file-upload-form">
          <label>
            Arquivo
            <input type="file" name="file" required />
          </label>
          <label>
            Pasta
            <select name="area">
              <option value="Geral">Geral</option>
              <option value="Matematica">Matematica</option>
              <option value="Programacao">Programacao</option>
              <option value="Banco de Dados">Banco de Dados</option>
            </select>
          </label>
          <button class="btn btn-primary" type="submit">
            ${icon("bx-upload")}
            <span class="btn-label">Enviar arquivo</span>
          </button>
        </form>

        <div class="item-list file-list">
          ${files.length
            ? files.map((file) => `
              <div class="list-item compact">
                <div>
                  <strong>${file.name}</strong>
                  <span>${file.area}</span>
                </div>
                <div class="file-actions">
                  <small>${file.dateLabel}</small>
                  ${file.downloadUrl ? `<a class="file-link" href="${file.downloadUrl}" target="_blank" rel="noreferrer">Abrir</a>` : ""}
                </div>
              </div>
            `).join("")
            : emptyState({
                iconName: "bx-file",
                title: "Sem arquivos",
                text: "Anexos e notas aparecem aqui.",
              })}
        </div>
      </article>

      <article class="panel panel-large">
        <div class="panel-header"><h2>Comunidades sugeridas</h2>${icon("bx-group")}</div>
        <div class="community-grid">
          ${communities.length
            ? communities.map((community) => communityCard(community)).join("")
            : emptyState({
                iconName: "bx-group",
                title: "Sem comunidades",
                text: "Nenhuma comunidade disponivel no momento.",
              })}
        </div>
      </article>
    </section>
  `;
}

function communityCard(community) {
  return `
    <article class="community-card">
      <div class="community-icon">${icon(community.icon)}</div>
      <h3>${community.title}</h3>
      <p>${community.description}</p>
      <span>${community.members.toLocaleString("pt-BR")} membros</span>
    </article>
  `;
}

export function bindStudiesEvents() {
  const formPanel = document.querySelector("#study-form-panel");
  const toggleButton = document.querySelector("#toggle-study-form");
  const form = document.querySelector("#study-form");
  const uploadForm = document.querySelector("#file-upload-form");

  toggleButton?.addEventListener("click", () => {
    formPanel?.classList.toggle("hidden");
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.progress = Number(payload.progress || 0);
    payload.hours = Number(payload.hours || 0);
    await api.createStudy(cachedToken, payload);
    window.dispatchEvent(new Event("studyflow:refresh"));
  });

  uploadForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const fileInput = uploadForm.querySelector('input[type="file"]');
    const file = fileInput?.files?.[0];

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("area", uploadForm.area.value);

    await api.uploadFile(cachedToken, formData);
    uploadForm.reset();
    window.dispatchEvent(new Event("studyflow:refresh"));
  });

  document.querySelectorAll("[data-study-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Excluir esta materia?")) return;
      await api.deleteStudy(cachedToken, button.dataset.studyId);
      window.dispatchEvent(new Event("studyflow:refresh"));
    });
  });
}
