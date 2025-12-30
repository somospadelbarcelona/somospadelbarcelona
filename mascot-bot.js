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
            const matchesCount = (data.matches || []).length;

            // --- LIMPIEZA DE QUERY ---
            const fillerWords = ["proximo", "partido", "cuando", "juego", "mi", "horario", "pista", "donde", "clasificacion", "puntos", "puesto", "posicion", "de", "la", "el", "los", "las", "a", "en", "para", "buscar", "jugador", "hola", "me", "llamo", "soy", "ver", "dime"];

            // Detectar si intenta decir su nombre (Keywords > 2 letras y no filler)
            let keywords = q.split(" ").filter(word => !fillerWords.includes(word) && word.length >= 3);
            const cleanName = keywords.join(" ").trim();

            // --- INTENCIONES PRINCIPALES ---

            // 1. SALUDO O PREGUNTA GENERAL
            if (q === "hola" || q === "buenos dias" || q === "buenas tardes") {
                return "¡Hola! 👋 Soy tu compañero de pista. Para empezar, dime: ¿Cómo te llamas? (O pulsa uno de los botones de abajo 👇)";
            }

            // 2. PRÓXIMO PARTIDO (INTENCIÓN CLARA)
            // Si dice solo "proximo partido" sin nombre, le pedimos el nombre.
            if ((q.includes("proximo") && q.includes("partido")) || q === "proximo partido") {
                if (cleanName.length < 3) {
                    return "¡Claro! 🎾 Para decirte cuándo juegas, necesito saber quién eres.\n\n👉 **Escribe tu nombre** (o el de tu pareja) y te lo busco ahora mismo.";
                }
                // Si hay nombre, dejamos que fluya a la búsqueda abajo
            }

            // 3. CLASIFICACIÓN (INTENCIÓN CLARA Y ESPECÍFICA)
            if (q.includes("clasificacion") || q === "ver clasificacion") {
                if (cleanName.length < 3) {
                    return "¡Vamos a ver esos números! 📊\n\n¿De qué pareja o jugador quieres ver la clasificación? **Escribe el nombre** y te digo en qué puesto vais.";
                }

                // Lógica Estricta también para clasificación
                const foundMatches = (data.matches || []).filter(m => {
                    const tA = this.normalize(m.teamA);
                    const tB = this.normalize(m.teamB);
                    const teamAMatches = keywords.every(kw => tA.includes(kw));
                    const teamBMatches = keywords.every(kw => tB.includes(kw));
                    return teamAMatches || teamBMatches;
                });

                // Sacar equipos únicos
                let uniqueTeams = [];
                foundMatches.forEach(m => {
                    const tA = this.normalize(m.teamA);
                    if (keywords.every(kw => tA.includes(kw))) uniqueTeams.push({ name: m.teamA, cat: m.category, grp: m.group });
                    const tB = this.normalize(m.teamB);
                    if (keywords.every(kw => tB.includes(kw))) uniqueTeams.push({ name: m.teamB, cat: m.category, grp: m.group });
                });

                // Eliminar duplicados exactos
                uniqueTeams = uniqueTeams.filter((t, index, self) =>
                    index === self.findIndex((x) => (x.name === t.name && x.cat === t.cat))
                );

                if (uniqueTeams.length > 1) {
                    let msg = `🤔 He encontrado varias parejas para **"${cleanName}"**. ¿A cuál te refieres?\n\n`;
                    uniqueTeams.slice(0, 5).forEach((t, i) => {
                        msg += `${i + 1}. **${t.name}** (${t.cat} - G.${t.grp})\n`;
                    });
                    msg += `\n*Por favor, especifica un poco más el nombre.*`;
                    return msg;
                }

                const playerMatch = uniqueTeams[0] ? (data.matches || []).find(m => (m.teamA === uniqueTeams[0].name || m.teamB === uniqueTeams[0].name)) : null;

                if (playerMatch && typeof window.getStandings === 'function') {
                    const teamName = uniqueTeams[0].name;
                    const leaderboard = window.getStandings(playerMatch.category, playerMatch.group);
                    const pos = leaderboard.findIndex(s => s.name === teamName);

                    if (pos !== -1) {
                        const s = leaderboard[pos];
                        const isQualifying = (pos + 1) <= 2;
                        const statusColor = isQualifying ? '#22c55e' : '#ef4444'; // Green or Red
                        const statusIcon = isQualifying ? '✅' : '⚠️';
                        const statusText = isQualifying ? 'En Zona de Clasificación' : 'Fuera de zona';
                        const rankText = (pos === 0) ? 'CAMPEONES DE GRUPO' : (pos + 1) + 'º CLASIFICADO';

                        // Visual Card HTML ONLY
                        return `
                        <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 12px; border: 1px solid rgba(255,255,255,0.1); margin-top: 5px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
                                <div style="flex: 1;">
                                    <div style="font-size: 0.75rem; color: #888; text-transform: uppercase;">GRUPO ${playerMatch.group}</div>
                                    <div style="font-weight: 800; font-size: 1.2rem; color: #fff; line-height: 1.2;">${teamName}</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 0.7rem; color: ${statusColor}; margin-bottom: 2px;">POSICIÓN</div>
                                    <div style="font-size: 1.8rem; font-weight: 900; color: ${statusColor}; line-height: 1;">${pos + 1}º</div>
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 15px;">
                                <div style="background: rgba(139, 92, 246, 0.2); padding: 6px; border-radius: 6px; text-align: center; border: 1px solid rgba(139, 92, 246, 0.3);">
                                    <div style="font-size: 0.65rem; color: #ccc;">PTS</div>
                                    <div style="font-weight: 800; font-size: 1.1rem; color: #fff;">${s.points}</div>
                                </div>
                                <div style="background: rgba(255, 255, 255, 0.05); padding: 6px; border-radius: 6px; text-align: center;">
                                    <div style="font-size: 0.65rem; color: #888;">JUG</div>
                                    <div style="font-weight: 700; font-size: 1rem; color: #eee;">${s.played}</div>
                                </div>
                                <div style="background: rgba(34, 197, 94, 0.1); padding: 6px; border-radius: 6px; text-align: center;">
                                    <div style="font-size: 0.65rem; color: #888;">G</div>
                                    <div style="font-weight: 700; font-size: 1rem; color: #4ade80;">${s.won}</div>
                                </div>
                                <div style="background: rgba(239, 68, 68, 0.1); padding: 6px; border-radius: 6px; text-align: center;">
                                    <div style="font-size: 0.65rem; color: #888;">P</div>
                                    <div style="font-weight: 700; font-size: 1rem; color: #f87171;">${s.lost}</div>
                                </div>
                            </div>

                            <div style="background: ${statusColor}15; color: ${statusColor}; padding: 8px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; text-align: center; border: 1px solid ${statusColor}33; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                <span>${statusIcon}</span>
                                <span>${rankText}</span>
                            </div>
                        </div>`;
                    }
                }
            }

            // 4. ELIMINATORIAS (INFO ENRIQUECIDA)
            if (q.includes("eliminatoria") || q.includes("final") || q.includes("cuadro") || q.includes("cruces")) {
                return `¡La fase decisiva! 🏆 Aquí tienes el plan de ataque:\n\n🔥 **4ª Fem, 4ª Mix, 3ª Mix:**\n- Cuartos: 16:30 h\n- Semis: 17:30 h\n- Final: 18:30 h\n\n🔥 **3ª Masc:**\n- Semis directas: 17:30 h\n- Final: 18:30 h\n\n🔥 **4ª Masc:**\n- Semis: 17:00 h\n- Final: 17:15 h\n\n👉 Mira el cuadro completo en la pestaña **"Eliminatorias"**.`;
            }

            // 5. PREMIOS (LISTA DETALLADA)
            if (q.includes("premio") || q.includes("ganar") || q.includes("jamon") || q.includes("regalo") || q.includes("sorteo")) {
                return `¡Premios Espectaculares y Sorteo de Lujo! 🎁✨\n\n👇 **SORTEO FINAL (Para todos los asistentes):**\n1. 🍖 **Paletilla de Jamón**\n2. 🏥 Exploración biomecánica\n3. 🧢 2x Gorras Dormilona\n4. 🧥 Sudadera Dormilona\n5. 👕 Camiseta Urban Dormilona\n6. 🧥 Sudadera Shot to Kill\n7. 👕 Camiseta Shot to Kill\n8. 🎽 Prenda Shot to Kill\n9. 🍻 Dos bebidas + Bravas\n10. 🧦 4x Packs de Calcetines Cromos\n\n🏆 **PREMIOS TORNEO:**\n- **Campeones:** Paletilla de Jamón (x2)\n- **Subcampeones:** Pack Cookies Luvidocookies (x2)`;
            }

            // 6. PROGRAMACIÓN TOTAL (RESUMEN MACRO)
            if (q.includes("programacion") || q.includes("horario") || q.includes("calendario")) {
                return `El torneo está on fire 🔥:\n\n🏟️ **${matchesCount} Partidos** programados en 14 Pistas.\n\n🕐 **Fase de Grupos:** 13:30 a 16:30\n🕒 **Fase Final:** 16:30 a 18:30\n\nPara ver qué pista está libre o quién juega dónde, pulsa en la pestaña **"Programación"** y verás el mapa completo.`;
            }

            // 7. BÚSQUEDA INTELIGENTE DE JUGADOR (PRÓXIMO PARTIDO / PARTIDOS)
            if (cleanName.length >= 3) {
                const results = (data.matches || []).filter(m => {
                    const tA = this.normalize(m.teamA);
                    const tB = this.normalize(m.teamB);
                    const teamAMatches = keywords.every(kw => tA.includes(kw));
                    const teamBMatches = keywords.every(kw => tB.includes(kw));
                    return teamAMatches || teamBMatches;
                });

                if (results.length > 0) {
                    const upcoming = results.filter(m => m.status !== 'finished');
                    const finished = results.filter(m => m.status === 'finished');

                    const uniqueNames = [...new Set(results.map(m => {
                        const tA = this.normalize(m.teamA);
                        return keywords.every(kw => tA.includes(kw)) ? m.teamA : m.teamB;
                    }))];

                    if (uniqueNames.length > 1) {
                        let msg = `🤔 Encuentro varios jugadores para **"${cleanName}"**:\n`;
                        uniqueNames.slice(0, 5).forEach((name, i) => msg += `- ${name}\n`);
                        msg += `\n*Por favor, especifica el nombre completo.*`;
                        return msg;
                    }

                    // SOLO RESULTADOS, SIN CLASIFICACION AL PRINCIPIO
                    let response = `¡Oído cocina! 🎾 Aquí tienes los partidos de **"${uniqueNames[0]}"**:\n\n`;

                    if (upcoming.length > 0) {
                        response += `👇 **PRÓXIMOS PARTIDOS:**\n`;
                        upcoming.forEach(m => {
                            const isTeamA = keywords.every(kw => this.normalize(m.teamA).includes(kw));
                            const rival = isTeamA ? m.teamB : m.teamA;
                            const timeInfo = m.status === 'live' ? "🔴 **EN JUEGO AHORA**" : `🕒 **${m.time}**`;
                            response += `🎾 vs **${rival}**\n📍 ${m.court} | ${timeInfo}\n\n`;
                        });
                    } else if (finished.length > 0) {
                        response += `✅ **Fase Completada:**\nNo hay partidos pendientes ahora mismo.\n`;
                    }

                    if (finished.length > 0) {
                        response += `📊 **Resultados:**\n`;
                        finished.slice(0, 3).forEach(m => {
                            const isTeamA = keywords.every(kw => this.normalize(m.teamA).includes(kw));
                            const me = isTeamA ? m.teamA : m.teamB;
                            const myScore = isTeamA ? m.scoreA : m.scoreB;
                            const rivalScore = isTeamA ? m.scoreB : m.scoreA;
                            const rival = isTeamA ? m.teamB : m.teamA;
                            const icon = (myScore > rivalScore) ? "🏆" : "❌";
                            response += `${icon} **${me}** vs ${rival}\nResult: **${myScore}-${rivalScore}**\n\n`;
                        });
                    }

                    return response;
                } else {
                    return `Mmm... no encuentro a nadie llamado **"${cleanName}"** 🤔.\n\nPrueba a escribir solo el nombre o el apellido, a veces menos es más.`;
                }
            }

            // DEFAULT FALLBACK
            return "No te he entendido del todo... 😅\n\nPrueba a decirme **tu nombre**, preguntar por **premios** o ver la **clasificación**.";

        } catch (err) {
            console.error("AI Error:", err);
            return "Lo siento, he tenido un chispazo... ⚡ ¿Me lo repites?";
        }
    }
}

document.addEventListener('DOMContentLoaded', () => { window.padelBot = new PadelBot(); });
