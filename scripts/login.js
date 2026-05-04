const container = document.querySelector(".forms-container");

document.getElementById("signUpBtn").onclick = () => {
  container.classList.add("active");
};

document.getElementById("signInBtn").onclick = () => {
  container.classList.remove("active");
};

const signInForm = document.querySelector(".sign-in-form");

signInForm.addEventListener("submit", (e) => {
  e.preventDefault();

  window.location.href = "./dashboard.html";
});
