
function renderBrackets() {
    const container = document.getElementById('brackets-container');
    if (!container) return;

    container.innerHTML = '';
    const cat = activePlayoffCat;
    if (!cat) return;

    // Filter Matches
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

    // --- QUARTERS COLUMN ---
    if (quarters.length > 0) {
        const roundQ = document.createElement('div');
        roundQ.className = 'tree-round round-quarters active';
        roundQ.innerHTML = '<div class="round-title">CUARTOS</div>';

        quarters.forEach((m, idx) => {
            const node = createBracketNode(m);
            const pairDiv = document.createElement('div');
            pairDiv.className = 'match-pair';
            pairDiv.appendChild(node);

            // Connectors (Only for 1 & 2 share a semi, 3 & 4 share a semi)
            if (idx % 2 === 0) {
                const fork = document.createElement('div');
                fork.className = 'connector-fork';
                pairDiv.appendChild(fork);
                // We need to group pairs visually? 
                // Actually the design usually stacks standard spacing. 
                // CSS .connector-fork implies an element spanning siblings.
                // Let's attach fork to the even index and stretch it?
                // Or better: Append fork to the container of the pair?
                // Simplification: Append to the first match of the pair, absolute positioned to bridge gap.
                // But CSS says top 25% bottom 25%.
                // Let's assume standard simple stacking for now.
            }

            roundQ.appendChild(pairDiv);
        });
        tree.appendChild(roundQ);
    }

    // --- SEMIS COLUMN ---
    if (semis.length > 0) {
        const roundS = document.createElement('div');
        roundS.className = 'tree-round round-semis active';
        roundS.innerHTML = '<div class="round-title">SEMIFINALES</div>';

        semis.forEach(m => {
            const node = createBracketNode(m);
            const pairDiv = document.createElement('div');
            pairDiv.className = 'match-pair has-gap'; // Bigger gap to center vs Quarters?
            pairDiv.appendChild(node);

            // Single line connector to Final
            const line = document.createElement('div');
            line.className = 'connector-fork-wide'; // Straight line
            pairDiv.appendChild(line);

            roundS.appendChild(pairDiv);
        });
        tree.appendChild(roundS);
    }

    // --- FINAL COLUMN ---
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

    // Live Badge
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
            <span class="node-time">${match.time !== 'TBD' ? match.time : ''}</span>
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
