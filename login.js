const form = document.querySelector("#login-form");
const status = document.querySelector("#status");
const submitButton = document.querySelector("#submit-button");
const modeButtons = document.querySelectorAll(".mode");

let mode = "login";

const setMode = (nextMode) => {
  mode = nextMode;
  modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === nextMode);
  });
  submitButton.textContent =
    nextMode === "signup" ? "Create Account" : "Enter the Interface";
  status.textContent =
    nextMode === "signup"
      ? "Single-user mode. Only one account can be created."
      : "Single-user mode. Sign in to continue.";
};

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.textContent = "Working...";

  const email = form.email.value.trim().toLowerCase();
  const password = form.password.value.trim();

  try {
    const response = await fetch(`/api/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      window.location.href = "app.html";
      return;
    }

    const payload = await response.json();
    status.textContent = payload.error || "Unable to continue.";
  } catch (error) {
    status.textContent = "Server unavailable. Start the Node server first.";
  }
});
