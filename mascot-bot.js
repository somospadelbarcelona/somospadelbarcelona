/**
 * SomosPadel BCN - Tu compañero del torneo
 * Búsqueda Inteligente Blindada y Humana
 */

class PadelBot {
    constructor() {
        this.isOpen = false;
        this.suggestions = [
            "🏆 ¿Próximo partido?",
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
        const input = document.getElementById('bot-input');
        const val = textOverride || input.value.trim();
        if (!val) return;
        input.value = '';
        this.addMessage("user", val);
        const response = await this.processAI(val);
        setTimeout(() => this.addMessage("bot", response), 500);
    }

    async processAI(query) {
        const q = this.normalize(query);
        const data = window.tournamentData || {};

        // 1. Lógica de CLASIFICACIÓN ESPECÍFICA (Si menciona nombre + clasificación/puntos)
        if (q.includes("clasificacion") || q.includes("puntos") || q.includes("puesto") || q.includes("posicion")) {
            const searchName = q.replace(/clasificacion|puntos|puesto|posicion|de|la|el/g, "").trim();
            if (searchName.length >= 3) {
                const playerMatch = (data.matches || []).find(m =>
                    this.normalize(m.teamA).includes(searchName) ||
                    this.normalize(m.teamB).includes(searchName)
                );

                if (playerMatch && typeof window.getStandings === 'function') {
                    const teamName = this.normalize(playerMatch.teamA).includes(searchName) ? playerMatch.teamA : playerMatch.teamB;
                    const leaderboard = window.getStandings(playerMatch.category, playerMatch.group);
                    const pos = leaderboard.findIndex(s => s.name === teamName);

                    if (pos !== -1) {
                        const s = leaderboard[pos];
                        return `📊 **Clasificación para ${teamName}:**\n\nVa en la **posición ${pos + 1}** del Grupo ${playerMatch.group} (${playerMatch.category}).\n\n- Puntos: **${s.points}**\n- Partidos: ${s.played}\n- Ganados: ${s.won}\n- Diferencia: ${s.diff > 0 ? '+' : ''}${s.diff} juegos.\n\n¡A seguir dándole duro! 🎾🔥`;
                    }
                }
            }
        }

        // 2. Lógica de Búsqueda de PARTIDOS (Nombre solo o con "cuando juego")
        const isNavQuery = q === "clasificacion" || q === "puntos" || q === "puesto" || q === "cuando juego";
        const isGreeting = q.includes("hola") || q.includes("buenos") || q.includes("buenas");

        if (q.length >= 3 && !isNavQuery && !isGreeting) {
            const searchName = q.replace(/cuando|juego|mi|partido|horario|pista/g, "").trim();
            const target = searchName.length >= 3 ? searchName : q;

            const matches = (data.matches || []).filter(m =>
                this.normalize(m.teamA).includes(target) ||
                this.normalize(m.teamB).includes(target)
            );

            if (matches.length > 0) {
                let response = `¡Te tengo! He encontrado estos partidos para **"${target}"**:\n\n`;
                matches.forEach(m => {
                    const isTeamA = this.normalize(m.teamA).includes(target);
                    const rival = isTeamA ? m.teamB : m.teamA;
                    const time = m.time ? ` a las **${m.time}**` : "";
                    const court = m.court ? ` en la **Pista ${m.court}**` : "";
                    const result = m.status === 'finished' ? ` | **Resultado: ${m.scoreA}-${m.scoreB}**` :
                        m.status === 'live' ? " | 🔴 **¡EN JUEGO!**" : "";

                    response += `🎾 vs **${rival}**\n📍 ${court}${time}${result}\n\n`;
                });
                return response;
            }
        }

        // 3. Respuestas Genéricas de Navegación
        if (q.includes("cuando juego") || q.includes("horario") || q.includes("mi hora")) {
            return "¡Fácil! **Dime tu nombre** y buscaré tu pista y horario al momento. ¡Dime quién eres!";
        }

        if (q.includes("clasificacion") || q.includes("puntos") || q.includes("puesto")) {
            return "¡La tabla está que arde! 🏁 Puedes ver la clasificación completa de cada grupo pulsando en la pestaña **'Clasificación'** de arriba. Si buscas tu posición exacta, dime **'Clasificación' + tu nombre**.";
        }

        if (q.includes("reglas") || q.includes("normativa") || q.includes("punto de oro") || q.includes("duda") || q.includes("tiempo")) {
            return `¡Aquí las tienes claras! 📖\n\n1. **Punto de Oro:** En 40-40, el siguiente gana.\n2. **Dudas:** Ante cualquier desacuerdo, se repite el punto.\n3. **Fin de tiempo:** El juego inacabado **no cuenta** si ya hay un ganador. **Solo si hay empate a juegos** se mira quién va ganando el juego actual para desempatar.\n\nCada juego es vital para el desempate del grupo, ¡jugadlos todos!`;
        }

        if (q.includes("premio") || q.includes("ganar") || q.includes("jamon") || q.includes("paletilla") || q.includes("cookie") || q.includes("sorteo")) {
            return `¡Los premios son brutales! 🎁✨\n\n- **1º Campeones:** La mítica **Paletilla de Jamón del Guijuelo**. 🍖\n- **2º Finalistas:** Un delicioso obsequio de **Luvidocookies**. 🍪\n\n¡Y lo mejor! Habrá un **Sorteo Final** con productos que os van a encantar y... **¡Sortearemos otra paletilla de jamón adicional!** entre todos los participantes. 🎉\n\n¡Nadie se va con las manos vacías!`;
        }

        if (q.includes("eliminatoria") || q.includes("finales") || q.includes("cruces") || q.includes("cuadro")) {
            return "¡La fase decisiva! 🏆 Puedes ver todos los cuadros de eliminatorias (Cuartos, Semis y Finales) pulsando en la pestaña **'Eliminatorias'** de arriba. Ahí verás quién se cruza con quién tras la fase de grupos.";
        }

        if (q.includes("programacion") || q.includes("cuadrante") || q.includes("todo el dia") || q.includes("pistas")) {
            return "📅 **Ver la Programación:** Para ver el despliegue de todas las pistas y horarios del día, pulsa en la pestaña **'Programación'**. Allí verás el cuadrante completo de 13:30 a 18:30.";
        }

        if (isGreeting) {
            return "¡Hola! 👋 ¿Cómo va el torneo? Soy tu compañero de pista, pregúntame lo que necesites.";
        }

        return "No te he entendido del todo... 😅 pero puedo buscar tu nombre, darte tu clasificación, las reglas o informarte sobre los premios. **¿Cómo se llama tu equipo o sobre qué tienes duda?**";
    }
}

document.addEventListener('DOMContentLoaded', () => { window.padelBot = new PadelBot(); });
