// ===============================
// ⚽ SUPERCLÁSICO 2025 - ENCUESTA
// ===============================
const supa = window.supa;

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

async function loadVotes() {
    const { data, error } = await supa.from("votes").select("choice");
    if (error) return console.error(error);

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

async function loadUserVote() {
    if (!user) return;
    const { data, error } = await supa
        .from("votes")
        .select("choice")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) console.error(error);
    else if (data) {
        userVote = data.choice;
        highlightChoice(data.choice);
        msgEl.textContent = "Ya votaste. Podés cambiar tu elección si querés.";
    } else msgEl.textContent = "Votá tu favorito para ver los resultados.";
}

async function handleVote(choice) {
    if (!user) return alert("Iniciá sesión para votar.");
    if (userVote === choice) return alert("Ya elegiste esa opción.");

    const { error } = await supa
        .from("votes")
        .upsert([{ user_id: user.id, choice }], { onConflict: "user_id" })
        .select();

    if (error) {
        console.error(error);
        alert("Error al votar.");
        return;
    }

    userVote = choice;
    highlightChoice(choice);
    msgEl.textContent = "Voto actualizado ✅";
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
        .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () =>
            loadVotes()
        )
        .subscribe();
}