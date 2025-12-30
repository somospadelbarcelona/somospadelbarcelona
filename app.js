// --- GLOBAL ERROR BOUNDARY ---
window.onerror = function (msg, url, line, col, error) {
    console.error("Global Error Caught:", msg, "at", line, ":", col);
    // Silent fail to keep UI running if possible
    return true;
};

window.onunhandledrejection = function (event) {
    console.error("Unhandled Promise Rejection:", event.reason);
};

const APP_VERSION = "2.2.5-PROFESSIONAL-HOTFIX"; // Forced sync for data cleanup
console.log(`🚀 SOMOSPADEL Dashboard v${APP_VERSION} inicializado.`);

const RAW_TEAMS = {
    "4ª Femenina": {
        "A": ["Cristina Matamala", "Olga Ferer", "Judith Esquerre", "Judit Pinad", "Anna Polo", "Anna Gaseni", "Noelia Omaque"],
        "B": ["Sandra Riera", "Yolanda Sanz", "Gemma Saavedra", "Mayte Vega", "Maria Lluisa Benlloch", "Enma Baijet", "Berta Cañas", "Andrea Vivancos"],
        "C": ["Yoana Martinez", "Andrea Baraja", "Marta Bassons", "Joana Garcia", "Sheila Jodar", "Greis Caballero", "Marta Baijet", "Mireia Peligros"]
    },
    "3ª Masculina": {
        "A": ["Angel Millan", "Albert Estrella", "Gerardo Jaenes", "Pablo Mena", "Sergio Serrano", "Fernando Gomez", "Eloy Arrabal", "Ness Rodera"],
        "B": ["Toni Palau", "Carlos Asmadt", "Pablo Kellermann", "Victor Iliana"]
    },
    "4ª Masculina": {
        "A": ["Sergio Albert", "Joan Bernard", "Oscar Cosco", "Javier Hita", "Vladimir Starciuc", "Bernat Pecharoman", "Juan Manuel Lopez", "Fernando Rodriguez"],
        "B": ["Adria Boza", "Marc Pijuan", "Cristian Lasheras", "Manu Sanhez", "Xavi Perea", "Bryan Davila", "Dani Astasio", "Marc Valldosera"]
    },
    "3ª Mixta": {
        "A": ["Monica Muñoz", "Miki Muñoz", "David Navea", "Ainhoa Navea", "Manuel Gamero", "Zizi", "Falta Pareja", "Falta Pareja 1"],
        "B": ["Ronny Benalcazar", "Carla Soto", "Juanjo", "Mariona", "Ramon Mejias", "Lola Caro", "Olga Phylbma", "Mario Sanz"]
    },
    "4ª Mixta": {
        "A": ["Juanma Leon", "Raquel Fernandez", "David Asensio", "Anais Grebot", "Paula Alves", "Jose Luis Berga", "Alex Cuadra", "Pili Jorques"],
        "B": ["Toni Millan", "Sonia Lopez", "Kevin Mancilla", "Lorena Arenas", "Joaquim Salvat", "Monica", "Javier Frauca", "Natalia Guash"],
        "C": ["Abel Francesc", "Edith Alvarez", "Carlota Calabuig", "Jordi Seuba", "Enrique Fontoba", "Annabel Delgado", "Cristina Vidal", "Carlos Calasanz"],
        "D": ["Marta Murigaren", "Jorge Rueda", "Coral Nova", "Ismael Casares", "Luis Pino", "Raquel Perez", "Fernando Garcia", "Paz Lorezo"]
    }
};

const SCHEDULE_CONFIG = {
    "13:30": [
        { cat: "4ª Femenina", groups: ["A"], courts: ["Pista 1", "Pista 4"] },
        { cat: "4ª Mixta", groups: ["A"], courts: ["Pista 2", "Pista 3"] },
        { cat: "4ª Mixta", groups: ["B"], courts: ["Pista 5", "Pista 6"] },
        { cat: "4ª Mixta", groups: ["C"], courts: ["Pista 7", "Pista 8"] },
        { cat: "4ª Mixta", groups: ["D"], courts: ["Pista 9", "Pista 10"] },
        { cat: "4ª Masculina", groups: ["A"], courts: ["Pista 11", "Pista 12"] },
        { cat: "4ª Masculina", groups: ["B"], courts: ["Pista 13", "Pista 14"] }
    ],
    "15:00": [
        { cat: "4ª Femenina", groups: ["B"], courts: ["Pista 1", "Pista 4"] },
        { cat: "4ª Femenina", groups: ["C"], courts: ["Pista 7", "Pista 10"] },
        { cat: "3ª Mixta", groups: ["A"], courts: ["Pista 5", "Pista 6"] },
        { cat: "3ª Mixta", groups: ["B"], courts: ["Pista 8", "Pista 9"] },
        { cat: "3ª Masculina", groups: ["A", "B"], courts: ["Pista 11", "Pista 12", "Pista 13"] }
    ]
};

// --- DATA INITIALIZATION ---

function generateInitialData() {
    console.log("Generating Initial Data...");
    const data = {
        matches: [],
        groups: [],
        categories: [],
        playoffs: []
    };

    // Helper to add time
    const addTime = (baseTime, mins) => {
        const [h, m] = baseTime.split(':').map(Number);
        const date = new Date(2025, 0, 1, h, m + mins);
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    Object.entries(RAW_TEAMS).forEach(([category, groups]) => {
        if (!data.categories.includes(category)) data.categories.push(category);

        Object.entries(groups).forEach(([groupName, rawPlayers]) => {
            if (!data.groups.includes(groupName)) data.groups.push(groupName);

            // COMBINE PLAYERS INTO PAIRS
            const teams = [];
            for (let i = 0; i < rawPlayers.length; i += 2) {
                if (rawPlayers[i + 1]) {
                    teams.push(`${rawPlayers[i]} / ${rawPlayers[i + 1]}`);
                } else {
                    teams.push(rawPlayers[i]); // Loner
                }
            }

            // Find schedule config
            let startBase = "13:30"; // Default
            let courts = [];

            // Determine Shift and Courts
            ["13:30", "15:00"].forEach(timeBlock => {
                const config = SCHEDULE_CONFIG[timeBlock].find(c => c.cat === category && c.groups.includes(groupName));
                if (config) {
                    startBase = timeBlock;
                    courts = config.courts;
                }
            });

            // Round Robin Logic
            const teamCount = teams.length;
            let pairings = [];

            if (teamCount === 4) {
                pairings = [
                    [[0, 1], [2, 3]], // Round 1
                    [[0, 2], [1, 3]], // Round 2
                    [[0, 3], [1, 2]]  // Round 3
                ];
            } else if (teamCount === 6) {
                // 3 rounds of 3 matches each (as per grid capacity)
                // Standard RR for 6 teams would be 5 rounds, but grid has 3 slots for 3 courts.
                pairings = [
                    [[0, 1], [2, 3], [4, 5]], // Round 1
                    [[0, 2], [1, 4], [3, 5]], // Round 2
                    [[0, 3], [1, 5], [2, 4]]  // Round 3
                ];
            } else if (teamCount === 2) {
                // Special case for groups with only 2 teams (e.g. 3ª Masculina B)
                // They play each other 3 times to maintain schedule density
                pairings = [
                    [[0, 1]], // Match 1
                    [[0, 1]], // Match 2
                    [[0, 1]]  // Match 3
                ];
            }

            pairings.forEach((roundPairs, roundIdx) => {
                const time = addTime(startBase, roundIdx * 30);

                roundPairs.forEach((pair, pairIdx) => {
                    const idxA = pair[0];
                    const idxB = pair[1];

                    if (teams[idxA] && teams[idxB]) {
                        const court = courts[pairIdx % courts.length] || "Pista ?";
                        data.matches.push({
                            id: data.matches.length + 1,
                            teamA: teams[idxA],
                            teamB: teams[idxB],
                            scoreA: null,
                            scoreB: null,
                            court: court,
                            time: time,
                            category: category,
                            group: groupName,
                            status: "pending",
                            stage: 'group'
                        });
                    }
                });
            });
        });

        // GENERATE PLAYOFFS FOR THIS CATEGORY
        const groupList = Object.keys(groups).sort();
        const numGroups = groupList.length;

        if (numGroups === 4 || numGroups === 3) {
            // Quarters
            for (let i = 1; i <= 4; i++) {
                data.matches.push({
                    id: 10000 + data.matches.length,
                    matchName: `Cuartos ${i}`,
                    teamA: `TBD Q${i}A`, teamB: `TBD Q${i}B`,
                    scoreA: null, scoreB: null,
                    status: "pending", stage: "quarter",
                    category: category, time: "16:30", court: "Pista ?"
                });
            }
            // Semis
            for (let i = 1; i <= 2; i++) {
                data.matches.push({
                    id: 20000 + data.matches.length,
                    matchName: `Semi ${i}`,
                    teamA: `Ganador Cuartos ${i * 2 - 1}`, teamB: `Ganador Cuartos ${i * 2}`,
                    scoreA: null, scoreB: null,
                    status: "pending", stage: "semi",
                    category: category, time: "17:30", court: "Pista ?"
                });
            }
            // Final
            data.matches.push({
                id: 30000 + data.matches.length,
                matchName: "Final",
                teamA: "Ganador Semi 1", teamB: "Ganador Semi 2",
                scoreA: null, scoreB: null,
                status: "pending", stage: "final",
                category: category, time: "18:30", court: "Pista 1"
            });
        } else if (numGroups === 2 || category === "3ª Masculina") {
            // Semis
            for (let i = 1; i <= 2; i++) {
                data.matches.push({
                    id: 20000 + data.matches.length,
                    matchName: `Semi ${i}`,
                    teamA: `TBD S${i}A`, teamB: `TBD S${i}B`,
                    scoreA: null, scoreB: null,
                    status: "pending", stage: "semi",
                    category: category, time: category === "4ª Masculina" ? "16:30" : "17:30", court: "Pista ?"
                });
            }
            // Final
            data.matches.push({
                id: 30000 + data.matches.length,
                matchName: "Final",
                teamA: "Ganador Semi 1", teamB: "Ganador Semi 2",
                scoreA: null, scoreB: null,
                status: "pending", stage: "final",
                category: category, time: category === "4ª Masculina" ? "17:15" : "18:30", court: "Pista 1"
            });
        } else if (numGroups === 1) {
            // Final Directly
            data.matches.push({
                id: 30000 + data.matches.length,
                matchName: "Final",
                teamA: "1º Grupo A", teamB: "2º Grupo A",
                scoreA: null, scoreB: null,
                status: "pending", stage: "final",
                category: category, time: "18:30", court: "Pista 1"
            });
        }
    });

    data.groups = [...new Set(data.groups)].sort();
    console.log("Initial Data Generated:", data.matches.length, "matches.");
    return data;
}

// --- STATE MANAGEMENT ---
// Force initial setup if data is corrupt or missing or version changed
(function checkVersionReset() {
    const savedVersion = localStorage.getItem('APP_VERSION_SYNC');
    if (savedVersion !== APP_VERSION) {
        console.warn("New Version Detected. Clearing stale localStorage...");
        localStorage.removeItem('tournamentData');
        localStorage.setItem('APP_VERSION_SYNC', APP_VERSION);
    }
})();

window.tournamentData = (function () {
    try {
        const stored = localStorage.getItem('tournamentData');

        // If we have BAKED_DATA and NO local storage, use BAKED_DATA
        if (typeof BAKED_DATA !== 'undefined' && !stored) {
            console.log("📦 Using BAKED_DATA for fresh load.");
            return BAKED_DATA;
        }

        if (!stored) return null;
        return JSON.parse(stored);
    } catch (e) { return null; }
})();

// Force initial setup if data is corrupt or missing
function validateAndRepairData() {
    try {
        if (!tournamentData || !tournamentData.matches || !Array.isArray(tournamentData.matches)) {
            console.warn("Invalid data structure detected. Using defaults...");
            tournamentData = generateInitialData();
            // YA NO GUARDAMOS AQUÍ. Esperamos a que Firebase nos diga si hay algo en la nube.
        }

        // DE-DUPLICATE CATEGORIES (Fix for duplicates issue)
        if (tournamentData.categories) {
            tournamentData.categories = [...new Set(tournamentData.categories)];
        }

        // Ensure all matches have necessary fields
        tournamentData.matches.forEach(m => {
            if (!m.id) m.id = Math.floor(Math.random() * 100000);
            if (!m.status) m.status = 'pending';
            if (m.scoreA === undefined) m.scoreA = null;
            if (m.scoreB === undefined) m.scoreB = null;
            if (!m.time) m.time = 'TBD';
            if (!m.court) m.court = 'Pista ?';
        });

        // Ensure playoffs exist
        const hasPlayoffs = tournamentData.matches.some(m => m.stage && m.stage !== 'group');
        if (!hasPlayoffs) {
            console.log("Playoffs missing, regenerating structure...");
            const freshData = generateInitialData();
            const playoffMatches = freshData.matches.filter(m => m.stage && m.stage !== 'group');
            tournamentData.matches = [...tournamentData.matches, ...playoffMatches];
            saveState();
        }
    } catch (err) {
        console.error("Recovery failed, generating fresh data", err);
        tournamentData = generateInitialData();
        saveState();
    }
}

function forceSyncSchedule() {
    if (!confirm("⚠️ Esto sobrescribirá TODAS las horas y pistas de la FASE DE GRUPOS según el calendario oficial. ¿Continuar?")) return;

    // Sort and reset
    const groupMatches = tournamentData.matches.filter(m => m.stage === 'group');
    const groupCounters = {};

    groupMatches.forEach(m => {
        const key = `${m.category}-${m.group}`;
        if (!groupCounters[key]) groupCounters[key] = 0;

        let startBase = "13:30";
        let courts = [];
        ["13:30", "15:00"].forEach(timeBlock => {
            const config = SCHEDULE_CONFIG[timeBlock].find(c => c.cat === m.category && c.groups.includes(m.group));
            if (config) {
                startBase = timeBlock;
                courts = config.courts;
            }
        });

        const roundIdx = Math.floor(groupCounters[key] / 2);
        const pairIdx = groupCounters[key] % 2;

        m.time = addTime(startBase, roundIdx * 30);
        m.court = courts[pairIdx % courts.length] || "Pista ?";
        groupCounters[key]++;
    });

    saveState();
    alert("Horarios sincronizados con éxito.");
    location.reload();
}

validateAndRepairData();

// --- PATCH: FORCE OFFICIAL PLAYOFF SCHEDULE (ROBUST VERSION) ---
(function applyPlayoffPatch() {
    const PATCH_ID = "20251228-SCHEDULE-V3-ROBUST";
    if (tournamentData && tournamentData.appliedPatches?.includes(PATCH_ID)) return;

    console.log("🛠 APLICANDO PARCHE DE PROGRAMACIÓN OFICIAL (V3)...");
    if (typeof BAKED_DATA !== 'undefined' && BAKED_DATA.matches) {
        let updatedCount = 0;

        // Helper to normalize category for safer matching (e.g. 4ª vs 4º)
        const norm = (s) => (s || "").toLowerCase().trim()
            .replace(/[ªº]/g, 'a')
            .replace(/\s+/g, '');

        BAKED_DATA.matches.filter(m => m.stage && m.stage !== 'group').forEach(official => {
            // Try matching by ID first, then by Category + Stage + Name
            let live = tournamentData.matches.find(lm => lm.id == official.id);

            if (!live) {
                live = tournamentData.matches.find(lm =>
                    norm(lm.category) === norm(official.category) &&
                    lm.stage === official.stage &&
                    (lm.matchName || "") === (official.matchName || "")
                );
            }

            if (live) {
                // Force update court and time
                live.time = official.time;
                live.court = official.court;
                updatedCount++;
                console.log(`  [PATCH] Match ${official.id} (${official.category} ${official.matchName || ''}) -> ${official.time} en ${official.court}`);
            }
        });

        console.log(`✅ Parche aplicado: ${updatedCount} partidos actualizados.`);

        if (!tournamentData.appliedPatches) tournamentData.appliedPatches = [];
        if (!tournamentData.appliedPatches.includes(PATCH_ID)) {
            tournamentData.appliedPatches.push(PATCH_ID);
        }
        saveState();
    }
})();

// --- PATCH: INJECT MISSING 3ª MASCULINA B MATCHES ---
(function applyMissingMatchesPatch() {
    if (!tournamentData) return;
    const PATCH_ID = "FIX_3MASC_B_MISSING";
    if (tournamentData.appliedPatches?.includes(PATCH_ID)) return;

    console.log("🛠 APLICANDO PARCHE: Generando partidos faltantes para 3ª Masculina B...");

    // Check if matches already exist
    const existing = tournamentData.matches.filter(m => m.category === "3ª Masculina" && m.group === "B");
    if (existing.length >= 3) {
        console.log("✅ Partidos ya existen. Saltando parche.");
        return;
    }

    const t1 = "Toni Palau / Carlos Asmadt";
    const t2 = "Pablo Kellermann / Victor Iliana";

    const newMatches = [
        {
            id: Date.now() + 1,
            teamA: t1, teamB: t2,
            scoreA: null, scoreB: null,
            court: "Pista 13", time: "15:00",
            category: "3ª Masculina", group: "B",
            status: "pending", stage: "group"
        },
        {
            id: Date.now() + 2,
            teamA: t1, teamB: t2,
            scoreA: null, scoreB: null,
            court: "Pista 13", time: "15:30",
            category: "3ª Masculina", group: "B",
            status: "pending", stage: "group"
        },
        {
            id: Date.now() + 3,
            teamA: t1, teamB: t2,
            scoreA: null, scoreB: null,
            court: "Pista 13", time: "16:00",
            category: "3ª Masculina", group: "B",
            status: "pending", stage: "group"
        }
    ];

    tournamentData.matches.push(...newMatches);

    if (!tournamentData.appliedPatches) tournamentData.appliedPatches = [];
    tournamentData.appliedPatches.push(PATCH_ID);

    saveState();
    console.log("✅ Parche aplicado: 3 partidos añadidos.");
})();



// --- PATCH: FIX TEAM NAME INCONSISTENCY (Coral vs Coral Nova) ---
(function fixTeamNameInconsistency() {
    if (!tournamentData) return;
    const PATCH_ID = "FIX_CORAL_NAME_V1";
    if (tournamentData.appliedPatches?.includes(PATCH_ID)) return;

    console.log("🛠 APLICANDO PARCHE: Corrigiendo nombre de 'Coral'...");
    let fixedCount = 0;
    const wrongName = "Coral / Ismael Casares";
    const correctName = "Coral Nova / Ismael Casares";

    tournamentData.matches.forEach(m => {
        if (m.teamA === wrongName) {
            m.teamA = correctName;
            fixedCount++;
        }
        if (m.teamB === wrongName) {
            m.teamB = correctName;
            fixedCount++;
        }
    });

    if (fixedCount > 0) {
        console.log(`✅ Se corrigieron ${fixedCount} instancias de nombres incorrectos.`);
        if (!tournamentData.appliedPatches) tournamentData.appliedPatches = [];
        tournamentData.appliedPatches.push(PATCH_ID);
        saveState();
    }
})();

let activeMatchesCat = null;
let activeStandingsCat = null;
let activePlayoffCat = null;
let activeAdminCat = null;
let activeAdminPhase = 'group';
let activeAdminSort = 'id'; // 'id' or 'time'

// Save function with timestamp for auto-refresh
function saveState() {
    return new Promise((resolve, reject) => {
        // Ejecutar cálculos antes de guardar
        if (typeof updatePlayoffCalculations === 'function') updatePlayoffCalculations();

        const dataStr = JSON.stringify(tournamentData);
        localStorage.setItem('tournamentData', dataStr);
        localStorage.setItem('dataTimestamp', Date.now().toString());

        // PUSH TO FIREBASE (Real-time Cloud Sync)
        if (window.isFirebaseActive && window.db) {
            window.db.ref('tournament_state').set(tournamentData)
                .then(() => {
                    console.log("✅ Sincronización con Firebase con éxito.");
                    resolve();
                })
                .catch(err => {
                    console.error("Firebase Push Error:", err);
                    if (err.code === 'PERMISSION_DENIED') {
                        alert("❌ ERROR DE PERMISOS: Firebase ha bloqueado el guardado. Revisa las 'Rules' en tu consola de Firebase y ponlas en true.");
                    } else {
                        alert("❌ ERROR FIREBASE: " + err.message);
                    }
                    reject(err);
                });
        } else {
            resolve(); // No Firebase, resolve anyway
        }

        // Actualizar UI
        if (typeof renderTicker === 'function') renderTicker();
        if (typeof updateHeaderStats === 'function') updateHeaderStats();
        if (typeof updateUI === 'function') updateUI();
    });
}

// FUNCIÓN PARA GUARDAR RESULTADO ESPECÍFICO (Solicitada por usuario)
function saveMatchResult(matchName, resultado) {
    if (!matchName || resultado === undefined) return;

    // 1. Actualizar en el estado local (tournamentData)
    const match = tournamentData.matches.find(m => m.matchName === matchName);
    if (match) {
        const scores = resultado.split('-').map(s => s.trim());
        match.scoreA = parseInt(scores[0]) || 0;
        match.scoreB = parseInt(scores[1]) || 0;
        match.status = 'finished';
        saveState();
    }

    // 2. Guardar en Firebase bajo la ruta específica solicitada
    if (window.isFirebaseActive && window.db) {
        window.db.ref('tournament_state/' + matchName).set(resultado)
            .then(() => console.log(`✓ Resultado de "${matchName}" guardado en Firebase.`))
            .catch(err => {
                console.error("Error guardando resultado:", err);
                alert("❌ Fallo al guardar en Firebase: " + err.message);
            });
    }
}

function syncWithFirebase() {
    if (!window.isFirebaseActive || !window.db) {
        console.warn("⚠️ Firebase no está activo o la DB no está inicializada.");
        return;
    }

    // Indicador visual de conexión
    const updateStatus = (status, details = '') => {
        const indicator = document.getElementById('cloud-status-indicator');
        if (indicator) {
            if (status === 'online') {
                indicator.innerHTML = '<i class="fas fa-cloud" style="color:#22c55e;"></i> ONLINE';
                indicator.style.borderColor = 'rgba(34, 197, 94, 0.4)';
            } else if (status === 'offline') {
                indicator.innerHTML = `<i class="fas fa-exclamation-triangle" style="color:#ef4444;"></i> OFFLINE ${details}`;
                indicator.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            } else {
                indicator.innerHTML = `<i class="fas fa-spinner fa-spin" style="color:#f59e0b;"></i> ${details || 'CONNECTING...'}`;
                indicator.style.borderColor = 'rgba(245, 158, 11, 0.4)';
            }
        }
    };

    updateStatus('connecting', 'BUSCANDO SERVIDOR...');
    console.log("📡 Iniciando escucha de Firebase...");

    // 1. Detectar si hay conexión a la infraestructura de Firebase
    window.db.ref('.info/connected').on('value', (snap) => {
        if (snap.val() === true) {
            console.log("🟢 Conexión establecida con el servidor de Firebase.");
            updateStatus('connecting', 'ESPERANDO DATOS...');
        } else {
            console.log("🔴 Conexión perdida con el servidor de Firebase.");
            updateStatus('offline', '(RED)');
        }
    });

    // 2. Escuchar cambios en los datos
    window.db.ref('tournament_state').on('value', (snapshot) => {
        const cloudData = snapshot.val();
        console.log("📦 Datos recibidos de la nube:", cloudData ? "SÍ" : "VACÍO");
        updateStatus('online');

        if (cloudData) {
            console.log("☁️ ¡Actualización de la nube recibida!");
            tournamentData = cloudData;
            localStorage.setItem('tournamentData', JSON.stringify(tournamentData));

            // Re-renderizar todo
            if (typeof renderStandings === 'function') renderStandings();
            if (typeof renderMatches === 'function') renderMatches();
            if (typeof renderBrackets === 'function') renderBrackets();
            if (typeof renderTicker === 'function') renderTicker();
            if (typeof updateHeaderStats === 'function') updateHeaderStats();
            if (typeof renderLiveFeed === 'function') renderLiveFeed();
            try {
                if (typeof renderStatsCharts === 'function') renderStatsCharts();
            } catch (e) { console.error("Error updating stats:", e); }

            if (typeof initAdmin === 'function') initAdmin();
        } else {
            console.warn("⚠️ La ruta 'tournament_state' está vacía en Firebase.");
            // Si está vacía, avisamos al admin
            if (window.location.pathname.includes('admin.html')) {
                console.log("💡 Sugiriendo inicialización al Admin...");
                // Solo avisamos una vez por sesión
                if (!sessionStorage.getItem('sync_warning_shown')) {
                    alert("☁️ LA NUBE ESTÁ VACÍA: Pulsa el botón azul 'Forzar Sincro Nube' para subir los datos del torneo por primera vez.");
                    sessionStorage.setItem('sync_warning_shown', 'true');
                }
            }
        }
    }, (error) => {
        console.error("❌ Error de sincronización Firebase:", error);
        updateStatus('offline');
    });
}

// Render results ticker V2 - Including Live, Finished and Upcoming
function renderTicker() {
    const tickerContainer = document.getElementById('ticker-results');
    if (!tickerContainer) return;

    // 1. Collect a diverse mix of matches
    const finished = tournamentData.matches
        .filter(m => m.status === 'finished' && m.scoreA !== null)
        .sort((a, b) => b.id - a.id); // Descendente: Los id más altos (últimos en crearse/actualizarse) primero

    const live = tournamentData.matches.filter(m => m.status === 'live' || m.status === 'in-play' || m.status === 'playing');
    const upcoming = tournamentData.matches.filter(m => m.status === 'pending').sort((a, b) => a.id - b.id).slice(0, 15);

    // Combine them: Live first, then Finished, then Upcoming
    let allTickerMatches = [...live, ...finished, ...upcoming];

    if (allTickerMatches.length === 0) {
        tickerContainer.innerHTML = '<span style="padding: 0 2rem; color: #888;">Cargando programación...</span>';
        return;
    }

    // 2. Multiply items for infinite billboard effect (targeting 40+ items)
    let itemsToDisplay = [...allTickerMatches];
    const targetCount = 40;
    while (itemsToDisplay.length < targetCount && allTickerMatches.length > 0) {
        itemsToDisplay = [...itemsToDisplay, ...allTickerMatches];
    }

    tickerContainer.innerHTML = itemsToDisplay.map(match => {
        const winnerA = match.status === 'finished' && match.scoreA > match.scoreB;
        const winnerB = match.status === 'finished' && match.scoreB > match.scoreA;
        const catSlug = (match.category || "").toLowerCase().replace(/ª/g, 'a').replace(/\s+/g, '-');
        const catClass = `cat-accent-${catSlug}`;

        let statusBadge = "";
        if (match.status === 'live' || match.status === 'playing' || match.status === 'in-play') {
            statusBadge = `<span class="broadcast-badge-live">EN JUEGO</span>`;
        } else if (match.status === 'pending') {
            statusBadge = `<span class="broadcast-badge">${match.time || "PROX."}</span>`;
        }

        return `
            <div class="ticker-item ticker-glass ticker-cat-${catSlug}" onclick="navigateToMatch(${match.id})">
                <span class="category-pill ${catClass}">${match.category}</span>
                <div class="ticker-match-content">
                    <span class="team-name ${winnerA ? 'ticker-winner-shimmer' : ''}">${match.teamA}</span>
                    <span class="ticker-score-box">${match.scoreA ?? 0}-${match.scoreB ?? 0}</span>
                    <span class="team-name ${winnerB ? 'ticker-winner-shimmer' : ''}">${match.teamB}</span>
                </div>
                ${statusBadge}
            </div>
        `;
    }).join('');
}

// Navigate to match when ticker item clicked
function navigateToMatch(matchId) {
    const match = tournamentData.matches.find(m => m.id === matchId);
    if (!match) return;

    // Switch to matches tab
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');

    const matchesBtn = document.querySelector('[data-tab="matches"]');
    const matchesTab = document.getElementById('matches-tab');

    if (matchesBtn) matchesBtn.classList.add('active');
    if (matchesTab) matchesTab.style.display = 'block';

    // Set category and render
    activeMatchesCat = match.category;
    renderMatches();

    // Highlight the match
    setTimeout(() => {
        const matchCard = document.querySelector(`[data-match-id="${matchId}"]`);
        if (matchCard) {
            matchCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            matchCard.style.animation = 'pulse 1s ease 2';
        }
    }, 100);
}

// Update header stats
function updateHeaderStats() {
    // Total matches played
    const totalPlayed = tournamentData.matches.filter(m => m.status === 'finished').length;
    const totalMatchesEl = document.getElementById('totalMatches');
    if (totalMatchesEl) totalMatchesEl.textContent = totalPlayed;

    // Live matches
    const liveCount = tournamentData.matches.filter(m => m.status === 'live' || m.status === 'in-play').length;
    const liveMatchesEl = document.getElementById('liveMatches');
    if (liveMatchesEl) liveMatchesEl.textContent = liveCount;

    // Pending matches (Partidos Pendientes)
    const pendingCount = tournamentData.matches.filter(m => m.status === 'pending').length;

    const nextMatchEl = document.getElementById('nextMatch');
    if (nextMatchEl) {
        nextMatchEl.textContent = pendingCount;
    }

    // Auto-show live feed if there are live matches
    const panel = document.getElementById('liveFeedPanel');
    if (panel && liveCount > 0) {
        panel.style.display = 'block';
        renderLiveFeed();
    } else if (panel && liveCount === 0) {
        panel.style.display = 'none';
    }
}

// Live Match Feed
function toggleLiveFeed() {
    const panel = document.getElementById('liveFeedPanel');
    if (!panel) return;

    const isVisible = panel.style.display !== 'none';
    panel.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
        renderLiveFeed();
    }
}

// Render live feed panel
function renderLiveFeed() {
    const container = document.getElementById('liveFeedContent');
    const panel = document.getElementById('liveFeedPanel');
    if (!container || !panel) return;

    const liveMatches = tournamentData.matches.filter(m =>
        m.status === 'live' || m.status === 'in-play' || m.status === 'playing'
    );

    if (liveMatches.length === 0) {
        panel.style.display = 'none';
        return;
    }

    panel.style.display = 'block';

    container.innerHTML = liveMatches.map(match => {
        const catSlug = (match.category || "").toLowerCase().replace(/[ªº]/g, 'a').replace(/\s+/g, '-');
        const catClass = `cat-accent-${catSlug}`;
        const stageLabel = (match.stage === 'group' ? `G${match.group}` : match.stage).toUpperCase();

        return `
            <div class="live-match-premium card-cat-${catSlug}" onclick="navigateToMatch(${match.id})">
                <div class="live-match-top">
                    <div class="live-match-cat">
                         <span class="cat-badge ${catClass}">${match.category}</span>
                         <span class="cat-badge" style="background:rgba(255,255,255,0.05); color:white;">${stageLabel}</span>
                    </div>
                    <div class="match-court-tag">
                        <i class="fas fa-satellite-dish"></i> ${match.court}
                    </div>
                </div>
                
                <div class="elite-scoreboard">
                    <div class="elite-score-row">
                        <span class="elite-player-name">${match.teamA}</span>
                        <div class="elite-score-led">${match.scoreA ?? 0}</div>
                    </div>
                    <div class="elite-score-row">
                        <span class="elite-player-name">${match.teamB}</span>
                        <div class="elite-score-led">${match.scoreB ?? 0}</div>
                    </div>
                </div>

                <div class="elite-footer">
                    <div class="live-signal">
                        <div class="signal-dot"></div> SEÑAL EN VIVO
                    </div>
                    <div class="match-time-tag">${match.time || ''}</div>
                </div>
            </div>
        `;
    }).join('');
}

// --- CORE LOGIC ---

function getStandings(category, group) {
    const matches = tournamentData.matches.filter(m => m.category === category && m.group === group);
    const stats = {};

    matches.forEach(m => {
        [m.teamA, m.teamB].forEach(team => {
            if (!stats[team]) stats[team] = { name: team, played: 0, won: 0, lost: 0, points: 0, gf: 0, ga: 0, diff: 0 };
        });
    });

    matches.forEach(m => {
        if (m.status === 'finished') {
            stats[m.teamA].played++;
            stats[m.teamB].played++;

            const sA = parseInt(m.scoreA) || 0;
            const sB = parseInt(m.scoreB) || 0;

            stats[m.teamA].gf += sA;
            stats[m.teamA].ga += sB;
            stats[m.teamA].diff = stats[m.teamA].gf - stats[m.teamA].ga;

            stats[m.teamB].gf += sB;
            stats[m.teamB].ga += sA;
            stats[m.teamB].diff = stats[m.teamB].gf - stats[m.teamB].ga;

            if (sA > sB) {
                stats[m.teamA].points += 3;
                stats[m.teamA].won++;
                stats[m.teamB].lost++;
            } else if (sB > sA) {
                stats[m.teamB].points += 3;
                stats[m.teamB].won++;
                stats[m.teamA].lost++;
            } else {
                stats[m.teamA].points += 1;
                stats[m.teamB].points += 1;
            }
        }
    });

    return Object.values(stats).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.diff - a.diff;
    });
}

function updatePlayoffCalculations() {
    tournamentData.categories.forEach(cat => {
        const catMatches = tournamentData.matches.filter(m => m.category === cat && (!m.stage || m.stage === 'group'));
        const groups = [...new Set(catMatches.map(m => m.group))].sort();
        const standingsMap = {};
        const groupStartedMap = {};

        groups.forEach(g => {
            standingsMap[g] = getStandings(cat, g);
            // Check if any match in this group is finished or has score (started)
            const groupMatches = catMatches.filter(m => m.group === g);
            groupStartedMap[g] = groupMatches.some(m => m.status === 'finished');
        });

        const quarters = tournamentData.matches.filter(m => m.category === cat && m.stage === 'quarter');
        const semis = tournamentData.matches.filter(m => m.category === cat && m.stage === 'semi');
        const final = tournamentData.matches.find(m => m.category === cat && m.stage === 'final');

        const getTeam = (group, pos) => {
            // Only show name if group has started (at least one match finished)
            // Or better: show name if points > 0? No, 'started' is safer 
            // for early feedback. But for "Reset", 'finished' count is 0.
            if (!groupStartedMap[group]) return `${pos}º Grupo ${group}`;

            if (standingsMap[group] && standingsMap[group][pos - 1]) return standingsMap[group][pos - 1].name;
            return `TBD (Group ${group})`;
        };

        const getWinner = (stageMatchName) => {
            const m = tournamentData.matches.find(match => match.category === cat && match.matchName === stageMatchName);
            if (m && m.status === 'finished') {
                const sA = parseInt(m.scoreA || 0);
                const sB = parseInt(m.scoreB || 0);
                if (sA > sB) return m.teamA;
                if (sB > sA) return m.teamB;
            }
            return `Ganador ${stageMatchName}`;
        };

        if (quarters.length === 4) {
            if (groups.length === 4) {
                quarters[0].teamA = getTeam('A', 1); quarters[0].teamB = getTeam('D', 2);
                quarters[1].teamA = getTeam('B', 1); quarters[1].teamB = getTeam('C', 2);
                quarters[2].teamA = getTeam('C', 1); quarters[2].teamB = getTeam('B', 2);
                quarters[3].teamA = getTeam('D', 1); quarters[3].teamB = getTeam('A', 2);
            } else if (groups.length === 3) {
                // Formatting for 3 groups (e.g. 4a Femenina)
                // Top 2 from each + 2 best 3rds or similar. 
                // For simplicity: 1A vs 3B*, 2B vs 2C, 1B vs 3A*, 1C vs 2A
                quarters[0].teamA = getTeam('A', 1); quarters[0].teamB = "3º Mejor (1)";
                quarters[1].teamA = getTeam('B', 2); quarters[1].teamB = getTeam('C', 2);
                quarters[2].teamA = getTeam('B', 1); quarters[2].teamB = "3º Mejor (2)";
                quarters[3].teamA = getTeam('C', 1); quarters[3].teamB = getTeam('A', 2);
            }
        }

        if (semis.length === 2) {
            if (quarters.length === 4) {
                semis[0].teamA = getWinner('Cuartos 1'); semis[0].teamB = getWinner('Cuartos 2');
                semis[1].teamA = getWinner('Cuartos 3'); semis[1].teamB = getWinner('Cuartos 4');
            } else if (groups.length === 2) {
                semis[0].teamA = getTeam('A', 1); semis[0].teamB = getTeam('B', 2);
                semis[1].teamA = getTeam('B', 1); semis[1].teamB = getTeam('A', 2);
            } else if (cat === "3ª Masculina") {
                semis[0].teamA = getTeam('A', 1); semis[0].teamB = getTeam('A', 4);
                semis[1].teamA = getTeam('A', 2); semis[1].teamB = getTeam('A', 3);
            }
        }

        if (final) {
            if (semis.length === 2) {
                final.teamA = getWinner('Semi 1'); final.teamB = getWinner('Semi 2');
            } else if (groups.length === 1 && !semis.length) {
                final.teamA = getTeam('A', 1); final.teamB = getTeam('A', 2);
            }
        }
    });
}

// --- UI INIT ---

function init() {
    // Only run if basic UI elements exist (Dashboard)
    if (document.getElementById('brackets-container')) {
        updateUI();

        // Navigation
        const navBtns = document.querySelectorAll('.nav-btn[data-tab]');
        navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
                e.target.classList.add('active');
                document.getElementById(`${e.target.dataset.tab}-tab`).style.display = 'block';

                // Refresh specific views just in case
                if (btn.dataset.tab === 'playoffs') renderBrackets();
                if (btn.dataset.tab === 'matches') renderMatches();
                if (btn.dataset.tab === 'schedule') renderSchedule();
                if (btn.dataset.tab === 'standings') renderStandings();
                if (btn.dataset.tab === 'stats') {
                    try {
                        if (typeof initStats === 'function') initStats();
                    } catch (e) { console.error("Error initializing stats tab:", e); }
                }
            });
        });

        // Search
        const searchInput = document.getElementById('standings-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                renderStandings(); // Re-render to support global search
            });
        }

        const matchSearchInput = document.getElementById('matches-search');
        if (matchSearchInput) {
            matchSearchInput.addEventListener('input', (e) => {
                renderMatches();
            });
        }
    }
}

function updateUI() {
    if (!tournamentData) return;

    // Init Defaults if missing (safety)
    if (!activeStandingsCat && tournamentData.categories.length > 0) activeStandingsCat = tournamentData.categories[0];
    if (!activeMatchesCat && tournamentData.categories.length > 0) activeMatchesCat = tournamentData.categories[0];
    if (!activePlayoffCat && tournamentData.categories.length > 0) activePlayoffCat = tournamentData.categories[0];

    renderCategoryTabs('standings-categories', activeStandingsCat, (cat) => {
        activeStandingsCat = cat;
        renderStandings();
    });

    renderCategoryTabs('matches-categories', activeMatchesCat, (cat) => {
        activeMatchesCat = cat;
        renderMatches();
    });

    renderCategoryTabs('playoffs-categories', activePlayoffCat, (cat) => {
        activePlayoffCat = cat;
        renderBrackets();
    });

    renderStandings();
    renderMatches();
    renderSchedule();
    renderBrackets();
    try {
        if (typeof renderStatsCharts === 'function') renderStatsCharts();
    } catch (e) { console.error("Error rendering initial stats:", e); }
    renderTicker(); // Initialize ticker with results
    initCarousel(); // Initialize sponsor carousel
    updateHeaderStats(); // Update header stats
}

function renderCategoryTabs(containerId, activeCat, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    tournamentData.categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `sub-nav-btn ${cat === activeCat ? 'active' : ''}`;
        btn.textContent = cat;
        btn.onclick = () => {
            onSelect(cat);
            // Manually update active class
            const all = container.querySelectorAll('.sub-nav-btn');
            all.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
        container.appendChild(btn);
    });
}

// --- SCHEDULE HUB GENERATION ---
let activeScheduleCat = null;
let isAdminScheduleMode = false;

function toggleScheduleEditor() {
    isAdminScheduleMode = !isAdminScheduleMode;
    const gridView = document.getElementById('admin-matches-grid') || document.getElementById('admin-matches-list');
    const editorView = document.getElementById('admin-schedule-editor');
    const btn = document.querySelector('[onclick="toggleScheduleEditor()"]');

    if (isAdminScheduleMode) {
        if (gridView) gridView.style.display = 'none';
        if (editorView) editorView.style.display = 'block';
        if (btn) {
            btn.innerHTML = '<i class="fas fa-list"></i> Ver Lista de Partidos';
            btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        }
        renderSchedule(true);
    } else {
        if (gridView) gridView.style.display = 'grid';
        if (editorView) editorView.style.display = 'none';
        if (btn) {
            btn.innerHTML = '<i class="fas fa-calendar-edit"></i> Editor de Programación';
            btn.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)';
        }
        initAdmin();
    }
}

function renderSchedule(isAdmin = false) {
    const containerId = isAdmin ? 'admin-schedule-grid-container' : 'schedule-grid-container';
    const container = document.getElementById(containerId);
    if (!container) return;

    // Determine Dynamic Time Slots and Courts
    const allMatches = tournamentData.matches;
    const uniqueTimes = [...new Set(allMatches.map(m => m.time || 'TBD'))].sort((a, b) => {
        if (a === 'TBD') return 1;
        if (b === 'TBD') return -1;
        return a.localeCompare(b);
    });

    // Ensure standard slots are included if empty, or just use what we have
    const timeSlots = uniqueTimes.length > 0 ? uniqueTimes : ["13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"];

    const uniqueCourts = [...new Set(allMatches.map(m => m.court || 'Pista ?'))].sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 999;
        const numB = parseInt(b.replace(/\D/g, '')) || 999;
        return numA - numB;
    });

    // Always show at least 14 courts if it's the standard, but include others if they exist
    let courts = Array.from({ length: 14 }, (_, i) => `Pista ${i + 1}`);
    uniqueCourts.forEach(c => { if (!courts.includes(c)) courts.push(c); });

    // Unified View
    container.innerHTML = `<div class="schedule-grid" id="${isAdmin ? 'admin-' : ''}main-schedule-grid" style="grid-template-columns: 100px repeat(${courts.length}, minmax(180px, 1fr));"></div>`;
    const grid = document.getElementById(`${isAdmin ? 'admin-' : ''}main-schedule-grid`);

    // Add HORAs Header Cell
    const timeHeader = document.createElement('div');
    timeHeader.className = 'grid-header-cell time-column-header';
    timeHeader.textContent = 'HORA';
    grid.appendChild(timeHeader);

    // Add Court Header Cells
    courts.forEach(court => {
        const courtHeader = document.createElement('div');
        courtHeader.className = 'grid-header-cell';
        courtHeader.textContent = court;
        grid.appendChild(courtHeader);
    });

    const scheduleMap = {};
    allMatches.forEach(m => {
        const key = `${m.time || 'TBD'}-${m.court || 'Pista ?'}`;
        if (!scheduleMap[key]) scheduleMap[key] = [];
        scheduleMap[key].push(m);
    });

    timeSlots.forEach(time => {
        // Add Time Cell
        const timeCell = document.createElement('div');
        timeCell.className = 'time-cell';
        timeCell.textContent = time;
        grid.appendChild(timeCell);

        courts.forEach(court => {
            const matches = scheduleMap[`${time}-${court}`] || [];
            const cell = document.createElement('div');
            cell.className = 'grid-match-cell';

            if (matches.length > 0) {
                matches.forEach(match => {
                    const catClass = getCategoryClass(match.category);
                    const stageClass = match.stage ? `pill-stage-${match.stage}` : '';
                    const statusClass = match.status === 'live' ? 'pill-live' : (match.status === 'finished' ? 'pill-finished' : '');

                    const pill = document.createElement('div');
                    pill.className = `schedule-match-pill pill-cat-${catClass} ${stageClass} ${statusClass}`;
                    pill.onclick = () => isAdmin ? adminEditMatch(match.id) : navigateToMatch(match.id);

                    let scoreHtml = '';
                    if (match.status === 'finished' || match.status === 'live') {
                        scoreHtml = `<div class="sm-pill-score">${match.scoreA ?? 0} - ${match.scoreB ?? 0}</div>`;
                    }

                    pill.innerHTML = `
                        <div class="sm-pill-header">
                            <span class="sm-pill-cat">${match.category}</span>
                            <span class="sm-pill-group">${match.group ? 'G.' + match.group : (match.matchName || '')}</span>
                        </div>
                        <div class="sm-pill-players">
                            ${match.teamA}<br>
                            ${match.teamB}
                        </div>
                        ${scoreHtml}
                    `;
                    cell.appendChild(pill);
                });
            } else if (isAdmin) {
                const addBtn = document.createElement('div');
                addBtn.className = 'admin-add-slot';
                addBtn.onclick = () => adminAddMatch(time, court);
                addBtn.innerHTML = `<i class="fas fa-plus-circle"></i> ADD`;
                cell.appendChild(addBtn);
            }
            grid.appendChild(cell);
        });
    });
}

function adminAddMatch(time, court) {
    const category = prompt("Categoría (ej: 4ª Femenina, 4ª Mixta, 4ª Masculina, 3ª Mixta, 3ª Masculina):", "4ª Mixta");
    if (!category) return;

    const type = confirm("¿Es un partido de FASE FINAL (Aceptar) o GRUPOS (Cancelar)?");
    let stage = "";
    let group = "";

    if (type) {
        stage = prompt("Fase (quarter, semi, final):", "quarter");
    } else {
        group = prompt("Grupo (ej: 1, 2, A, B):", "1");
    }

    const teamA = prompt("Jugadora/Equipo A:", "TBD");
    const teamB = prompt("Jugadora/Equipo B:", "TBD");

    if (teamA && teamB) {
        const newMatch = {
            id: Date.now(), // Generate unique ID
            category: category,
            group: group,
            stage: stage,
            time: time,
            court: court,
            teamA: teamA,
            teamB: teamB,
            scoreA: 0,
            scoreB: 0,
            status: "PENDIENTE",
            winner: null
        };

        tournamentData.matches.push(newMatch);
        saveState().then(() => {
            renderSchedule(true);
        });
    }
}

function adminEditMatch(matchId) {
    const match = tournamentData.matches.find(m => m.id === matchId);
    if (!match) return;

    const action = prompt(
        `PARTIDO: ${match.teamA} vs ${match.teamB}\n` +
        `----------------------------------------\n` +
        `1. Editar Horario/Pista (${match.time} / ${match.court})\n` +
        `2. Editar Equipos/Categoría\n` +
        `3. Editar Resultado (${match.scoreA} - ${match.scoreB})\n` +
        `4. Cambiar Estado (${match.status})\n` +
        `5. ELIMINAR PARTIDO\n` +
        `6. Cancelar`,
        "1"
    );

    if (action === "1") {
        const newTime = prompt("Nueva Hora (ej: 14:30):", match.time);
        const newCourt = prompt("Nueva Pista (ej: Pista 5):", match.court);

        if (newTime !== null) match.time = newTime.trim();
        if (newCourt !== null) match.court = newCourt.trim();

        saveState().then(() => renderSchedule(true));
    } else if (action === "2") {
        const newCat = prompt("Categoría:", match.category);
        if (newCat) match.category = newCat;

        if (!match.stage || match.stage === 'group') {
            const newGroup = prompt("Grupo:", match.group);
            if (newGroup) match.group = newGroup;
        } else {
            const newStage = prompt("Fase (quarter, semi, final):", match.stage);
            const newName = prompt("Nombre del partido (ej: Cuartos 1):", match.matchName);
            if (newStage) match.stage = newStage;
            if (newName) match.matchName = newName;
        }

        const newTeamA = prompt("Equipo A:", match.teamA);
        if (newTeamA) match.teamA = newTeamA;

        const newTeamB = prompt("Equipo B:", match.teamB);
        if (newTeamB) match.teamB = newTeamB;

        saveState().then(() => renderSchedule(true));
    } else if (action === "3") {
        const sA = prompt("Resultado Equipo A:", match.scoreA ?? 0);
        const sB = prompt("Resultado Equipo B:", match.scoreB ?? 0);
        if (sA !== null) match.scoreA = parseInt(sA) || 0;
        if (sB !== null) match.scoreB = parseInt(sB) || 0;

        saveState().then(() => renderSchedule(true));
    } else if (action === "4") {
        const newStatus = prompt("Nuevo Estado (pending, live, finished):", match.status);
        if (newStatus && ['pending', 'live', 'finished'].includes(newStatus.toLowerCase())) {
            match.status = newStatus.toLowerCase();
            saveState().then(() => renderSchedule(true));
        }
    } else if (action === "5") {
        if (confirm(`¿Estás seguro de que quieres eliminar COMPLETAMENTE el partido ${match.teamA} vs ${match.teamB}?`)) {
            tournamentData.matches = tournamentData.matches.filter(m => m.id !== matchId);
            saveState().then(() => renderSchedule(true));
        }
    }
}

function getCategoryClass(cat) {
    if (!cat) return 'default';
    if (cat.includes('4ª Femenina')) return '4fem';
    if (cat.includes('4ª Mixta')) return '4mix';
    if (cat.includes('4ª Masculina')) return '4masc';
    if (cat.includes('3ª Mixta')) return '3mix';
    if (cat.includes('3ª Masculina')) return '3masc';
    return 'default';
}

function renderStandings() {
    const container = document.getElementById('groups-container');
    if (!container) return;
    container.innerHTML = '';

    const searchTermRaw = document.getElementById('standings-search')?.value.trim();
    const searchTerm = normalizeText(searchTermRaw);
    let categoriesToRender = [];

    if (searchTerm && searchTerm.length > 0) {
        // Global Search: Render ALL categories that have matching groups/players
        categoriesToRender = tournamentData.categories;
        const tabs = document.getElementById('standings-categories');
        if (tabs) tabs.style.display = 'none'; // Hide tabs when searching
    } else {
        // Standard View: Render active category
        const tabs = document.getElementById('standings-categories');
        if (tabs) tabs.style.display = 'flex'; // Show tabs
        if (activeStandingsCat) categoriesToRender = [activeStandingsCat];
    }

    // Dedup to prevent double rendering
    categoriesToRender = [...new Set(categoriesToRender)];

    let foundAny = false;

    categoriesToRender.forEach(cat => {
        const catMatches = tournamentData.matches.filter(m => m.category === cat);
        let catGroups = [...new Set(catMatches.filter(m => !m.stage || m.stage === 'group').map(m => m.group))].sort();

        catGroups.forEach(grp => {
            const standings = getStandings(cat, grp);

            // If searching, filter to only groups containing the term
            if (searchTerm && searchTerm.length > 0) {
                const matchesTerm = standings.some(s => normalizeText(s.name).includes(searchTerm));
                if (!matchesTerm) return; // Skip this group
            }

            foundAny = true;
            const section = document.createElement('div');
            section.className = 'group-section';

            let html = `
                <div class="group-card-container">
                    <h3 class="category-header" style="border-bottom: 3px solid var(--brand-volt); display: block; width: 100%; color: #111; margin-bottom: 1rem; font-size: 1.4rem;">${cat} - GRUPO ${grp}</h3>
                    <div class="table-container">
                        <table class="premium-table">
                            <thead>
                                <tr>
                                    <th>Equipo</th><th>PTS</th><th>PJ</th><th>PG</th><th>PP</th><th>DIF</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            standings.forEach((team, index) => {
                const isMatch = searchTerm && normalizeText(team.name).includes(searchTerm);
                const highlightClass = isMatch ? 'search-highlight' : '';
                const rankClass = index < 2 ? `rank-${index + 1} winner-highlight` : `rank-${index + 1}`;

                html += `
                    <tr class="${rankClass} ${highlightClass}">
                        <td>${team.name}</td>
                        <td style="background: rgba(0,0,0,0.03);">${team.points}</td>
                        <td>${team.played}</td>
                        <td>${team.won}</td>
                        <td>${team.lost}</td>
                        <td style="color: ${team.diff >= 0 ? '#16a34a' : '#dc2626'}">${team.diff}</td>
                    </tr>
                `;
            });

            html += `</tbody></table></div></div>`;
            section.innerHTML = html;
            container.appendChild(section);
        });
    });

    if (!foundAny) {
        container.innerHTML = '<div style="text-align:center; padding: 2rem; color: #888;">No se encontraron resultados.</div>';
    }
}

function renderMatches() {
    const container = document.getElementById('matches-container');
    if (!container) return;
    container.innerHTML = '';
    const cat = activeMatchesCat;
    const searchEl = document.getElementById('matches-search');
    const searchTerm = searchEl ? searchEl.value.toLowerCase().trim() : '';

    if (!cat && !searchTerm) return;

    let visibleMatches;

    if (searchTerm) {
        // GLOBAL SEARCH: Search all matches, ignore category, include playoffs if matches found
        const tabs = document.getElementById('matches-categories');
        if (tabs) tabs.style.display = 'none'; // Hide category tabs during global search

        const normTerm = normalizeText(searchTerm);

        visibleMatches = tournamentData.matches.filter(m =>
            normalizeText(m.teamA).includes(normTerm) ||
            normalizeText(m.teamB).includes(normTerm) ||
            normalizeText(m.group).includes(normTerm) ||
            normalizeText(m.category).includes(normTerm)
        );
    } else {
        // STANDARD VIEW: Filter by Category and Group Stage only (default for this tab)
        const tabs = document.getElementById('matches-categories');
        if (tabs) tabs.style.display = 'flex'; // Show tabs
        visibleMatches = tournamentData.matches.filter(m => m.category === cat && (!m.stage || m.stage === 'group'));
    }

    visibleMatches.sort((a, b) => a.time.localeCompare(b.time) || a.court.localeCompare(b.court));

    visibleMatches.forEach(match => {
        const isFinished = match.status === 'finished';
        const card = document.createElement('div');
        const timeClass = getTimeClass(match.time);
        card.className = `match-card ${timeClass}`;
        card.setAttribute('data-match-id', match.id); // For ticker navigation
        card.innerHTML = `
            <div class="card-header">
                <span>${match.category} - G.${match.group}</span>
                <span class="court-badge">${match.court} | ${match.time}</span>
            </div>
            <div class="card-body">
                <div class="team-row ${isFinished && parseInt(match.scoreA) > parseInt(match.scoreB) ? 'winner' : ''}">
                    <span class="team-name">${match.teamA}</span>
                    <span class="team-score">${match.scoreA ?? '-'}</span>
                </div>
                <div class="team-row ${isFinished && parseInt(match.scoreB) > parseInt(match.scoreA) ? 'winner' : ''}">
                    <span class="team-name">${match.teamB}</span>
                    <span class="team-score">${match.scoreB ?? '-'}</span>
                </div>
            </div>
            <div class="card-footer">
                <span class="status-pill ${match.status === 'live' ? 'status-live' : (match.status === 'finished' ? 'status-finished' : 'status-pending')}">
                    ${match.status === 'live' ? 'EN JUEGO' : (match.status === 'finished' ? 'FINALIZADO' : 'PENDIENTE')}
                </span>
            </div>
        `;
        container.appendChild(card);
    });
}

// --- ADMIN LOGIC ---

function initAdmin() {

    const list = document.getElementById('admin-matches-grid') || document.getElementById('admin-matches-list');
    if (!list) return;

    if (!activeAdminCat && tournamentData.categories.length > 0) activeAdminCat = tournamentData.categories[0];
    if (!activeAdminPhase) activeAdminPhase = 'group';

    // Phase Nav & Search Container
    let phaseNav = document.getElementById('admin-phase-nav');
    if (!phaseNav) {
        phaseNav = document.createElement('div');
        phaseNav.id = 'admin-phase-nav';
        phaseNav.className = 'admin-phase-nav';
        phaseNav.style.display = 'flex';
        phaseNav.style.justifyContent = 'center';
        phaseNav.style.alignItems = 'center'; // Align vertical
        phaseNav.style.gap = '1.5rem';
        phaseNav.style.marginBottom = '2rem';
        const subNav = document.getElementById('admin-categories');
        if (subNav) subNav.parentNode.insertBefore(phaseNav, subNav);
    }

    // Preserve search value if re-rendering
    const existingSearch = document.getElementById('adminSearch');
    const searchValue = existingSearch ? existingSearch.value : '';

    phaseNav.innerHTML = '';

    // 1. Phase Buttons
    const phases = [{ id: 'group', label: 'FASE DE GRUPOS' }, { id: 'playoff', label: 'ELIMINATORIAS' }];
    phases.forEach(p => {
        const btn = document.createElement('button');
        btn.className = `action-btn ${activeAdminPhase === p.id ? 'active-orange' : ''}`;
        btn.textContent = p.label;
        if (activeAdminPhase === p.id && p.id === 'group') btn.style.background = 'var(--brand-volt)';
        btn.onclick = () => setAdminPhase(p.id);
        phaseNav.appendChild(btn);
    });

    // 2. Search Bar Injection
    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'admin-search-container'; // New class for layout
    searchWrapper.innerHTML = `
        <input type="text" id="adminSearch" class="admin-search" 
               placeholder="🔍 Buscar en TODAS las categorías..." 
               value="${searchValue}"
               oninput="initAdmin()" autofocus>
    `;
    phaseNav.appendChild(searchWrapper);

    // Keep focus (hacky but needed for re-render)
    setTimeout(() => {
        const inp = document.getElementById('adminSearch');
        if (inp && searchValue) {
            inp.focus();
            inp.setSelectionRange(inp.value.length, inp.value.length);
        }
    }, 0);

    const adminCatContainer = document.getElementById('admin-categories');
    if (adminCatContainer) {
        if (activeAdminPhase === 'playoff') adminCatContainer.classList.add('phase-playoff');
        else adminCatContainer.classList.remove('phase-playoff');
    }

    renderCategoryTabs('admin-categories', activeAdminCat, (cat) => {
        activeAdminCat = cat;
        initAdmin();
    });

    list.innerHTML = '';

    // START FILTERING LOGIC
    let filtered = tournamentData.matches; // Start with ALL matches
    const currentSearchTerm = searchValue.toLowerCase().trim();

    if (currentSearchTerm.length > 0) {
        // GLOBAL SEARCH MODE
        filtered = filtered.filter(m =>
            m.teamA.toLowerCase().includes(currentSearchTerm) ||
            m.teamB.toLowerCase().includes(currentSearchTerm) ||
            (m.court && m.court.toLowerCase().includes(currentSearchTerm)) ||
            (m.group && m.group.toString().toLowerCase().includes(currentSearchTerm)) ||
            (m.matchName && m.matchName.toLowerCase().includes(currentSearchTerm))
        );
        // Show all phases during search or keep phase filter? 
        // User said "find any player of any category", implying ignoring category.
        // Usually, removing category constraint is enough. 
        // We will Apply Phase Filter ONLY if explicitly requested, but for "Global Search" implies finding it anywhere. 
        // Let's Keep Phase Filter loose or remove it?
        // Better: Search globally across ALL phases and categories.
    } else {
        // NORMAL NAV MODE
        filtered = filtered.filter(m => m.category === activeAdminCat);

        if (activeAdminPhase === 'group') {
            filtered = filtered.filter(m => !m.stage || m.stage === 'group');
        } else {
            filtered = filtered.filter(m => ['quarter', 'semi', 'final'].includes(m.stage));
        }
    }

    // Sort Logic
    if (activeAdminSort === 'time') {
        filtered.sort((a, b) => {
            if (a.time === 'TBD') return 1;
            if (b.time === 'TBD') return -1;
            return a.time.localeCompare(b.time) || a.id - b.id;
        });
    } else {
        filtered.sort((a, b) => a.id - b.id);
    }


    filtered.forEach(match => {
        const item = document.createElement('div');
        // Add stage class if active phase is playoff, OR time class if group
        let specialClass = '';
        if (activeAdminPhase === 'playoff' && match.stage) {
            specialClass = `stage-${match.stage}`;
        } else if (activeAdminPhase === 'group') {
            specialClass = getTimeClass(match.time);
        }

        item.className = `admin-match-card ${specialClass}`;

        const headerHTML = activeAdminPhase === 'playoff'
            ? `
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <div style="font-weight:900; color:var(--brand-volt);">${match.matchName}</div>
                    <div class="amc-header-details" style="font-size:0.75rem; opacity:0.8;">
                        <span class="editable-detail" onclick="editMatchDetail(${match.id}, 'time')">${match.time || 'TBD'}</span>
                        <span>-</span>
                        <span class="editable-detail" onclick="editMatchDetail(${match.id}, 'court')">${match.court || 'TBD'}</span>
                    </div>
                </div>
            `
            : `
                <div class="amc-header-details">
                    <span class="editable-detail" onclick="editMatchDetail(${match.id}, 'time')">${match.time}</span>
                    <span>-</span>
                    <span class="editable-detail" onclick="editMatchDetail(${match.id}, 'court')">${match.court}</span>
                </div>
            `;

        item.innerHTML = `
            <div class="amc-header">
                ${headerHTML}
                <div class="amc-cat">${match.category}</div>
            </div>
            <div class="amc-body">
                <div class="amc-team-row">
                    <span class="amc-team-name editable" onclick="editTeamName(${match.id}, 'teamA')">${match.teamA}</span>
                    <div class="amc-score-control">
                        <button class="ctrl-btn btn-minus" onclick="updateScore(${match.id}, 'teamA', -1)">-</button>
                        <span class="score-val">${(match.scoreA == null || isNaN(match.scoreA)) ? 0 : match.scoreA}</span>
                        <button class="ctrl-btn btn-plus" onclick="updateScore(${match.id}, 'teamA', 1)">+</button>
                    </div>
                </div>
                <div class="amc-team-row">
                    <span class="amc-team-name editable" onclick="editTeamName(${match.id}, 'teamB')">${match.teamB}</span>
                    <div class="amc-score-control">
                        <button class="ctrl-btn btn-minus" onclick="updateScore(${match.id}, 'teamB', -1)">-</button>
                        <span class="score-val">${(match.scoreB == null || isNaN(match.scoreB)) ? 0 : match.scoreB}</span>
                        <button class="ctrl-btn btn-plus" onclick="updateScore(${match.id}, 'teamB', 1)">+</button>
                    </div>
                </div>
            </div>
            <div class="amc-footer">
                <span class="amc-status ${match.status === 'finished' || match.status === 'live' ? 'live' : ''}">
                    ${match.status === 'finished' ? 'FINALIZADO' : (match.status === 'live' ? '🔴 EN JUEGO' : 'PENDIENTE')}
                </span>
                <button class="btn-reopen" onclick="toggleMatchStatus(${match.id})">
                    ${match.status === 'pending' ? 'INICIAR' : (match.status === 'live' ? 'FINALIZAR' : 'REABRIR')}
                </button>
            </div>
        `;
        list.appendChild(item);
    });
}

function editTeamName(matchId, teamKey) {
    const match = tournamentData.matches.find(m => m.id === matchId);
    if (!match) return;

    const currentName = match[teamKey];
    const newName = prompt("Editar nombre del jugador/pareja:", currentName);

    if (newName && newName.trim() !== "" && newName !== currentName) {
        if (confirm(`¿Cambiar "${currentName}" por "${newName}" en TODOS los partidos del torneo?`)) {
            // Global Update
            let count = 0;
            tournamentData.matches.forEach(m => {
                if (m.teamA === currentName) { m.teamA = newName; count++; }
                if (m.teamB === currentName) { m.teamB = newName; count++; }
            });
            alert(`Actualizado en ${count} partidos.`);
        } else {
            // Local Update
            match[teamKey] = newName;
        }
        saveState();
        initAdmin();
    }
}

function editMatchDetail(matchId, field) {
    const match = tournamentData.matches.find(m => m.id === matchId);
    if (!match) return;

    const currentVal = match[field];
    const label = field === 'time' ? 'Horario (ej: 13:30)' : 'Pista (ej: Pista 5)';
    const newVal = prompt(`Editar ${label}:`, currentVal);

    if (newVal !== null && newVal.trim() !== "" && newVal !== currentVal) {
        match[field] = newVal.trim();
        saveState();
        initAdmin();
    }
}

function getTimeClass(time) {
    if (!time) return '';
    const t = time.trim();
    if (t === '13:30') return 'time-slot-1'; // Pink
    if (t === '14:00') return 'time-slot-2'; // Cyan
    if (t === '14:30') return 'time-slot-3'; // Volt
    if (t === '15:00') return 'time-slot-4'; // Violet
    if (t === '15:30') return 'time-slot-5'; // Orange
    if (t >= '16:00') return 'time-slot-6';  // Red
    return '';
}

function setAdminPhase(phase) {
    activeAdminPhase = phase;
    initAdmin();
}

function toggleAdminSort() {
    activeAdminSort = activeAdminSort === 'id' ? 'time' : 'id';
    initAdmin();
    // Update button text
    const btn = document.getElementById('btn-sort');
    const txt = document.getElementById('sort-text');
    if (btn && txt) {
        txt.textContent = activeAdminSort === 'time' ? 'Orden: Hora' : 'Orden: ID';
    }
}

function updateScore(id, team, delta) {
    const match = tournamentData.matches.find(m => m.id === id);
    if (match) {
        // Fix improper values (undefined, null, NaN)
        if (match.scoreA == null || isNaN(match.scoreA)) match.scoreA = 0;
        if (match.scoreB == null || isNaN(match.scoreB)) match.scoreB = 0;

        if (team === 'teamA') match.scoreA = Math.max(0, parseInt(match.scoreA) + delta);
        else match.scoreB = Math.max(0, parseInt(match.scoreB) + delta);
        saveState();
        initAdmin();
    }
}

function toggleMatchStatus(id) {
    const match = tournamentData.matches.find(m => m.id === id);
    if (match) {
        // Cycle: pending → live → finished → pending
        if (match.status === 'pending') {
            match.status = 'live';
        } else if (match.status === 'live') {
            match.status = 'finished';
        } else {
            match.status = 'pending';
        }
        saveState();
        initAdmin();
        renderLiveFeed(); // Update live feed
    }
}

function simularGrupos() {
    if (!confirm("⚠️ ¿Estás seguro? Se generarán resultados aleatorios para TODOS los partidos de Fase de Grupos.")) return;
    let counting = 0;
    tournamentData.matches.forEach(m => {
        if (!m.stage || m.stage === 'group') {
            m.scoreA = Math.floor(Math.random() * 6) + 1;
            m.scoreB = Math.floor(Math.random() * 6) + 1;
            while (m.scoreA === m.scoreB) m.scoreB = Math.floor(Math.random() * 6) + 1;
            m.status = 'finished';
            counting++;
        }
    });
    saveState().then(() => {
        alert(`Se han simulado ${counting} resultados.`);
        location.reload();
    });
}

function resetTotalScores() {
    if (!confirm("⛔ PELIGRO: ¿REGENERAR TODO EL TORNEO? \n\nEsto borrará todos los resultados actuales y creará la estructura limpia de 75 PARTIDOS.\n\n¿Proceder?")) return;

    localStorage.removeItem('tournamentData');
    tournamentData = generateInitialData();

    saveState().then(() => {
        alert(`Torneo regenerado con éxito.`);
        location.reload();
    });
}

function exportData() {
    const dataStr = JSON.stringify(tournamentData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tournament_backup_${new Date().getTime()}.json`;
    link.click();

    // Also copy to clipboard for convenience
    navigator.clipboard.writeText(dataStr).then(() => {
        alert("✅ Datos copiados al portapapeles y descargados en un archivo JSON.\n\nPégamelos aquí para que yo pueda 'grabarlos' permanentemente en el código.");
    });
}

// --- DASHBOARD BRACKETS ---

function renderBrackets() {
    const container = document.getElementById('brackets-container');
    if (!container) return;
    container.innerHTML = '';
    const cat = activePlayoffCat;
    if (!cat) return;

    const quarters = tournamentData.matches.filter(m => m.category === cat && m.stage === 'quarter');
    const semis = tournamentData.matches.filter(m => m.category === cat && m.stage === 'semi');
    const final = tournamentData.matches.find(m => m.category === cat && m.stage === 'final');

    if (!quarters.length && !semis.length && !final) {
        container.innerHTML = '<div style="text-align:center; padding: 4rem; color: #666; font-size: 1.2rem;">Las eliminatorias para esta categoría aún no han comenzado.</div>';
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'brackets-wrapper';
    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'bracket-scroll-container';
    const tree = document.createElement('div');
    tree.className = 'chess-tree';

    // QUARTERS
    if (quarters.length > 0) {
        const roundQ = document.createElement('div');
        roundQ.className = 'tree-round round-quarters active';
        roundQ.innerHTML = '<div class="round-title">CUARTOS</div>';
        quarters.forEach((m, idx) => {
            const node = createBracketNode(m);
            const pairDiv = document.createElement('div');
            pairDiv.className = 'match-pair';
            pairDiv.appendChild(node);
            if (idx % 2 === 0) {
                const fork = document.createElement('div');
                fork.className = 'connector-fork';
                pairDiv.appendChild(fork);
            }
            roundQ.appendChild(pairDiv);
        });
        tree.appendChild(roundQ);
    }

    // SEMIS
    if (semis.length > 0) {
        const roundS = document.createElement('div');
        roundS.className = 'tree-round round-semis active';
        roundS.innerHTML = '<div class="round-title">SEMIFINALES</div>';
        semis.forEach(m => {
            const node = createBracketNode(m);
            const pairDiv = document.createElement('div');
            pairDiv.className = 'match-pair has-gap';
            pairDiv.appendChild(node);
            const line = document.createElement('div');
            line.className = 'connector-fork-wide';
            pairDiv.appendChild(line);
            roundS.appendChild(pairDiv);
        });
        tree.appendChild(roundS);
    }

    // FINAL
    if (final) {
        const roundF = document.createElement('div');
        roundF.className = 'tree-round round-final active';
        roundF.innerHTML = '<div class="round-title">GRAN FINAL</div>';
        const node = createBracketNode(final);
        node.classList.add('node-final');
        const pairDiv = document.createElement('div');
        pairDiv.className = 'match-pair';
        pairDiv.style.justifyContent = 'center';
        pairDiv.appendChild(node);
        roundF.appendChild(pairDiv);
        tree.appendChild(roundF);
    }

    scrollContainer.appendChild(tree);
    wrapper.appendChild(scrollContainer);
    container.appendChild(wrapper);
}

function createBracketNode(match) {
    const node = document.createElement('div');
    const isLive = match.status === 'live';
    const isFinished = match.status === 'finished';

    node.className = `bracket-node ${isLive ? 'live' : (isFinished ? 'finished' : 'pending')}`;
    if (isLive) {
        const badge = document.createElement('div');
        badge.className = 'node-live-badge';
        badge.innerHTML = '<div class="pulse-dot"></div> EN JUEGO';
        node.appendChild(badge);
    }

    const sA = match.scoreA;
    const sB = match.scoreB;
    const wOk = isFinished;
    const winA = wOk && parseInt(sA) > parseInt(sB);
    const winB = wOk && parseInt(sB) > parseInt(sA);

    node.innerHTML = `
        <div class="node-top-bar">
            <span>${match.matchName || 'Eliminatoria'}</span>
            <span class="node-time">
                ${match.time && match.time !== 'TBD' ? match.time : ''} 
                ${match.court && match.court !== 'TBD' ? ' | ' + match.court : ''}
            </span>
        </div>
        <div class="node-content">
            <div class="node-team-row ${winA ? 'winner' : ''}">
                <span class="node-name">${match.teamA}</span>
                <span class="node-score-box">${sA ?? 0}</span>
            </div>
            <div class="node-team-row ${winB ? 'winner' : ''}">
                <span class="node-name">${match.teamB}</span>
                <span class="node-score-box">${sB ?? 0}</span>
            </div>
        </div>
    `;
    return node;
}

// --- SPONSOR CAROUSEL LOGIC ---
let currentSponsorIndex = 0;
const totalSponsors = 7; // Updated to match sponsor_0.png through sponsor_6.png
let carouselInterval = null;

function scrollSponsors(direction) {
    currentSponsorIndex += direction;

    // Loop around
    if (currentSponsorIndex < 0) currentSponsorIndex = totalSponsors - 1;
    if (currentSponsorIndex >= totalSponsors) currentSponsorIndex = 0;

    updateCarousel();
    resetCarouselTimer(); // Reset timer when manually navigating
}

function goToSponsor(index) {
    currentSponsorIndex = index;
    updateCarousel();
    resetCarouselTimer();
}

function updateCarousel() {
    const track = document.getElementById('sponsorsTrack');
    if (track) {
        track.style.transform = `translateX(-${currentSponsorIndex * 100}%)`;
    }

    // Update dots
    const dots = document.querySelectorAll('.carousel-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSponsorIndex);
    });
}

function startCarouselAutoPlay() {
    carouselInterval = setInterval(() => {
        scrollSponsors(1);
    }, 4000); // Change slide every 4 seconds
}

function resetCarouselTimer() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
    }
    startCarouselAutoPlay();
}

function initCarousel() {
    const dotsContainer = document.getElementById('carouselDots');
    if (!dotsContainer) return;

    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalSponsors; i++) {
        const dot = document.createElement('div');
        dot.className = `carousel-dot ${i === 0 ? 'active' : ''}`;
        dot.onclick = () => goToSponsor(i);
        dotsContainer.appendChild(dot);
    }

    // Start auto-play
    startCarouselAutoPlay();
}

// Global Exports
window.updateScore = updateScore;
window.toggleMatchStatus = toggleMatchStatus;
window.simularGrupos = simularGrupos;
window.resetTotalScores = resetTotalScores;
window.initAdmin = initAdmin;
window.editTeamName = editTeamName;
window.editMatchDetail = editMatchDetail;
window.forceSyncSchedule = forceSyncSchedule;
window.exportData = exportData;
window.saveMatchResult = saveMatchResult;
window.navigateToMatch = navigateToMatch;
window.renderTicker = renderTicker;
window.scrollSponsors = scrollSponsors;
window.goToSponsor = goToSponsor;
window.toggleLiveFeed = toggleLiveFeed;
window.renderLiveFeed = renderLiveFeed;
window.toggleScheduleEditor = toggleScheduleEditor;
window.renderSchedule = renderSchedule;
window.adminAddMatch = adminAddMatch;
window.adminEditMatch = adminEditMatch;
window.getStandings = getStandings;

function normalizeText(text) {
    return text ? text.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
}

// --- AUTO-REFRESH SYSTEM (Player Dashboard Only) ---
let lastKnownTimestamp = localStorage.getItem('dataTimestamp');

function startAutoRefresh() {
    // Only run on player dashboard, not admin
    if (window.location.pathname.includes('admin.html')) return;

    setInterval(() => {
        const currentTimestamp = localStorage.getItem('dataTimestamp');
        if (currentTimestamp && currentTimestamp !== lastKnownTimestamp) {
            console.log('🔄 Data updated! Auto-refreshing...');
            lastKnownTimestamp = currentTimestamp;

            // Show visual feedback
            const refreshBtn = document.getElementById('manualRefreshBtn');
            if (refreshBtn) {
                refreshBtn.style.animation = 'pulse 0.5s ease';
                const icon = refreshBtn.querySelector('.refresh-icon');
                if (icon) icon.style.animation = 'spin 0.5s ease';
            }

            // Reload data and re-render
            try {
                tournamentData = JSON.parse(localStorage.getItem('tournamentData'));

                // Re-render active tab
                const activeTab = document.querySelector('.nav-btn.active')?.dataset.tab;
                if (activeTab === 'standings') renderStandings();
                else if (activeTab === 'matches') renderMatches();
                else if (activeTab === 'playoffs') renderBrackets();

                // Reset animation
                setTimeout(() => {
                    if (refreshBtn) {
                        refreshBtn.style.animation = '';
                        const icon = refreshBtn.querySelector('.refresh-icon');
                        if (icon) icon.style.animation = '';
                    }
                }, 500);
            } catch (e) {
                console.error('Auto-refresh error:', e);
            }
        }
    }, 2000); // Check every 2 seconds
}

// Helper global for init (if standalone)
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof init === 'function') init();
        if (typeof initAdmin === 'function') initAdmin();

        // --- FIREBASE SYNC ---
        syncWithFirebase();

        startAutoRefresh(); // Start auto-refresh polling
    });
}

/**
 * EXPORTACIÓN DE BACKUP LOCAL
 * Genera un archivo JSON con todos los datos del torneo
 */
/**
 * EXPORTACIÓN DE BACKUP LOCAL (EXCEL)
 * Genera un archivo XLSX con múltiples hojas
 */
function exportBackup() {
    if (!tournamentData) {
        alert("❌ No hay datos para exportar");
        return;
    }

    if (typeof XLSX === 'undefined') {
        alert("⚠️ Librería Excel no cargada. Inténtalo de nuevo en 5 segundos.");
        return;
    }

    try {
        // 1. Preparar datos para Excel
        const matchesData = tournamentData.matches.map(m => ({
            ID: m.id,
            Categoria: m.category,
            Grupo: m.group,
            Equipo_A: m.teamA,
            Equipo_B: m.teamB,
            Score_A: m.scoreA,
            Score_B: m.scoreB,
            Estado: m.status,
            Hora: m.time,
            Pista: m.court
        }));

        // Clasificación (simplificada)
        let standingsData = [];
        tournamentData.categories.forEach(cat => {
            const groups = [...new Set(tournamentData.matches.filter(m => m.category === cat).map(m => m.group))];
            groups.forEach(grp => {
                const std = getStandings(cat, grp);
                std.forEach((s, idx) => {
                    standingsData.push({
                        Categoria: cat,
                        Grupo: grp,
                        Posicion: idx + 1,
                        Equipo: s.name,
                        Puntos: s.points,
                        Jugados: s.played,
                        Ganados: s.won,
                        Diferencia: s.diff
                    });
                });
            });
        });

        // 2. Crear Libro de Excel
        const wb = XLSX.utils.book_new();

        // Hoja 1: Partidos
        const wsMatches = XLSX.utils.json_to_sheet(matchesData);
        XLSX.utils.book_append_sheet(wb, wsMatches, "Partidos");

        // Hoja 2: Clasificación
        const wsStandings = XLSX.utils.json_to_sheet(standingsData);
        XLSX.utils.book_append_sheet(wb, wsStandings, "Clasificación");

        // Hoja 3: RAW (Backup puro JSON)
        const wsRaw = XLSX.utils.json_to_sheet([{ json: JSON.stringify(tournamentData) }]);
        XLSX.utils.book_append_sheet(wb, wsRaw, "RAW_DATA");

        // 3. Generar archivo y descargar
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
        const filename = `SOMOSPADEL_MASTER_${dateStr}_${timeStr}.xlsx`;

        XLSX.writeFile(wb, filename);

        console.log(`✅ Backup Excel exportado: ${filename}`);
    } catch (e) {
        console.error("Error exportando Excel:", e);
        alert("❌ Error al generar el Excel: " + e.message);
    }
}
// --- DEVICE DETECTION & NOTIFICATION ---
function detectAndNotifyDevice() {
    // Only once per session to avoid annoying the user
    if (sessionStorage.getItem('deviceToastShown')) return;

    const width = window.innerWidth;
    let msg = '';
    let icon = '';

    if (width <= 768) {
        msg = 'Vista Móvil: Desliza las tablas para ver más';
        icon = 'fa-mobile-alt';
    } else if (width <= 1024) { // Tablet range
        msg = 'Vista Tablet: Puedes hacer Zoom con dos dedos';
        icon = 'fa-tablet-alt';
    } else {
        msg = 'Tip: Pulsa F11 para Pantalla Completa';
        icon = 'fa-desktop';
    }

    if (msg) showToast(msg, icon);
    sessionStorage.setItem('deviceToastShown', 'true');
}

function showToast(text, iconClass) {
    if (document.getElementById('device-toast')) return;

    const toast = document.createElement('div');
    toast.id = 'device-toast';
    toast.className = 'device-toast';
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${iconClass}"></i>
            <span>${text}</span>
        </div>
        <button onclick="this.parentElement.classList.remove('show'); setTimeout(() => this.parentElement.remove(), 500);" class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(toast);

    // Animation in
    setTimeout(() => toast.classList.add('show'), 100);

    // Auto hide after 8s
    setTimeout(() => {
        if (toast && toast.parentElement) {
            toast.classList.remove('show');
            setTimeout(() => { if (toast.parentElement) toast.remove(); }, 500);
        }
    }, 8000);
}

// Init Device Detection
window.addEventListener('load', detectAndNotifyDevice);
