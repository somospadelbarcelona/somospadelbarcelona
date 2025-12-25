/**
 * ANALYTICS ENGINE - SOMOSPADEL TOURNAMENT
 * Motor de análisis de datos para estadísticas avanzadas
 * @version 1.0.0
 */

// ============================================
// CORE ANALYTICS FUNCTIONS
// ============================================

/**
 * Calcula estadísticas completas para todas las parejas del torneo
 * @param {Object} tournamentData - Datos del torneo
 * @returns {Array} Array de objetos con estadísticas por pareja
 */
function calculateTeamStats(tournamentData) {
    const stats = {};

    // Procesar todos los partidos de fase de grupos
    const groupMatches = tournamentData.matches.filter(m => m.stage === 'group');

    groupMatches.forEach(match => {
        // Inicializar stats para cada equipo si no existe
        [match.teamA, match.teamB].forEach(team => {
            if (!stats[team]) {
                stats[team] = {
                    team: team,
                    category: match.category,
                    group: match.group,
                    played: 0,
                    won: 0,
                    lost: 0,
                    draw: 0,
                    gamesFor: 0,
                    gamesAgainst: 0,
                    gameDiff: 0,
                    points: 0,
                    winRate: 0,
                    avgGamesFor: 0,
                    avgGamesAgainst: 0,
                    efficiency: 0,
                    matches: []
                };
            }
        });

        // Procesar solo partidos finalizados
        if (match.status === 'finished') {
            const scoreA = parseInt(match.scoreA) || 0;
            const scoreB = parseInt(match.scoreB) || 0;

            // Actualizar estadísticas de ambos equipos
            stats[match.teamA].played++;
            stats[match.teamB].played++;

            stats[match.teamA].gamesFor += scoreA;
            stats[match.teamA].gamesAgainst += scoreB;
            stats[match.teamB].gamesFor += scoreB;
            stats[match.teamB].gamesAgainst += scoreA;

            stats[match.teamA].matches.push({
                opponent: match.teamB,
                scoreFor: scoreA,
                scoreAgainst: scoreB,
                time: match.time,
                court: match.court
            });

            stats[match.teamB].matches.push({
                opponent: match.teamA,
                scoreFor: scoreB,
                scoreAgainst: scoreA,
                time: match.time,
                court: match.court
            });

            // Determinar ganador
            if (scoreA > scoreB) {
                stats[match.teamA].won++;
                stats[match.teamA].points += 3;
                stats[match.teamB].lost++;
            } else if (scoreB > scoreA) {
                stats[match.teamB].won++;
                stats[match.teamB].points += 3;
                stats[match.teamA].lost++;
            } else {
                stats[match.teamA].draw++;
                stats[match.teamB].draw++;
                stats[match.teamA].points += 1;
                stats[match.teamB].points += 1;
            }
        }
    });

    // Calcular métricas derivadas
    Object.values(stats).forEach(team => {
        team.gameDiff = team.gamesFor - team.gamesAgainst;
        team.winRate = team.played > 0 ? (team.won / team.played * 100).toFixed(1) : 0;
        team.avgGamesFor = team.played > 0 ? (team.gamesFor / team.played).toFixed(2) : 0;
        team.avgGamesAgainst = team.played > 0 ? (team.gamesAgainst / team.played).toFixed(2) : 0;

        // Efficiency: combinación de win rate y diferencia de juegos
        team.efficiency = team.played > 0
            ? ((team.winRate * 0.7) + (team.gameDiff * 5)).toFixed(1)
            : 0;
    });

    return Object.values(stats);
}

/**
 * Obtiene las mejores parejas por juegos a favor
 * @param {Array} teamStats - Estadísticas de equipos
 * @param {Number} limit - Número de equipos a retornar
 * @returns {Array} Top N equipos ordenados por juegos a favor
 */
function getTopTeamsByGamesFor(teamStats, limit = 10) {
    return teamStats
        .filter(t => t.played > 0)
        .sort((a, b) => b.gamesFor - a.gamesFor)
        .slice(0, limit);
}

/**
 * Obtiene equipos ordenados por diferencia de juegos
 * @param {Array} teamStats - Estadísticas de equipos
 * @param {Number} limit - Número de equipos a retornar
 * @returns {Array} Equipos ordenados por diferencia
 */
function getTeamsByGameDiff(teamStats, limit = 10) {
    return teamStats
        .filter(t => t.played > 0)
        .sort((a, b) => b.gameDiff - a.gameDiff)
        .slice(0, limit);
}

/**
 * Calcula distribución de victorias por categoría
 * @param {Object} tournamentData - Datos del torneo
 * @returns {Object} Distribución por categoría
 */
function getVictoryDistribution(tournamentData) {
    const distribution = {};

    tournamentData.categories.forEach(cat => {
        distribution[cat] = {
            category: cat,
            totalMatches: 0,
            finishedMatches: 0,
            pendingMatches: 0,
            liveMatches: 0
        };
    });

    tournamentData.matches
        .filter(m => m.stage === 'group')
        .forEach(match => {
            const cat = match.category;
            if (distribution[cat]) {
                distribution[cat].totalMatches++;

                if (match.status === 'finished') {
                    distribution[cat].finishedMatches++;
                } else if (match.status === 'live') {
                    distribution[cat].liveMatches++;
                } else {
                    distribution[cat].pendingMatches++;
                }
            }
        });

    return distribution;
}

/**
 * Analiza rendimiento por franja horaria
 * @param {Array} teamStats - Estadísticas de equipos
 * @returns {Object} Rendimiento por horario
 */
function getPerformanceByTimeSlot(teamStats) {
    const timeSlots = {
        '13:30-14:30': { wins: 0, losses: 0, totalGames: 0 },
        '14:30-15:30': { wins: 0, losses: 0, totalGames: 0 },
        '15:30-16:30': { wins: 0, losses: 0, totalGames: 0 },
        '16:30-17:30': { wins: 0, losses: 0, totalGames: 0 },
        '17:30-18:30': { wins: 0, losses: 0, totalGames: 0 }
    };

    teamStats.forEach(team => {
        team.matches.forEach(match => {
            const hour = parseInt(match.time.split(':')[0]);
            let slot;

            if (hour >= 13 && hour < 14) slot = '13:30-14:30';
            else if (hour >= 14 && hour < 15) slot = '14:30-15:30';
            else if (hour >= 15 && hour < 16) slot = '15:30-16:30';
            else if (hour >= 16 && hour < 17) slot = '16:30-17:30';
            else if (hour >= 17 && hour < 19) slot = '17:30-18:30';

            if (slot && timeSlots[slot]) {
                timeSlots[slot].totalGames += match.scoreFor;

                if (match.scoreFor > match.scoreAgainst) {
                    timeSlots[slot].wins++;
                } else if (match.scoreFor < match.scoreAgainst) {
                    timeSlots[slot].losses++;
                }
            }
        });
    });

    return timeSlots;
}

/**
 * Genera timeline de evolución del torneo
 * @param {Object} tournamentData - Datos del torneo
 * @returns {Array} Timeline con partidos por hora
 */
function getTournamentTimeline(tournamentData) {
    const timeline = {};

    tournamentData.matches
        .filter(m => m.stage === 'group')
        .forEach(match => {
            const time = match.time;
            if (!timeline[time]) {
                timeline[time] = {
                    time: time,
                    finished: 0,
                    live: 0,
                    pending: 0,
                    total: 0
                };
            }

            timeline[time].total++;
            if (match.status === 'finished') timeline[time].finished++;
            else if (match.status === 'live') timeline[time].live++;
            else timeline[time].pending++;
        });

    return Object.values(timeline).sort((a, b) => {
        const [ha, ma] = a.time.split(':').map(Number);
        const [hb, mb] = b.time.split(':').map(Number);
        return (ha * 60 + ma) - (hb * 60 + mb);
    });
}

/**
 * Extrae estadísticas individuales de jugadores
 * @param {Array} teamStats - Estadísticas de equipos
 * @returns {Object} Estadísticas por jugador individual
 */
function getPlayerIndividualStats(teamStats) {
    const playerStats = {};

    teamStats.forEach(team => {
        // Separar nombres de la pareja
        const players = team.team.split(' / ').map(p => p.trim());

        players.forEach(player => {
            if (!playerStats[player]) {
                playerStats[player] = {
                    name: player,
                    teams: [],
                    totalPlayed: 0,
                    totalWon: 0,
                    totalGamesFor: 0,
                    totalGamesAgainst: 0,
                    categories: new Set()
                };
            }

            playerStats[player].teams.push(team.team);
            playerStats[player].totalPlayed += team.played;
            playerStats[player].totalWon += team.won;
            playerStats[player].totalGamesFor += team.gamesFor;
            playerStats[player].totalGamesAgainst += team.gamesAgainst;
            playerStats[player].categories.add(team.category);
        });
    });

    // Convertir Set a Array y calcular métricas
    Object.values(playerStats).forEach(player => {
        player.categories = Array.from(player.categories);
        player.winRate = player.totalPlayed > 0
            ? (player.totalWon / player.totalPlayed * 100).toFixed(1)
            : 0;
        player.avgGamesFor = player.totalPlayed > 0
            ? (player.totalGamesFor / player.totalPlayed).toFixed(2)
            : 0;
    });

    return playerStats;
}

/**
 * Obtiene KPIs generales del torneo
 * @param {Object} tournamentData - Datos del torneo
 * @param {Array} teamStats - Estadísticas de equipos
 * @returns {Object} KPIs principales
 */
function getTournamentKPIs(tournamentData, teamStats) {
    const groupMatches = tournamentData.matches.filter(m => m.stage === 'group');
    const finishedMatches = groupMatches.filter(m => m.status === 'finished');

    const totalGames = finishedMatches.reduce((sum, m) => {
        return sum + (parseInt(m.scoreA) || 0) + (parseInt(m.scoreB) || 0);
    }, 0);

    const avgGamesPerMatch = finishedMatches.length > 0
        ? (totalGames / finishedMatches.length).toFixed(1)
        : 0;

    const topTeam = teamStats.length > 0
        ? teamStats.sort((a, b) => b.efficiency - a.efficiency)[0]
        : null;

    return {
        totalMatches: groupMatches.length,
        finishedMatches: finishedMatches.length,
        liveMatches: groupMatches.filter(m => m.status === 'live').length,
        pendingMatches: groupMatches.filter(m => m.status === 'pending').length,
        completionRate: groupMatches.length > 0
            ? (finishedMatches.length / groupMatches.length * 100).toFixed(1)
            : 0,
        totalGames: totalGames,
        avgGamesPerMatch: avgGamesPerMatch,
        totalTeams: teamStats.length,
        topTeam: topTeam ? topTeam.team : 'N/A',
        topTeamEfficiency: topTeam ? topTeam.efficiency : 0
    };
}

// ============================================
// EXPORT (si se usa como módulo)
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateTeamStats,
        getTopTeamsByGamesFor,
        getTeamsByGameDiff,
        getVictoryDistribution,
        getPerformanceByTimeSlot,
        getTournamentTimeline,
        getPlayerIndividualStats,
        getTournamentKPIs
    };
}

console.log('📊 Analytics Engine loaded successfully');
