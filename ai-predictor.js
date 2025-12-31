/**
 * AI PREDICTOR - SOMOSPADEL TOURNAMENT
 * Algoritmos de predicción e inteligencia artificial
 * @version 1.0.0
 */

// ============================================
// ELO RATING SYSTEM
// ============================================

/**
 * Calcula rating Elo para todas las parejas basado en resultados
 * @param {Array} teamStats - Estadísticas de equipos
 * @param {Number} K - Factor K de Elo (default: 32)
 * @returns {Object} Ratings Elo por equipo
 */
function calculateEloRatings(teamStats, K = 32) {
    const ratings = {};
    const INITIAL_RATING = 1500;

    // Inicializar ratings
    teamStats.forEach(team => {
        ratings[team.team] = INITIAL_RATING;
    });

    // Procesar partidos en orden cronológico
    teamStats.forEach(team => {
        // Sort matches by time (rough chronological order if available)
        const sortedMatches = [...team.matches].sort((a, b) => (a.time || '').localeCompare(b.time || ''));

        sortedMatches.forEach((match, idx) => {
            const teamRating = ratings[team.team] || INITIAL_RATING;
            const oppRating = ratings[match.opponent] || INITIAL_RATING;

            // Probabilidad esperada
            const expectedScore = 1 / (1 + Math.pow(10, (oppRating - teamRating) / 400));

            // Resultado real (1 = victoria, 0.5 = empate, 0 = derrota)
            let actualScore = 0;
            if (match.scoreFor > match.scoreAgainst) actualScore = 1;
            else if (match.scoreFor === match.scoreAgainst) actualScore = 0.5;

            // Factor de ajuste basado en diferencia de juegos
            const gameDiff = Math.abs(match.scoreFor - match.scoreAgainst);

            // Momentum: matches more recent in the sequence have higher weight
            const momentumFactor = 1 + (idx / sortedMatches.length * 0.5);
            const multiplier = momentumFactor * (1 + (gameDiff * 0.1));

            // Actualizar rating
            ratings[team.team] += K * multiplier * (actualScore - expectedScore);
        });
    });

    return ratings;
}

/**
 * Predice el resultado de un partido entre dos equipos
 * @param {String} teamA - Nombre del equipo A
 * @param {String} teamB - Nombre del equipo B
 * @param {Object} eloRatings - Ratings Elo de todos los equipos
 * @returns {Object} Predicción con probabilidades
 */
function predictMatchOutcome(teamA, teamB, eloRatings) {
    const ratingA = eloRatings[teamA] || 1500;
    const ratingB = eloRatings[teamB] || 1500;

    // Probabilidad de victoria para equipo A (Logit curve)
    let probA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));

    // Humanize: Add a tiny organic jitter (+/- 1.5%) so it doesn't look static
    const jitter = (Math.random() * 0.03) - 0.015;
    probA = Math.max(0.05, Math.min(0.95, probA + jitter));

    const probB = 1 - probA;

    // Calcular confianza basada en diferencia de rating
    const ratingDiff = Math.abs(ratingA - ratingB);
    const confidence = Math.min(ratingDiff / 400, 1); // 0-1

    // Predicción de marcador estimado
    const baseGames = 5.5; // Slightly bumped for SV feel
    const expectedScoreA = Math.max(1, Math.round(baseGames * probA * 1.2));
    const expectedScoreB = Math.max(1, Math.round(baseGames * probB * 1.2));

    return {
        teamA: {
            name: teamA,
            winProbability: (probA * 100).toFixed(1),
            rating: ratingA.toFixed(0),
            expectedScore: expectedScoreA
        },
        teamB: {
            name: teamB,
            winProbability: (probB * 100).toFixed(1),
            rating: ratingB.toFixed(0),
            expectedScore: expectedScoreB
        },
        confidence: (confidence * 100).toFixed(1),
        favorite: probA > probB ? teamA : teamB,
        logic: probA > 0.6 ? 'Aggressive Offense' : (probA < 0.4 ? 'Defensive Stance' : 'Balanced Matchup')
    };
}

// ============================================
// MONTE CARLO SIMULATIONS
// ============================================

/**
 * Simula el resto del torneo usando Monte Carlo
 * @param {Object} tournamentData - Datos del torneo
 * @param {Object} eloRatings - Ratings Elo
 * @param {Number} iterations - Número de simulaciones (default: 1000)
 * @returns {Object} Probabilidades de clasificación por equipo
 */
function simulatePlayoffProbabilities(tournamentData, eloRatings, iterations = 1000) {
    const results = {};

    // Obtener partidos pendientes por categoría y grupo
    const pendingMatches = tournamentData.matches.filter(
        m => m.stage === 'group' && m.status === 'pending'
    );

    // Inicializar contadores
    tournamentData.matches
        .filter(m => m.stage === 'group')
        .forEach(match => {
            [match.teamA, match.teamB].forEach(team => {
                if (!results[team]) {
                    results[team] = {
                        team: team,
                        category: match.category,
                        group: match.group,
                        qualifications: 0,
                        avgPosition: 0,
                        positions: [0, 0, 0, 0, 0, 0] // Contador por posición
                    };
                }
            });
        });

    // Ejecutar simulaciones
    for (let i = 0; i < iterations; i++) {
        const simulatedData = JSON.parse(JSON.stringify(tournamentData));

        // Simular resultados de partidos pendientes
        pendingMatches.forEach(match => {
            const prediction = predictMatchOutcome(match.teamA, match.teamB, eloRatings);
            const rand = Math.random() * 100;

            // Determinar ganador basado en probabilidad
            if (rand < parseFloat(prediction.teamA.winProbability)) {
                // Gana equipo A
                const scoreA = Math.floor(Math.random() * 3) + 4; // 4-6 juegos
                const scoreB = Math.floor(Math.random() * scoreA); // Menos que A

                const matchIndex = simulatedData.matches.findIndex(m => m.id === match.id);
                if (matchIndex !== -1) {
                    simulatedData.matches[matchIndex].scoreA = scoreA;
                    simulatedData.matches[matchIndex].scoreB = scoreB;
                    simulatedData.matches[matchIndex].status = 'finished';
                }
            } else {
                // Gana equipo B
                const scoreB = Math.floor(Math.random() * 3) + 4;
                const scoreA = Math.floor(Math.random() * scoreB);

                const matchIndex = simulatedData.matches.findIndex(m => m.id === match.id);
                if (matchIndex !== -1) {
                    simulatedData.matches[matchIndex].scoreA = scoreA;
                    simulatedData.matches[matchIndex].scoreB = scoreB;
                    simulatedData.matches[matchIndex].status = 'finished';
                }
            }
        });

        // Calcular clasificaciones finales para esta simulación
        const categories = [...new Set(simulatedData.matches.map(m => m.category))];

        categories.forEach(category => {
            const groups = [...new Set(
                simulatedData.matches
                    .filter(m => m.category === category)
                    .map(m => m.group)
            )];

            groups.forEach(group => {
                const standings = getStandings(category, group, simulatedData);

                standings.forEach((team, index) => {
                    if (results[team.name]) {
                        results[team.name].positions[index]++;

                        // Los primeros 2 clasifican (ajustar según reglas)
                        if (index < 2) {
                            results[team.name].qualifications++;
                        }
                    }
                });
            });
        });
    }

    // Calcular probabilidades finales
    Object.values(results).forEach(team => {
        team.qualificationProbability = (team.qualifications / iterations * 100).toFixed(1);

        // Calcular posición promedio
        let totalPosition = 0;
        team.positions.forEach((count, pos) => {
            totalPosition += (pos + 1) * count;
        });
        team.avgPosition = (totalPosition / iterations).toFixed(2);
    });

    return results;
}

/**
 * Función auxiliar para calcular standings en simulación
 */
function getStandings(category, group, tournamentData) {
    const matches = tournamentData.matches.filter(
        m => m.category === category && m.group === group && m.stage === 'group'
    );
    const stats = {};

    matches.forEach(m => {
        [m.teamA, m.teamB].forEach(team => {
            if (!stats[team]) {
                stats[team] = {
                    name: team,
                    played: 0,
                    won: 0,
                    points: 0,
                    gf: 0,
                    ga: 0,
                    diff: 0
                };
            }
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
            stats[m.teamB].gf += sB;
            stats[m.teamB].ga += sA;

            stats[m.teamA].diff = stats[m.teamA].gf - stats[m.teamA].ga;
            stats[m.teamB].diff = stats[m.teamB].gf - stats[m.teamB].ga;

            if (sA > sB) {
                stats[m.teamA].points += 3;
                stats[m.teamA].won++;
            } else if (sB > sA) {
                stats[m.teamB].points += 3;
                stats[m.teamB].won++;
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

// ============================================
// PATTERN DETECTION
// ============================================

/**
 * Detecta patrones de rendimiento de un equipo
 * @param {Object} teamStats - Estadísticas del equipo
 * @returns {Object} Patrones detectados
 */
function detectPerformancePatterns(teamStats) {
    if (!teamStats.matches || teamStats.matches.length === 0) {
        return {
            timePreference: 'insufficient_data',
            streakType: 'none',
            consistency: 0,
            strongAgainst: [],
            weakAgainst: []
        };
    }

    // Analizar rendimiento por horario
    const morningPerf = { wins: 0, total: 0 };
    const afternoonPerf = { wins: 0, total: 0 };

    teamStats.matches.forEach(match => {
        const hour = parseInt(match.time.split(':')[0]);
        const won = match.scoreFor > match.scoreAgainst;

        if (hour < 15) {
            morningPerf.total++;
            if (won) morningPerf.wins++;
        } else {
            afternoonPerf.total++;
            if (won) afternoonPerf.wins++;
        }
    });

    const morningRate = morningPerf.total > 0 ? morningPerf.wins / morningPerf.total : 0;
    const afternoonRate = afternoonPerf.total > 0 ? afternoonPerf.wins / afternoonPerf.total : 0;

    let timePreference = 'balanced';
    if (morningRate > afternoonRate + 0.2) timePreference = 'morning_warrior';
    else if (afternoonRate > morningRate + 0.2) timePreference = 'afternoon_performer';

    // Detectar rachas
    let currentStreak = 0;
    let streakType = 'none';

    for (let i = teamStats.matches.length - 1; i >= 0; i--) {
        const match = teamStats.matches[i];
        const won = match.scoreFor > match.scoreAgainst;

        if (i === teamStats.matches.length - 1) {
            currentStreak = 1;
            streakType = won ? 'winning' : 'losing';
        } else {
            const prevWon = teamStats.matches[i + 1].scoreFor > teamStats.matches[i + 1].scoreAgainst;
            if (won === prevWon) {
                currentStreak++;
            } else {
                break;
            }
        }
    }

    // Calcular consistencia (desviación estándar de diferencia de juegos)
    const gameDiffs = teamStats.matches.map(m => m.scoreFor - m.scoreAgainst);
    const avgDiff = gameDiffs.reduce((a, b) => a + b, 0) / gameDiffs.length;
    const variance = gameDiffs.reduce((sum, diff) => sum + Math.pow(diff - avgDiff, 2), 0) / gameDiffs.length;
    const consistency = Math.max(0, 100 - Math.sqrt(variance) * 10).toFixed(1);

    return {
        timePreference: timePreference,
        streakType: currentStreak >= 2 ? streakType : 'none',
        streakLength: currentStreak >= 2 ? currentStreak : 0,
        consistency: parseFloat(consistency),
        morningWinRate: (morningRate * 100).toFixed(1),
        afternoonWinRate: (afternoonRate * 100).toFixed(1)
    };
}

// ============================================
// EXPORT
// ============================================
// ============================================
// EXPORT
// ============================================
window.calculateEloRatings = calculateEloRatings;
window.predictMatchOutcome = predictMatchOutcome;
window.simulatePlayoffProbabilities = simulatePlayoffProbabilities;
window.detectPerformancePatterns = detectPerformancePatterns;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateEloRatings,
        predictMatchOutcome,
        simulatePlayoffProbabilities,
        detectPerformancePatterns
    };
}

console.log('🤖 AI Predictor loaded successfully');
