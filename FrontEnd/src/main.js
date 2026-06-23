import { renderRoute } from "./router.js";

const savedTheme = localStorage.getItem("studyflow-theme") || "light";
document.documentElement.dataset.theme = savedTheme;

window.addEventListener("hashchange", renderRoute);
window.addEventListener("studyflow:refresh", renderRoute);
renderRoute();
