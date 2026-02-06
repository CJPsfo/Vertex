const form = document.querySelector("#login-form");
const status = document.querySelector("#status");
const submitButton = document.querySelector("#submit-button");
const DEMO_EMAIL = "demo@vertex.app";
const DEMO_PASSWORD = "vertex-demo";

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.textContent = "Checking credentials...";

  const email = form.email.value.trim().toLowerCase();
  const password = form.password.value.trim();

  if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
    localStorage.setItem(
      "vertex_demo_auth",
      JSON.stringify({ email, signedInAt: Date.now() })
    );
    window.location.href = "app.html";
    return;
  }

  status.textContent = "Incorrect demo credentials.";
});
