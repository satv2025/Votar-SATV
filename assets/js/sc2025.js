// ===============================
// ⚽ SUPERCLÁSICO 2025 - ENCUESTA
// ===============================

const SUPABASE_URL = "https://dpmqzuvyygwreqpffpca.supabase.co";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbXF6dXZ5eWd3cmVxcGZmcGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDk4MjcsImV4cCI6MjA3ODEyNTgyN30.BxgH_mcXgjwuiRz8yhwpxnF-UDkLyFpl16Yo0sz-0Qk";
const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const choices = ["river", "empate", "boca"];
const pctEls = {
    river: document.getElementById("pct-river"),
    empate: document.getElementById("pct-empate"),
    boca: document.getElementById("pct-boca"),
};
const totalEl = document.getElementById("totalVotes");
const msgEl = document.getElementById("voteMsg");
const optionEls = document.querySelectorAll(".option");

let user = null;
let userVote = null;

// === Iniciar ===
document.addEventListener("DOMContentLoaded", async () => {
    const { data } = await supa.auth.getSession();
    user = data.session?.user || null;

    if (!user) {
        msgEl.textContent = "Debés iniciar sesión para votar.";
        return;
    }

    await loadVotes();
    await loadUserVote();
    subscribeRealtime();

    optionEls.forEach((opt) =>
        opt.addEventListener("click", () => handleVote(opt.dataset.choice))
    );
});

// === Cargar todos los votos ===
async function loadVotes() {
    const { data, error } = await supa.from("votes").select("choice");
    if (error) {
        console.error("Error cargando votos:", error);
        return;
    }

    const totals = { river: 0, empate: 0, boca: 0 };
    data.forEach((v) => {
        if (choices.includes(v.choice)) totals[v.choice]++;
    });

    const totalVotes = Object.values(totals).reduce((a, b) => a + b, 0);
    totalEl.textContent = `Votos Totales: ${totalVotes}`;

    choices.forEach((c) => {
        const pct = totalVotes ? Math.round((totals[c] / totalVotes) * 100) : 0;
        pctEls[c].textContent = `${pct}%`;
    });
}

// === Cargar el voto del usuario ===
async function loadUserVote() {
    if (!user) return;
    const { data, error } = await supa
        .from("votes")
        .select("choice")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) console.error("Error cargando voto usuario:", error);
    else if (data) {
        userVote = data.choice;
        highlightChoice(data.choice);
        msgEl.textContent = "Ya votaste. Podés cambiar tu elección si querés.";
    } else {
        msgEl.textContent = "Votá tu favorito para ver los resultados.";
    }
}

// === Votar o cambiar voto ===
async function handleVote(choice) {
    if (!user) {
        alert("Iniciá sesión para votar.");
        return;
    }

    if (userVote === choice) {
        alert("Ya elegiste esa opción.");
        return;
    }

    const { error } = await supa
        .from("votes")
        .upsert(
            [{ user_id: user.id, choice }],
            { onConflict: "user_id" }
        )
        .select(); // ✅ fuerza retorno y refresco

    if (error) {
        console.error("Error al votar:", error);
        alert("Error al enviar el voto.");
        return;
    }

    userVote = choice;
    highlightChoice(choice);
    msgEl.textContent = "Voto actualizado ✅";
    await loadVotes();
}

// === Resaltar opción votada ===
function highlightChoice(choice) {
    optionEls.forEach((o) =>
        o.classList.toggle("active", o.dataset.choice === choice)
    );
}

// === Realtime ===
function subscribeRealtime() {
    supa
        .channel("public:votes")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "votes" },
            () => loadVotes()
        )
        .subscribe((status) =>
            console.log("🔄 Canal realtime:", status)
        );
}