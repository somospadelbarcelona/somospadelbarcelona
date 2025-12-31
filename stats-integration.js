// ============================================
// STATS TAB INTEGRATION
// ============================================

let activeStatsCat = null;
let statsCache = {
    data: null,
    timestamp: null,
    ttl: 30000 // 30 segundos
};
let chartInstances = {}; // Store chart instances for cleanup

/**
 * Inicializa la pestaña de estadísticas
 */
function initStats() {
    console.log('📊 initStats STARTED');

    if (typeof Chart === 'undefined') {
        console.error('❌ Chart.js NOT LOADED! Statistics cannot render.');
    } else {
        console.log('✅ Chart.js is loaded');
    }

    if (!tournamentData) {
        console.error('❌ tournamentData is MISSING');
        return;
    }
    console.log('✅ tournamentData found with', tournamentData.matches?.length, 'matches');

    if (!activeStatsCat && tournamentData.categories.length > 0) {
        activeStatsCat = tournamentData.categories[0];
    }
    console.log('📂 Active Stats Category:', activeStatsCat);

    // Render category tabs for stats
    renderCategoryTabs('stats-categories', activeStatsCat, (cat) => {
        console.log('🔄 Switching Stats Category to:', cat);
        activeStatsCat = cat;
        renderStatsCharts();
    });

    // Initial render
    renderStatsCharts();
}

/**
 * Obtiene estadísticas con caché
 */
function getCachedStats() {
    const now = Date.now();
    if (statsCache.data && (now - statsCache.timestamp) < statsCache.ttl) {
        console.log('📊 Usando estadísticas en caché');
        return statsCache.data;
    }

    console.log('📊 Calculando nuevas estadísticas...');
    statsCache.data = calculateTeamStats(tournamentData);
    statsCache.timestamp = now;
    return statsCache.data;
}

/**
 * Renderiza todos los gráficos y KPIs
 */
function renderStatsCharts() {
    const teamStats = getCachedStats();

    // Filtrar por categoría activa si está seleccionada
    const filteredStats = activeStatsCat
        ? teamStats.filter(t => t.category === activeStatsCat)
        : teamStats;

    // Actualizar KPIs
    updateKPIs(filteredStats);

    // Renderizar gráficos
    renderTopTeamsChart(filteredStats);
    renderDistributionChart();
    renderGameDiffChart(filteredStats);
    renderTimePerformanceChart(teamStats);
    renderTimelineChart();
    renderPredictionsPanel(filteredStats);
}

/**
 * Actualiza los KPIs en la parte superior
 */
function updateKPIs(teamStats) {
    const kpis = getTournamentKPIs(tournamentData, teamStats);

    const totalMatchesEl = document.getElementById('kpi-total-matches');
    const completionRateEl = document.getElementById('kpi-completion-rate');
    const avgGamesEl = document.getElementById('kpi-avg-games');
    const topTeamEl = document.getElementById('kpi-top-team');

    if (totalMatchesEl) totalMatchesEl.textContent = kpis.totalMatches;
    if (completionRateEl) completionRateEl.textContent = kpis.completionRate + '%';
    if (avgGamesEl) avgGamesEl.textContent = kpis.avgGamesPerMatch;
    if (topTeamEl) {
        const shortName = kpis.topTeam.length > 20
            ? kpis.topTeam.substring(0, 18) + '...'
            : kpis.topTeam;
        topTeamEl.textContent = shortName;
        topTeamEl.title = kpis.topTeam; // Full name on hover
    }
}

/**
 * Gráfico 1: Top 10 Parejas por Juegos a Favor
 */
function renderTopTeamsChart(teamStats) {
    const canvas = document.getElementById('chart-top-teams');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const topTeams = getTopTeamsByGamesFor(teamStats, 10);

    // Destroy previous chart if exists
    if (chartInstances.topTeams) {
        chartInstances.topTeams.destroy();
    }

    chartInstances.topTeams = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topTeams.map(t => {
                const name = t.team.length > 25 ? t.team.substring(0, 23) + '...' : t.team;
                return name;
            }),
            datasets: [{
                label: 'Juegos a Favor',
                data: topTeams.map(t => t.gamesFor),
                backgroundColor: 'rgba(204, 255, 0, 0.7)',
                borderColor: 'rgba(204, 255, 0, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ccff00',
                    bodyColor: '#fff',
                    callbacks: {
                        title: (items) => topTeams[items[0].dataIndex].team,
                        label: (context) => {
                            const team = topTeams[context.dataIndex];
                            return [
                                `Juegos a Favor: ${team.gamesFor}`,
                                `Partidos Ganados: ${team.won}/${team.played}`,
                                `Win Rate: ${team.winRate}%`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#fff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: '#fff', maxRotation: 45, minRotation: 45 },
                    grid: { display: false }
                }
            }
        }
    });

    canvas.parentElement.classList.add('loaded');
}

/**
 * Gráfico 2: Distribución por Categoría
 */
function renderDistributionChart() {
    const canvas = document.getElementById('chart-distribution');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const distribution = getVictoryDistribution(tournamentData);

    const categories = Object.keys(distribution);
    const finishedCounts = categories.map(cat => distribution[cat].finishedMatches);

    if (chartInstances.distribution) {
        chartInstances.distribution.destroy();
    }

    chartInstances.distribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                label: 'Partidos Finalizados',
                data: finishedCounts,
                backgroundColor: [
                    'rgba(204, 255, 0, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(168, 85, 247, 0.8)'
                ],
                borderColor: '#000',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#fff', padding: 15 }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ccff00',
                    bodyColor: '#fff',
                    callbacks: {
                        label: (context) => {
                            const cat = categories[context.dataIndex];
                            const dist = distribution[cat];
                            return [
                                `Finalizados: ${dist.finishedMatches}`,
                                `En Juego: ${dist.liveMatches}`,
                                `Pendientes: ${dist.pendingMatches}`,
                                `Total: ${dist.totalMatches}`
                            ];
                        }
                    }
                }
            }
        }
    });

    canvas.parentElement.classList.add('loaded');
}

/**
 * Gráfico 3: Diferencia de Juegos (Top 10)
 */
function renderGameDiffChart(teamStats) {
    const canvas = document.getElementById('chart-game-diff');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const topDiff = getTeamsByGameDiff(teamStats, 10);

    if (chartInstances.gameDiff) {
        chartInstances.gameDiff.destroy();
    }

    chartInstances.gameDiff = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topDiff.map(t => {
                const name = t.team.length > 25 ? t.team.substring(0, 23) + '...' : t.team;
                return name;
            }),
            datasets: [{
                label: 'Diferencia de Juegos',
                data: topDiff.map(t => t.gameDiff),
                backgroundColor: topDiff.map(t =>
                    t.gameDiff >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)'
                ),
                borderColor: topDiff.map(t =>
                    t.gameDiff >= 0 ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)'
                ),
                borderWidth: 2
            }]
        },
        options: {
            indexAxis: 'y', // Horizontal bars
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ccff00',
                    bodyColor: '#fff',
                    callbacks: {
                        title: (items) => topDiff[items[0].dataIndex].team,
                        label: (context) => {
                            const team = topDiff[context.dataIndex];
                            return [
                                `Diferencia: ${team.gameDiff > 0 ? '+' : ''}${team.gameDiff}`,
                                `JF: ${team.gamesFor} | JC: ${team.gamesAgainst}`,
                                `Victorias: ${team.won}/${team.played}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#fff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    ticks: { color: '#fff' },
                    grid: { display: false }
                }
            }
        }
    });

    canvas.parentElement.classList.add('loaded');
}

/**
 * Gráfico 4: Rendimiento por Horario
 */
function renderTimePerformanceChart(teamStats) {
    const canvas = document.getElementById('chart-time-performance');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const timePerf = getPerformanceByTimeSlot(teamStats);

    const slots = Object.keys(timePerf);
    const wins = slots.map(slot => timePerf[slot].wins);
    const losses = slots.map(slot => timePerf[slot].losses);

    if (chartInstances.timePerformance) {
        chartInstances.timePerformance.destroy();
    }

    chartInstances.timePerformance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: slots,
            datasets: [
                {
                    label: 'Victorias',
                    data: wins,
                    backgroundColor: 'rgba(34, 197, 94, 0.7)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 2
                },
                {
                    label: 'Derrotas',
                    data: losses,
                    backgroundColor: 'rgba(239, 68, 68, 0.7)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#fff' }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ccff00',
                    bodyColor: '#fff'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#fff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: '#fff' },
                    grid: { display: false }
                }
            }
        }
    });

    canvas.parentElement.classList.add('loaded');
}

/**
 * Gráfico 5: Evolución del Torneo
 */
function renderTimelineChart() {
    const canvas = document.getElementById('chart-timeline');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const timeline = getTournamentTimeline(tournamentData);

    if (chartInstances.timeline) {
        chartInstances.timeline.destroy();
    }

    chartInstances.timeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeline.map(t => t.time),
            datasets: [
                {
                    label: 'Finalizados',
                    data: timeline.map(t => t.finished),
                    borderColor: 'rgba(34, 197, 94, 1)',
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'En Juego',
                    data: timeline.map(t => t.live),
                    borderColor: 'rgba(204, 255, 0, 1)',
                    backgroundColor: 'rgba(204, 255, 0, 0.2)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Pendientes',
                    data: timeline.map(t => t.pending),
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#fff' }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ccff00',
                    bodyColor: '#fff'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#fff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: '#fff' },
                    grid: { display: false }
                }
            }
        }
    });

    canvas.parentElement.classList.add('loaded');
}

/**
 * Panel 6: Predicciones IA
 */
function renderPredictionsPanel(teamStats) {
    const container = document.querySelector('#predictions-container .predictions-list');
    if (!container) {
        console.error('❌ Oráculo Container NOT FOUND');
        return;
    }

    if (!teamStats || teamStats.length === 0) {
        console.warn('⚠️ Oráculo: No teamStats available');
        container.innerHTML = '<div class="no-data">No hay suficientes datos para predicciones</div>';
        return;
    }

    try {
        console.log('🔮 Rendering Oráculo with', teamStats.length, 'teams');
        // Calcular ratings Elo

        // Calcular ratings Elo
        const eloRatings = calculateEloRatings(teamStats);

        // Obtener top 5 equipos por rating
        const topByElo = Object.entries(eloRatings)
            .map(([team, rating]) => ({ team, rating }))
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 8);

        container.innerHTML = topByElo.map(item => {
            const stats = teamStats.find(t => t.team === item.team);
            const patterns = stats ? detectPerformancePatterns(stats) : null;

            const probability = ((item.rating - 1200) / 800 * 100).toFixed(1); // Normalize to %
            const normalizedProb = Math.max(0, Math.min(100, probability));

            // Trend Icon
            let trendHtml = '';
            if (patterns) {
                if (patterns.streakType === 'winning' && patterns.streakLength >= 2) {
                    trendHtml = `<span class="trend-badge hot" title="Racha de victorias: ${patterns.streakLength}"><i class="fas fa-fire"></i> HOT</span>`;
                } else if (patterns.streakType === 'losing' && patterns.streakLength >= 2) {
                    trendHtml = `<span class="trend-badge cold" title="Racha de derrotas: ${patterns.streakLength}"><i class="fas fa-snowflake"></i> COLD</span>`;
                }
            }

            return `
            <div class="prediction-item elite-oracle-card">
                <div class="prediction-team">
                    <span class="prediction-team-name">${item.team} ${trendHtml}</span>
                    <span class="prediction-probability">${normalizedProb}%</span>
                </div>
                <div class="prediction-bar">
                    <div class="prediction-bar-fill" style="width: ${normalizedProb}%"></div>
                </div>
                <div class="prediction-meta">
                    <div class="meta-stat">
                        <i class="fas fa-chart-line"></i> Rating Elo: <b>${item.rating.toFixed(0)}</b>
                    </div>
                    <div class="meta-stat">
                        <i class="fas fa-bullseye"></i> Consistencia: <b>${patterns ? patterns.consistency : 'N/A'}%</b>
                    </div>
                    <div class="meta-stat">
                        <span class="win-loss-count ${stats && stats.won > stats.lost ? 'positive' : ''}">
                            ${stats ? `${stats.won}V - ${stats.lost}D` : '0V - 0D'}
                        </span>
                    </div>
                </div>
            </div>
        `;
        }).join('');
    } catch (error) {
        console.error('❌ Error rendering Oráculo:', error);
        container.innerHTML = '<div class="no-data">Error calculando predicciones</div>';
    }
}

/**
 * Invalidar caché cuando cambian los datos
 */
function invalidateStatsCache() {
    statsCache.data = null;
    statsCache.timestamp = null;
}

// Hook seguro para saveState - Esperamos a que app.js cargue
window.addEventListener('DOMContentLoaded', () => {
    if (typeof saveState === 'function') {
        const originalSaveState = saveState;
        saveState = function () {
            originalSaveState();
            invalidateStatsCache();

            // Si la pestaña de stats está activa, actualizar
            const statsTab = document.getElementById('stats-tab');
            if (statsTab && statsTab.style.display !== 'none') {
                if (typeof renderStatsCharts === 'function') {
                    renderStatsCharts();
                }
            }
        };
        console.log('✅ Stats Integration hooked into saveState');
    } else {
        console.warn('⚠️ saveState no encontrado - Hook de actualización automática deshabilitado');
    }
});

// Helper check helper
function isChartJsLoaded() {
    return typeof Chart !== 'undefined';
}

// Wrap render calls
const unsafeRenderTopTeams = renderTopTeamsChart;
renderTopTeamsChart = function (stats) {
    if (!isChartJsLoaded()) return;
    try { unsafeRenderTopTeams(stats); } catch (e) { console.error("Chart Error:", e); }
};

const unsafeRenderDistribution = renderDistributionChart;
renderDistributionChart = function () {
    if (!isChartJsLoaded()) return;
    try { unsafeRenderDistribution(); } catch (e) { console.error("Chart Error:", e); }
};

const unsafeRenderGameDiff = renderGameDiffChart;
renderGameDiffChart = function (stats) {
    if (!isChartJsLoaded()) return;
    try { unsafeRenderGameDiff(stats); } catch (e) { console.error("Chart Error:", e); }
};

const unsafeRenderTime = renderTimePerformanceChart;
renderTimePerformanceChart = function (stats) {
    if (!isChartJsLoaded()) return;
    try { unsafeRenderTime(stats); } catch (e) { console.error("Chart Error:", e); }
};

const unsafeRenderTimeline = renderTimelineChart;
renderTimelineChart = function () {
    if (!isChartJsLoaded()) return;
    try { unsafeRenderTimeline(); } catch (e) { console.error("Chart Error:", e); }
};

const unsafeRenderPredictions = renderPredictionsPanel;
renderPredictionsPanel = function (stats) {
    try { unsafeRenderPredictions(stats); } catch (e) { console.error("Predictions Error:", e); }
};

// EXPORT GLOBALS
window.initStats = initStats;
window.renderStatsCharts = renderStatsCharts;

console.log('📊 Stats Integration loaded successfully');
