// ===============================
// ⚽ SUPERCLÁSICO 2025 - ENCUESTA ANÓNIMA (SUPABASE)
// ===============================
const supa = window.supa;
const POLL_ID = "superclasico-2025";

const choices = ["river", "empate", "boca"];
const pctEls = {
    river: document.getElementById("pct-river"),
    empate: document.getElementById("pct-empate"),
    boca: document.getElementById("pct-boca"),
};
const totalEl = document.getElementById("totalVotes");
const msgEl = document.getElementById("voteMsg");
const optionEls = document.querySelectorAll(".option");

let anonId = null;
let userVote = null;

document.addEventListener("DOMContentLoaded", async () => {
    // Generar o recuperar ID anónimo local
    anonId = localStorage.getItem("anon_id");
    if (!anonId) {
        anonId = crypto.randomUUID();
        localStorage.setItem("anon_id", anonId);
    }

    await loadVotes();
    await loadUserVote();
    subscribeRealtime();

    optionEls.forEach((opt) =>
        opt.addEventListener("click", () => handleVote(opt.dataset.choice))
    );
});

async function loadVotes() {
    const { data, error } = await supa
        .from("votes")
        .select("option")
        .eq("poll_id", POLL_ID);

    if (error) return console.error(error);

    const totals = { river: 0, empate: 0, boca: 0 };
    data.forEach((v) => {
        if (choices.includes(v.option)) totals[v.option]++;
    });

    const totalVotes = Object.values(totals).reduce((a, b) => a + b, 0);
    totalEl.textContent = `Votos Totales: ${totalVotes}`;

    choices.forEach((c) => {
        const pct = totalVotes ? Math.round((totals[c] / totalVotes) * 100) : 0;
        pctEls[c].textContent = `${pct}%`;
    });
}

async function loadUserVote() {
    const { data, error } = await supa
        .from("votes")
        .select("option")
        .eq("poll_id", POLL_ID)
        .eq("user_id", anonId)
        .maybeSingle();

    if (error) return console.error(error);

    if (data) {
        userVote = data.option;
        highlightChoice(data.option);
        msgEl.textContent = "Ya votaste. Podés cambiar tu elección si querés.";
    } else {
        msgEl.textContent = "Votá tu favorito para ver los resultados.";
    }
}

async function handleVote(choice) {
    if (userVote === choice) return alert("Ya elegiste esa opción.");

    const { error } = await supa
        .from("votes")
        .upsert(
            [{ poll_id: POLL_ID, user_id: anonId, option: choice }],
            { onConflict: "user_id" }
        )
        .select();

    if (error) {
        console.error(error);
        alert("Error al votar.");
        return;
    }

    userVote = choice;
    highlightChoice(choice);
    msgEl.textContent = "Voto registrado ✅";
    await loadVotes();
}

function highlightChoice(choice) {
    optionEls.forEach((o) =>
        o.classList.toggle("active", o.dataset.choice === choice)
    );
}

function subscribeRealtime() {
    supa
        .channel("public:votes")
        .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, (payload) => {
            if (payload.new.poll_id === POLL_ID) loadVotes();
        })
        .subscribe();
}