/**
 * SomosPadel BCN - Tu compañero del torneo
 * Búsqueda Inteligente Blindada y Humana
 */

class PadelBot {
    constructor() {
        this.isOpen = false;
        this.suggestions = [
            "🏆 Próximo partido",
            "📊 Clasificación",
            "📅 Programación Total",
            "🔥 Eliminatorias",
            "🍖 Ver Premios"
        ];

        // El conocimiento de la mascota (sin palabras técnicas)
        this.knowledgeBase = {
            desempates: [
                "1º **Puntos**: El equipo con más victorias lidera.",
                "2º **Diferencia**: Si hay empate, miramos quién ha ganado más juegos netos.",
                "3º **Enfrentamiento**: Si el empate sigue, el ganador de vuestro partido directo pasa delante.",
                "4º **Sorteo**: Solo en el caso de que todo lo anterior sea idéntico."
            ]
        };

        this.init();
    }

    init() {
        this.createUI();
        this.addEventListeners();
        this.welcomeMessage();
    }

    createUI() {
        const botHTML = `
            <div id="padel-bot-trigger" title="¡Hola! Soy tu compañero de SomosPadel">
                <img src="logo-somospadel-bcn.png" alt="SomosPadel BCN">
            </div>
            
            <div id="padel-bot-window">
                <div class="bot-header">
                    <img src="logo-somospadel-bcn.png" class="bot-avatar-mini">
                    <div class="bot-info">
                        <h3>SomosPadel BCN</h3>
                        <span><div class="online-dot"></div> Tu compañero de pistas</span>
                    </div>
                </div>
                
                <div id="bot-messages" class="bot-messages"></div>
                <div class="bot-suggestions" id="bot-suggestions"></div>
                
                <div class="bot-input-area">
                    <input type="text" id="bot-input" placeholder="Nombre de jugador o pregunta...">
                    <button id="bot-send" class="bot-send-btn">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', botHTML);
        this.renderSuggestions();
    }

    addEventListeners() {
        document.getElementById('padel-bot-trigger').addEventListener('click', () => this.toggleWindow());
        document.getElementById('bot-send').addEventListener('click', () => this.handleUserInput());
        document.getElementById('bot-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleUserInput();
        });
        document.getElementById('bot-suggestions').addEventListener('click', (e) => {
            if (e.target.classList.contains('suggestion-tag')) {
                this.handleUserInput(e.target.innerText);
            }
        });
    }

    toggleWindow() {
        this.isOpen = !this.isOpen;
        document.getElementById('padel-bot-window').classList.toggle('open', this.isOpen);
        if (this.isOpen) document.getElementById('bot-input').focus();
    }

    welcomeMessage() {
        setTimeout(() => {
            this.addMessage("bot", "¡Hola! 👋 Soy tu compañero de **SomosPadel Barcelona**. Estoy aquí para echarte una mano.\n\n¿Quieres saber cuándo juegas, ver la programación completa de las pistas o cómo van las eliminatorias? ¡Dime qué necesitas!");
        }, 800);
    }

    addMessage(sender, text) {
        const container = document.getElementById('bot-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg msg-${sender}`;
        msgDiv.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
    }

    renderSuggestions() {
        const container = document.getElementById('bot-suggestions');
        container.innerHTML = this.suggestions.map(s => `<div class="suggestion-tag">${s}</div>`).join('');
    }

    normalize(text) {
        return text ? text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
    }

    async handleUserInput(textOverride = null) {
        try {
            const input = document.getElementById('bot-input');
            const val = textOverride || input.value.trim();
            if (!val) return;
            input.value = '';
            this.addMessage("user", val);

            const response = await this.processAI(val).catch(err => {
                console.error("AI Error:", err);
                return "Ups, he tenido un pequeño cruce de cables... 😵 ¿Me lo puedes preguntar de otra forma?";
            });

            setTimeout(() => this.addMessage("bot", response), 500);
        } catch (e) {
            console.error("Chatbot Error:", e);
        }
    }

    async processAI(query) {
        try {
            const q = this.normalize(query);
            const data = window.tournamentData || {};

            // --- LIMPIEZA DE QUERY ---
            const fillerWords = ["proximo", "partido", "cuando", "juego", "mi", "horario", "pista", "donde", "clasificacion", "puntos", "puesto", "posicion", "de", "la", "el", "los", "las", "a", "en", "para", "buscar", "jugador"];
            let keywords = q.split(" ").filter(word => !fillerWords.includes(word) && word.length >= 3);
            const cleanName = keywords.join(" ").trim();

            // 1. CLASIFICACIÓN
            if (q.includes("clasificacion") || q.includes("puntos") || q.includes("puesto")) {
                if (cleanName.length >= 3) {
                    const playerMatch = (data.matches || []).find(m =>
                        this.normalize(m.teamA).includes(cleanName) ||
                        this.normalize(m.teamB).includes(cleanName)
                    );

                    if (playerMatch && typeof window.getStandings === 'function') {
                        const teamName = this.normalize(playerMatch.teamA).includes(cleanName) ? playerMatch.teamA : playerMatch.teamB;
                        const leaderboard = window.getStandings(playerMatch.category, playerMatch.group);
                        const pos = leaderboard.findIndex(s => s.name === teamName);
                        if (pos !== -1) {
                            const s = leaderboard[pos];
                            return `📊 **Clasificación para ${teamName}:**\n\nPosición: **${pos + 1}º** (Grupo ${playerMatch.group}).\n\n- Puntos: **${s.points}**\n- Juegos: ${s.gf}/${s.ga} (${s.diff > 0 ? '+' : ''}${s.diff})`;
                        }
                    }
                }
            }

            // 2. BÚSQUEDA DE JUGADORES (Híper-Flexible)
            if (keywords.length > 0) {
                const allMatches = data.matches || [];

                // Intento A: Todas las palabras coinciden (Ej: "Angel Millan")
                let matches = allMatches.filter(m => {
                    const tA = this.normalize(m.teamA);
                    const tB = this.normalize(m.teamB);
                    return keywords.every(kw => tA.includes(kw)) || keywords.every(kw => tB.includes(kw));
                });

                // Intento B: Alguna palabra coincide (Ej: "Toni Millan" -> Toni Palau o Angel Millan)
                if (matches.length === 0) {
                    matches = allMatches.filter(m => {
                        const tA = this.normalize(m.teamA);
                        const tB = this.normalize(m.teamB);
                        return keywords.some(kw => tA.includes(kw)) || keywords.some(kw => tB.includes(kw));
                    });
                }

                if (matches.length > 0) {
                    const results = matches.slice(0, 4);
                    let response = `¡Te tengo! He encontrado esto para **"${cleanName}"**:\n\n`;

                    results.forEach(m => {
                        const isTeamA = keywords.some(kw => this.normalize(m.teamA).includes(kw));
                        const me = isTeamA ? m.teamA : m.teamB;
                        const rival = isTeamA ? m.teamB : m.teamA;
                        const status = m.status === 'finished' ? ` | **${m.scoreA}-${m.scoreB}**` :
                            m.status === 'live' ? " | 🔴 **LIVE**" : ` | 🕒 **${m.time || 'TBD'}**`;

                        response += `🎾 **${me}** vs **${rival}**\n📍 Pista ${m.court || '?'}${status}\n\n`;
                    });

                    if (matches.length > 4) response += "*(Hay más partidos, sé más específico)*";
                    return response;
                }
            }

            // 3. COMANDOS RÁPIDOS
            if (q.includes("reglas") || q.includes("normativa") || q.includes("oro") || q.includes("tiempo")) {
                return `¡Aquí las tienes claras! 📖\n\n1. **Punto de Oro:** En 40-40, el siguiente gana.\n2. **Dudas:** Ante cualquier desacuerdo, se repite.\n3. **Fin de tiempo:** El juego inacabado **no cuenta** si ya hay un ganador. **Solo si hay empate a juegos** desempatamos con el juego actual.`;
            }

            if (q.includes("premio") || q.includes("ganar") || q.includes("jamon") || q.includes("cookie") || q.includes("sorteo")) {
                return `¡Los premios son brutales! 🎁✨\n\n- **🥇 Campeones:** Paletilla del Guijuelo.\n- **🥈 Finalistas:** Cookies Luvidocookies.\n- **🎉 Sorteo:** ¡Otra paletilla extra entre todos!`;
            }

            if (q.includes("eliminatoria") || q.includes("final") || q.includes("cuadro")) {
                return "¡La fase decisiva! 🏆 Consulta la pestaña **'Eliminatorias'** arriba para ver los cuadros y cruces.";
            }

            if (q.includes("programacion") || q.includes("cuadrante") || q.includes("horario")) {
                return "📅 **Programación:** Pulsa en la pestaña **'Programación'** arriba para ver el cuadrante de todas las pistas.";
            }

            if (q.includes("hola") || q.includes("buenos") || q.includes("buenas")) {
                return "¡Hola! 👋 Soy tu compañero de pista. Dime tu nombre para ver cuándo juegas.";
            }

            return "No te he entendido del todo... 😅 pero pregúntame por **tu nombre**, tu **clasificación** o los **premios**. ¿Qué necesitas?";
        } catch (err) {
            console.error("AI Error:", err);
            return "Lo siento, he tenido un pequeño error al procesar tu duda. ¿Me lo repites? 😅";
        }
    }
}

document.addEventListener('DOMContentLoaded', () => { window.padelBot = new PadelBot(); });
