// === CONFIGURACIÓN SUPABASE ===
const supabase = window.supabase.createClient(
    "https://dpmqzuvyygwreqpffpca.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9. eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbXF6dXZ5eWd3cmVxcGZmcGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDk4MjcsImV4cCI6MjA3ODEyNTgyN30.BxgH_mcXgjwuiRz8yhwpxnF-UDkLyFpl16Yo0sz-0Qk" // ⚠️ reemplazá esto por tu public anon key real
);

const options = document.querySelectorAll(".option");
const note = document.getElementById("voteMsg");
const totalVotesEl = document.getElementById("totalVotes");

const pctRiver = document.getElementById("pct-river");
const pctEmpate = document.getElementById("pct-empate");
const pctBoca = document.getElementById("pct-boca");

let user = null;
let votoActual = null;

// === INICIO ===
async function init() {
    try {
        // 1️⃣ Recuperar sesión o crear usuario anónimo
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
            user = sessionData.session.user;
        } else {
            const { data, error } = await supabase.auth.signInAnonymously();
            if (error) throw error;
            user = data.user;
        }

        // 2️⃣ Revisar si ya votó
        const { data: voto } = await supabase
            .from("votos")
            .select("opcion")
            .eq("user_id", user.id)
            .single();

        if (voto) {
            votoActual = voto.opcion;
            marcarOpcion(votoActual);
            note.textContent = `Ya votaste: ${votoActual.toUpperCase()}`;
        } else {
            note.textContent = "Votá tu favorito para ver los resultados.";
        }

        // 3️⃣ Cargar resultados iniciales
        await actualizarResultados();

        // 4️⃣ Suscribirse a actualizaciones en tiempo real
        suscribirseAResultados();

        // 5️⃣ Escuchar clics
        options.forEach((opt) => {
            opt.addEventListener("click", async () => {
                if (votoActual) {
                    note.textContent = "Ya votaste.";
                    return;
                }

                const choice = opt.dataset.choice;
                marcarOpcion(choice);

                const { error } = await supabase.from("votos").insert({
                    user_id: user.id,
                    opcion: choice,
                });

                if (error) {
                    console.error(error);
                    note.textContent = "Error al registrar el voto.";
                } else {
                    votoActual = choice;
                    note.textContent = "Gracias por tu voto.";
                    await actualizarResultados();
                }
            });
        });
    } catch (err) {
        console.error("Error autenticando/votando:", err);
        note.textContent = "Error al conectar con Supabase.";
    }
}

// === FUNCIONES ===

// Marca visualmente la opción elegida
function marcarOpcion(choice) {
    options.forEach((opt) => opt.classList.remove("active"));
    const selected = document.querySelector(`.option[data-choice="${choice}"]`);
    if (selected) selected.classList.add("active");
}

// Calcula y muestra los porcentajes
async function actualizarResultados() {
    const { data: votos, error } = await supabase
        .from("votos")
        .select("opcion");

    if (error) {
        console.error(error);
        return;
    }

    const total = votos.length;
    const river = votos.filter((v) => v.opcion === "river").length;
    const empate = votos.filter((v) => v.opcion === "empate").length;
    const boca = votos.filter((v) => v.opcion === "boca").length;

    totalVotesEl.textContent =
        total > 0 ? `Votos Totales: ${total}` : "Votos Totales: —";

    pctRiver.textContent = total ? `${Math.round((river / total) * 100)}%` : "0%";
    pctEmpate.textContent = total ? `${Math.round((empate / total) * 100)}%` : "0%";
    pctBoca.textContent = total ? `${Math.round((boca / total) * 100)}%` : "0%";
}

// Suscripción en tiempo real a los cambios en la tabla "votos"
function suscribirseAResultados() {
    supabase
        .channel("realtime-votos")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "votos" },
            (payload) => {
                actualizarResultados();
            }
        )
        .subscribe();
}

// 🚀 Iniciar todo
init();