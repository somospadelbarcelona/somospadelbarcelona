// --- GLOBAL ERROR BOUNDARY ---
window.onerror = function (msg, url, line, col, error) {
    console.error("Global Error Caught:", msg, "at", line, ":", col);
    // Silent fail to keep UI running if possible
    return true;
};

window.onunhandledrejection = function (event) {
    console.error("Unhandled Promise Rejection:", event.reason);
};

// --- CONFIGURATION ---
const APP_VERSION = "2.2.0-CLOUD-SYNC-ACTIVE";
console.log(`🚀 SOMOSPADEL Dashboard v${APP_VERSION} initialized.`);

const RAW_TEAMS = {
    "4ª Mixta": {
        "A": ["Juanma Leon", "Raquel Fdez", "David Asen", "Anais", "Paula", "Jose Luis Berga", "Alex C", "Pili Jor"],
        "B": ["Toni M", "Sonia", "Kevin", "Lorena", "Joaquim Salvat", "Monica", "Javier Frauca", "Natalia"],
        "C": ["Sonia", "Miguel", "Carlota", "Jordi Seuba", "Enrique F", "Annabel", "Cristina", "Carlos"],
        "D": ["Marta Murigaren", "Jorge Rueda", "Coral", "Ismael", "Luis Pino", "Raquel Perez", "Fernando", "Sobrina Fernando"]
    },
    "4ª Masculina": {
        "A": ["Sergio Albert", "Joan Bernard", "Oscar Cosco", "Javier Hita", "Vlady", "Bernat", "Juan Manuel", "Fernando"],
        "B": ["Adria Boza", "Jugador 3MB", "Cristian Gallego", "Amigo Cristian", "Xavi Perea", "Amigo Perea", "Daniel Astasio", "Pareja Daniel"]
    },
    "4ª Femenina": {
        "A": ["Cristina Matamala", "Olga Ferer", "Judith Esquerre", "Judit Pinad", "Anna Polo", "Anna Gaseni", "Noe", "Pareja Noe"],
        "B": ["Sandra Riera", "Yolanda", "Gemma Sav", "Mayte Vega", "Maria Lluisa", "Pareja", "Berta", "Andrea"],
        "C": ["Yoana Martinez", "Andrea Baraja", "Marta Bassons", "Joana", "Sheila Jodar", "Greis Caballero", "Marta Baijet", "Mireia Peligros"]
    },
    "3ª Mixta": {
        "A": ["Monica", "Miki Muñoz", "David Navea", "Ainhoa Navea", "Manuel", "Zizi", "Maika", "Josep Maria"],
        "B": ["Ronny", "Carla", "Juanjo", "Mariona", "Ramon", "Lola", "Vane", "Mario"]
    },
    "3ª Masculina": {
        "A": ["Angel Millan", "Albert Estrella", "Gerardo", "Pablo Mena", "Sergio Serrano", "Amigo Sergio", "Eloy", "Ness", "Pareja por Confirmar", "Número 5", "Pareja por Confirmar", "Número 6"]
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
        { cat: "3ª Masculina", groups: ["A"], courts: ["Pista 11", "Pista 12", "Pista 13"] }
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

        // GENERATE PLAYOFF PLACEHOLDERS
        const groupCount = Object.keys(groups).length;
        let playoffMatches = [];

        if (groupCount === 4 || category === "4ª Femenina") {
            ['Q1', 'Q2', 'Q3', 'Q4'].forEach((q, i) => {
                data.matches.push({
                    id: 1000 + data.matches.length,
                    matchName: `Cuartos ${i + 1}`, teamA: 'TBD', teamB: 'TBD',
                    scoreA: null, scoreB: null, status: 'pending', stage: 'quarter',
                    category: category, time: '16:30', court: 'Pista ?'
                });
            });
            ['S1', 'S2'].forEach((s, i) => {
                data.matches.push({
                    id: 2000 + data.matches.length,
                    matchName: `Semi ${i + 1}`, teamA: 'Ganador Cuartos', teamB: 'Ganador Cuartos',
                    scoreA: null, scoreB: null, status: 'pending', stage: 'semi',
                    category: category, time: '17:30', court: 'Pista ?'
                });
            });
            data.matches.push({
                id: 3000 + data.matches.length,
                matchName: 'Final', teamA: 'Finalista 1', teamB: 'Finalista 2',
                scoreA: null, scoreB: null, status: 'pending', stage: 'final',
                category: category, time: '18:30', court: 'Pista 1'
            });
        } else {
            // Smaller categories
            ['S1', 'S2'].forEach((s, i) => {
                data.matches.push({
                    id: 4000 + data.matches.length,
                    matchName: `Semi ${i + 1}`, teamA: 'TBD', teamB: 'TBD',
                    scoreA: null, scoreB: null, status: 'pending', stage: 'semi',
                    category: category, time: '16:30', court: 'Pista ?'
                });
            });
            data.matches.push({
                id: 5000 + data.matches.length,
                matchName: 'Final', teamA: 'Finalista 1', teamB: 'Finalista 2',
                scoreA: null, scoreB: null, status: 'pending', stage: 'final',
                category: category, time: '17:30', court: 'Pista 1'
            });
        }
    });

    data.groups = [...new Set(data.groups)].sort();
    return data;
}

// --- STATE MANAGEMENT ---
let tournamentData = (function () {
    try {
        const stored = localStorage.getItem('tournamentData');

        // If we have BAKED_DATA (official sync), and NO local storage, use BAKED_DATA
        if (typeof BAKED_DATA !== 'undefined' && !stored) {
            console.log("📦 Using BAKED_DATA version for initial load.");
            return BAKED_DATA;
        }

        if (!stored) return null;
        const parsed = JSON.parse(stored);

        // If we have BAKED_DATA and local storage exists, but it's very old/missing fields, maybe upgrade?
        // For now, we favor stored user edits once they exist.

        if (parsed && parsed.matches && parsed.matches.every(m => m.stage)) return parsed; // Already new format
        if (parsed && parsed.matches && parsed.matches.some(m => !m.stage)) return null; // Old format
        return parsed;
    } catch (e) {
        return null;
    }
})();

// Force initial setup if data is corrupt or missing
function validateAndRepairData() {
    try {
        if (!tournamentData || !tournamentData.matches || !Array.isArray(tournamentData.matches)) {
            console.warn("Invalid data structure detected. Resetting to defaults...");
            tournamentData = generateInitialData();
            saveState();
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

let activeMatchesCat = null;
let activeStandingsCat = null;
let activePlayoffCat = null;
let activeAdminCat = null;
let activeAdminPhase = 'group';
let activeAdminSort = 'id'; // 'id' or 'time'

// Save function with timestamp for auto-refresh
function saveState() {
    const dataStr = JSON.stringify(tournamentData);
    localStorage.setItem('tournamentData', dataStr);
    localStorage.setItem('dataTimestamp', Date.now().toString());

    // PUSH TO FIREBASE (Real-time Cloud Sync)
    if (window.isFirebaseActive && window.db) {
        window.db.ref('tournament_state').set(tournamentData)
            .catch(err => console.error("Firebase Push Error:", err));
    }
    renderTicker(); // Update ticker when data changes
    updateHeaderStats(); // Update header stats
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
            .catch(err => console.error("Error guardando resultado:", err));
    }
}

function syncWithFirebase() {
    if (!window.isFirebaseActive || !window.db) {
        console.warn("⚠️ Firebase no está activo o la DB no está inicializada.");
        return;
    }

    // Indicador visual de conexión
    const updateStatus = (status) => {
        const indicator = document.getElementById('cloud-status-indicator');
        if (indicator) {
            if (status === 'online') {
                indicator.innerHTML = '<i class="fas fa-cloud" style="color:#22c55e;"></i> ONLINE';
                indicator.style.borderColor = 'rgba(34, 197, 94, 0.4)';
            } else if (status === 'offline') {
                indicator.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#ef4444;"></i> OFFLINE';
                indicator.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            } else {
                indicator.innerHTML = '<i class="fas fa-cloud-sun" style="color:#f59e0b;"></i> CONNECTING...';
                indicator.style.borderColor = 'rgba(245, 158, 11, 0.4)';
            }
        }
    };

    updateStatus('connecting');
    console.log("📡 Iniciando escucha de Firebase...");

    // 1. Detectar si hay conexión a la infraestructura de Firebase
    window.db.ref('.info/connected').on('value', (snap) => {
        if (snap.val() === true) {
            console.log("🟢 Conexión establecida con el servidor de Firebase.");
        } else {
            console.log("🔴 Conexión perdida con el servidor de Firebase.");
            updateStatus('offline');
        }
    });

    // 2. Escuchar cambios en los datos
    window.db.ref('tournament_state').on('value', (snapshot) => {
        const cloudData = snapshot.val();
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

            if (typeof initAdmin === 'function') initAdmin();
        } else {
            console.warn("⚠️ La ruta 'tournament_state' está vacía en Firebase.");
            // Si está vacía, subimos los datos actuales por primera vez si somos admin
            if (window.location.pathname.includes('admin.html')) {
                console.log("📤 Inicializando base de datos con datos locales...");
                saveState();
            }
        }
    }, (error) => {
        console.error("❌ Error de sincronización Firebase:", error);
        updateStatus('offline');
    });
}

// Render results ticker
function renderTicker() {
    const tickerContainer = document.getElementById('ticker-results');
    if (!tickerContainer) return;

    // Get last 15 finished matches
    const finishedMatches = tournamentData.matches
        .filter(m => m.status === 'finished' && m.scoreA !== null && m.scoreB !== null)
        .sort((a, b) => b.id - a.id) // Most recent first
        .slice(0, 15);

    if (finishedMatches.length === 0) {
        tickerContainer.innerHTML = '<span style="padding: 0 2rem;">No hay resultados aún...</span>';
        return;
    }

    // Duplicate for seamless loop
    const doubled = [...finishedMatches, ...finishedMatches];

    tickerContainer.innerHTML = doubled.map(match => {
        const winnerA = match.scoreA > match.scoreB;
        const winnerB = match.scoreB > match.scoreA;

        return `
            <span class="ticker-item" onclick="navigateToMatch(${match.id})">
                <span class="${winnerA ? 'ticker-winner' : 'ticker-loser'}">${match.teamA}</span>
                <span class="ticker-score">${match.scoreA}-${match.scoreB}</span>
                <span class="${winnerB ? 'ticker-winner' : 'ticker-loser'}">${match.teamB}</span>
            </span>
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

    // Next match time
    const pendingMatches = tournamentData.matches
        .filter(m => m.status === 'pending' && m.time !== 'TBD')
        .sort((a, b) => a.time.localeCompare(b.time));

    const nextMatchEl = document.getElementById('nextMatch');
    if (nextMatchEl) {
        nextMatchEl.textContent = pendingMatches.length > 0 ? pendingMatches[0].time : 'N/A';
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

function renderLiveFeed() {
    const container = document.getElementById('liveFeedContent');
    if (!container) return;

    const liveMatches = tournamentData.matches.filter(m =>
        m.status === 'live' || m.status === 'in-play' || m.status === 'playing'
    );

    if (liveMatches.length === 0) {
        container.innerHTML = '<div class="no-live-matches">No hay partidos en juego en este momento</div>';
        return;
    }

    container.innerHTML = liveMatches.map(match => `
        <div class="live-match-item" onclick="navigateToMatch(${match.id})">
            <div class="live-match-court">${match.court}</div>
            <div class="live-match-teams">
                <div class="live-team">${match.teamA} <span class="live-score">${match.scoreA ?? 0}</span></div>
                <div class="live-team">${match.teamB} <span class="live-score">${match.scoreB ?? 0}</span></div>
            </div>
            <div class="live-pulse"></div>
        </div>
    `).join('');
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

function saveState() {
    updatePlayoffCalculations();
    localStorage.setItem('tournamentData', JSON.stringify(tournamentData));
    updateUI();
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
                if (btn.dataset.tab === 'standings') renderStandings();
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
    renderBrackets();
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

function renderStandings() {
    const container = document.getElementById('groups-container');
    if (!container) return;
    container.innerHTML = '';

    const searchTerm = document.getElementById('standings-search')?.value.toLowerCase().trim();
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

    let foundAny = false;

    categoriesToRender.forEach(cat => {
        const catMatches = tournamentData.matches.filter(m => m.category === cat);
        let catGroups = [...new Set(catMatches.filter(m => !m.stage || m.stage === 'group').map(m => m.group))].sort();

        catGroups.forEach(grp => {
            const standings = getStandings(cat, grp);

            // If searching, filter to only groups containing the term
            if (searchTerm && searchTerm.length > 0) {
                const matchesTerm = standings.some(s => s.name.toLowerCase().includes(searchTerm));
                if (!matchesTerm) return; // Skip this group
            }

            foundAny = true;
            const section = document.createElement('div');
            section.className = 'group-section';

            let html = `
                <h3 class="category-header">${cat} - GRUPO ${grp}</h3>
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
                const isMatch = searchTerm && team.name.toLowerCase().includes(searchTerm);
                const highlightClass = isMatch ? 'search-highlight' : ''; // CSS needed
                const rankClass = index < 2 ? `rank-${index + 1} winner-highlight` : `rank-${index + 1}`;

                html += `
                    <tr class="${rankClass} ${highlightClass}">
                        <td>${team.name}</td>
                        <td>${team.points}</td>
                        <td>${team.played}</td>
                        <td>${team.won}</td>
                        <td>${team.lost}</td>
                        <td>${team.diff}</td>
                    </tr>
                `;
            });

            html += `</tbody></table></div>`;
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

        visibleMatches = tournamentData.matches.filter(m =>
            m.teamA.toLowerCase().includes(searchTerm) ||
            m.teamB.toLowerCase().includes(searchTerm) ||
            m.group.toString().toLowerCase().includes(searchTerm) ||
            m.category.toLowerCase().includes(searchTerm)
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
                        <span class="score-val">${match.scoreA !== null ? match.scoreA : '-'}</span>
                        <button class="ctrl-btn btn-plus" onclick="updateScore(${match.id}, 'teamA', 1)">+</button>
                    </div>
                </div>
                <div class="amc-team-row">
                    <span class="amc-team-name editable" onclick="editTeamName(${match.id}, 'teamB')">${match.teamB}</span>
                    <div class="amc-score-control">
                        <button class="ctrl-btn btn-minus" onclick="updateScore(${match.id}, 'teamB', -1)">-</button>
                        <span class="score-val">${match.scoreB !== null ? match.scoreB : '-'}</span>
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
        if (match.scoreA === null) match.scoreA = 0;
        if (match.scoreB === null) match.scoreB = 0;
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
    saveState();
    const totalGroup = tournamentData.matches.filter(m => !m.stage || m.stage === 'group').length;
    alert(`Se han simulado ${counting} resultados. Total Fase de Grupos: ${totalGroup} partidos.`);
    location.reload();
}

function resetTotalScores() {
    if (!confirm("⛔ PELIGRO: ¿REGENERAR TODO EL TORNEO? \n\nEsto borrará todos los resultados actuales y creará la nueva estructura de 75 PARTIDOS según la configuración oficial. \n\n¿Proceder?")) return;

    // Clear localStorage to be safe
    localStorage.removeItem('tournamentData');

    // Generate fresh
    tournamentData = generateInitialData();
    saveState();

    const count = tournamentData.matches.filter(m => !m.stage || m.stage === 'group').length;
    alert(`Torneo regenerado con éxito. \nTotal Fase de Grupos: ${count} partidos.`);
    location.reload();
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
                ${sA !== null ? `<span class="node-score-box">${sA}</span>` : ''}
            </div>
            <div class="node-team-row ${winB ? 'winner' : ''}">
                <span class="node-name">${match.teamB}</span>
                ${sB !== null ? `<span class="node-score-box">${sB}</span>` : ''}
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
