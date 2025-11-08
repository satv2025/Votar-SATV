// ===============================
// 👤 Autenticación de usuario (SATV)
// ===============================
import { supa } from "./supabaseClient.js";

// === Actualizar área de usuario (header)
async function updateUserArea() {
    const { data } = await supa.auth.getSession();
    const userArea = document.getElementById("userArea");
    if (!userArea) return;

    if (data.session) {
        const user = data.session.user;
        const name =
            user.user_metadata?.username ||
            user.user_metadata?.fullname ||
            user.email;

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

        // Cerrar menú si se hace clic fuera
        document.addEventListener("click", (e) => {
            if (!dropdown.contains(e.target)) dropdown.classList.remove("show");
        });

        // Cerrar sesión
        dropdown.querySelector("#logoutBtn").addEventListener("click", async (e) => {
            e.preventDefault();
            await supa.auth.signOut();
            window.location.reload();
        });
    } else {
        userArea.innerHTML = `<a href="/login">Iniciar sesión</a>`;
    }
}

// === Protección para páginas que requieren login
(async function guard() {
    const requireAuth = document.body.getAttribute("data-require-auth") === "true";
    const { data } = await supa.auth.getSession();

    if (requireAuth && !data.session) {
        window.location.href = "/login";
    }

    updateUserArea();
})();

// === Manejo de Login y Registro ===
document.addEventListener("DOMContentLoaded", () => {
    // === LOGIN ===
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById("email");
            const passwordInput = document.getElementById("password");
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email || !password) {
                alert("Por favor completá todos los campos.");
                return;
            }

            try {
                const { error } = await supa.auth.signInWithPassword({ email, password });
                if (error) throw error;
                window.location.href = "/superclasico";
            } catch (err) {
                alert(`Error al iniciar sesión: ${err.message}`);
            }
        });

        // Login con Google
        const googleBtn = document.getElementById("googleLogin");
        if (googleBtn) {
            googleBtn.addEventListener("click", async () => {
                await supa.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo: `${window.location.origin}/superclasico` },
                });
            });
        }
    }

    // === REGISTRO ===
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const username = document.getElementById("username").value.trim();
            const fullname = document.getElementById("fullname").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            if (!email || !password) {
                alert("Por favor completá todos los campos.");
                return;
            }

            try {
                // Crear usuario
                const { error: signUpError } = await supa.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { username, fullname },
                        emailRedirectTo: null, // evita verificación
                    },
                });

                if (signUpError) throw signUpError;

                // Iniciar sesión automáticamente
                const { error: signInError } = await supa.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;

                alert(`Cuenta creada correctamente. ¡Bienvenido ${username || fullname || email}!`);
                window.location.href = "/superclasico";
            } catch (err) {
                console.error("Error en el registro:", err);
                alert(`Error: ${err.message}`);
            }
        });
    }
});