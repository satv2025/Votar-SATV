const SUPABASE_URL = "https://dpmqzuvyygwreqpffpca.supabase.co";
const SUPABASE_ANON =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbXF6dXZ5eWd3cmVxcGZmcGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDk4MjcsImV4cCI6MjA3ODEyNTgyN30.BxgH_mcXgjwuiRz8yhwpxnF-UDkLyFpl16Yo0sz-0Qk";
const POLL_ID = "superclasico-2025";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
        persistSession: true,
        storage: localStorage,
        autoRefreshToken: true,
    },
});

const ids = {
    river: { pct: "pct-river" },
    empate: { pct: "pct-empate" },
    boca: { pct: "pct-boca" },
};

const totalVotes = document.getElementById("totalVotes");

(async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) console.error("Error autenticando anónimo:", error);
    }

    supabase
        .channel("votes")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "votes", filter: `poll_id=eq.${POLL_ID}` },
            refreshResults
        )
        .subscribe();

    await refreshResults();
    await markUserVote();
})();

async function markUserVote() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
        .from("votes")
        .select("option")
        .eq("poll_id", POLL_ID)
        .eq("user_id", user.id)
        .single();
    if (data?.option) {
        document.querySelectorAll(".option").forEach((o) => o.classList.remove("active"));
        document.querySelector(`.option[data-choice="${data.option}"]`)?.classList.add("active");
    }
}

async function castVote(choice) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from("votes")
        .upsert(
            { poll_id: POLL_ID, user_id: user.id, option: choice },
            { onConflict: "poll_id,user_id" }
        );

    if (error) console.error(error);
    else {
        document.querySelectorAll(".option").forEach((o) => o.classList.remove("active"));
        document.querySelector(`.option[data-choice="${choice}"]`).classList.add("active");
        await refreshResults();
    }
}

async function refreshResults() {
    const { data, error } = await supabase
        .from("votes")
        .select("option")
        .eq("poll_id", POLL_ID);
    if (error) return console.error(error);

    const totals = { river: 0, empate: 0, boca: 0 };
    data?.forEach((r) => (totals[r.option] = (totals[r.option] || 0) + 1));
    const total = totals.river + totals.empate + totals.boca;

    totalVotes.textContent = `Votos Totales: ${total}`;

    for (const k of Object.keys(totals)) {
        const pct = total ? Math.round((totals[k] / total) * 100) : 0;
        document.getElementById(ids[k].pct).textContent = pct + "%";
    }
}

document.querySelectorAll(".option").forEach((btn) => {
    btn.addEventListener("click", () => castVote(btn.dataset.choice));
});