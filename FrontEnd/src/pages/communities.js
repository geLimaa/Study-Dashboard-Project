import { button, emptyState, pageHeader } from "../components/ui.js";
import { icon } from "../components/icons.js";
import { api } from "../lib/api.js";

let cachedToken = null;

export async function renderCommunities({ token, api: remoteApi }) {
  cachedToken = token;
  const response = await remoteApi.communities(token);
  const communities = response.communities || [];

  return `
    ${pageHeader({
      title: "Comunidades",
      description: "Encontre grupos alinhados com suas materias e objetivos.",
      action: button({ label: "Atualizar", iconName: "bx-refresh", id: "refresh-communities" }),
    })}

    <section class="community-grid community-page-grid">
      ${communities.length
        ? communities.map((community) => `
          <article class="community-card tall">
            <div class="community-icon">${icon(community.icon)}</div>
            <h2>${community.title}</h2>
            <p>${community.description}</p>
            <div class="community-footer">
              <span>${community.members.toLocaleString("pt-BR")} membros</span>
              <button class="btn btn-secondary" type="button" data-community-action data-community-id="${community.id}" data-joined="${community.joined ? "true" : "false"}">
                ${community.joined ? "Sair" : "Entrar"}
              </button>
            </div>
          </article>
        `).join("")
        : `${emptyState({
            iconName: "bx-group",
            title: "Sem comunidades",
            text: "As comunidades cadastradas aparecem aqui.",
          })}`
      }
    </section>
  `;
}

export function bindCommunitiesEvents() {
  document.querySelector("#refresh-communities")?.addEventListener("click", () => {
    window.dispatchEvent(new Event("studyflow:refresh"));
  });

  document.querySelectorAll("[data-community-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const communityId = button.dataset.communityId;
      const joined = button.dataset.joined === "true";

      if (joined) {
        await api.leaveCommunity(cachedToken, communityId);
      } else {
        await api.joinCommunity(cachedToken, communityId);
      }

      window.dispatchEvent(new Event("studyflow:refresh"));
    });
  });
}
