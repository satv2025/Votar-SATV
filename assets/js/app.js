// ==== CONFIGURAR SUPABASE ====
// REEMPLAZÁ con tu URL y PUBLIC ANON KEY
const SUPABASE_URL = "https://dpmqzuvyygwreqpffpca.supabase.co";
const SUPABASE_ANON_KEY = "TU_PUBLIC_ANON_KEY";

const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==== UI: Apps modal ====
function toggleModal() {
    const m = document.getElementById("appsModal");
    if (!m) return;
    m.hidden = !m.hidden;
}
window.toggleModal = toggleModal;

// ==== Auth guards ====
(async function guardIfNeeded() {
    const body = document.body;
    if (!body) return;
    const requireAuth = body.getAttribute("data-require-auth") === "true";
    if (!requireAuth) return;

    const { data } = await supa.auth.getSession();
    if (!data.session) {
        // no logueado → al login
        window.location.href = "/login.html";
    } else {
        // wire logout si existe el botón
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", async (e) => {
                e.preventDefault();
                await supa.auth.signOut();
                window.location.href = "/login.html";
            });
        }
    }
})();

// ==== Login form ====
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            const { data, error } = await supa.auth.signInWithPassword({ email, password });
            if (error) return alert(error.message);

            window.location.href = "/superclasico.html";
        });

        const googleBtn = document.getElementById("googleLogin");
        if (googleBtn) {
            googleBtn.addEventListener("click", async () => {
                const { data, error } = await supa.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                        redirectTo: `${window.location.origin}/superclasico.html`
                    }
                });
                if (error) alert(error.message);
            });
        }
    }

    // ==== Register form ====
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const username = document.getElementById("username").value.trim();
            const fullname = document.getElementById("fullname").value.trim();

            const { data, error } = await supa.auth.signUp({
                email,
                password,
                options: {
                    data: { username, fullname }
                }
            });

            if (error) return alert(error.message);
            alert("Cuenta creada. Revisá tu email para confirmar.");
            window.location.href = "/login.html";
        });
    }
});