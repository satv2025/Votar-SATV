const SUPABASE_URL = "https://dpmqzuvyygwreqpffpca.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbXF6dXZ5eWd3cmVxcGZmcGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDk4MjcsImV4cCI6MjA3ODEyNTgyN30.BxgH_mcXgjwuiRz8yhwpxnF-UDkLyFpl16Yo0sz-0Qk";
const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function updateUserArea() {
    const { data } = await supa.auth.getSession();
    const userArea = document.getElementById("userArea");

    if (!userArea) return;

    if (data.session) {
        const user = data.session.user;
        const name = user.user_metadata?.username || user.user_metadata?.fullname || user.email;
        userArea.innerHTML = `
      <div class="dropdown">
        <button class="dropdown-btn">${name} ▼</button>
        <div class="dropdown-content">
          <a href="#" id="logoutBtn">Cerrar sesión</a>
        </div>
      </div>`;

        const dropdown = userArea.querySelector(".dropdown");
        const btn = dropdown.querySelector(".dropdown-btn");
        btn.addEventListener("click", () => dropdown.classList.toggle("show"));

        document.addEventListener("click", (e) => {
            if (!dropdown.contains(e.target)) dropdown.classList.remove("show");
        });

        dropdown.querySelector("#logoutBtn").addEventListener("click", async (e) => {
            e.preventDefault();
            await supa.auth.signOut();
            window.location.reload();
        });
    } else {
        userArea.innerHTML = `<a href="/login.html">Iniciar sesión</a>`;
    }
}

// ==== Guardado y redirección ====
(async function guard() {
    const requireAuth = document.body.getAttribute("data-require-auth") === "true";
    const { data } = await supa.auth.getSession();

    if (requireAuth && !data.session) {
        window.location.href = "/login.html";
    }

    updateUserArea();
})();

// ==== Login / Register Forms ====
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = email.value.trim();
            const password = document.getElementById("password").value;
            const { error } = await supa.auth.signInWithPassword({ email, password });
            if (error) alert(error.message);
            else window.location.href = "/superclasico/superclasico.html";
        });

        const googleBtn = document.getElementById("googleLogin");
        if (googleBtn) {
            googleBtn.addEventListener("click", async () => {
                await supa.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo: `${window.location.origin}/superclasico/superclasico.html` },
                });
            });
        }
    }

    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("username").value;
            const fullname = document.getElementById("fullname").value;
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            const { error } = await supa.auth.signUp({
                email,
                password,
                options: { data: { username, fullname } },
            });
            if (error) alert(error.message);
            else {
                alert("Cuenta creada. Revisá tu correo para verificar.");
                window.location.href = "/login.html";
            }
        });
    }
});