// App Coordinator Module.
// Initializes modules, sets up DOM listeners, and manages app-wide visual sync.

import { RosterManager } from './roster.js';
import { MatchTimer } from './timer.js';
import { DragDropController } from './dragdrop.js';
import { PitchRenderer } from './pitch.js';
import { FORMATIONS } from './formations.js';
import { SeasonManager } from './season.js';

document.addEventListener('DOMContentLoaded', () => {
  // DOM References
  const DOM = {
    // Pitch Area
    pitchBackground: document.getElementById('pitch-background'),
    pitchPositionsContainer: document.getElementById('pitch-positions-container'),
    benchContainer: document.getElementById('bench-container'),
    
    // Timer Controls
    periodDisplay: document.getElementById('period-display'),
    btnAdvancePeriod: document.getElementById('btn-advance-period'),
    btnResetClock: document.getElementById('btn-reset-clock'),
    
    // Config / Strategy Controls
    formationSelect: document.getElementById('formation-select'),
    btnClearField: document.getElementById('btn-clear-field'),
    btnResetStats: document.getElementById('btn-reset-stats'),
    btnResetAllDefaults: document.getElementById('btn-reset-defaults'),
    
    // Modals
    btnAddPlayerTrigger: document.getElementById('btn-add-player-trigger'),
    addPlayerModal: document.getElementById('add-player-modal'),
    closeAddModal: document.getElementById('close-add-modal'),
    formAddPlayer: document.getElementById('form-add-player'),
    
    editPlayerModal: document.getElementById('edit-player-modal'),
    closeEditModal: document.getElementById('close-edit-modal'),
    formEditPlayer: document.getElementById('form-edit-player'),
    editPlayerId: document.getElementById('edit-player-id'),
    editPlayerName: document.getElementById('edit-player-name'),
    editPlayerNumber: document.getElementById('edit-player-number'),
    editPlayerPos: document.getElementById('edit-player-pos'),
    btnDeletePlayer: document.getElementById('btn-delete-player'),
    
    matchSettingsModal: document.getElementById('match-settings-modal'),
    btnMatchSettingsTrigger: document.getElementById('btn-match-settings-trigger'),
    closeSettingsModal: document.getElementById('close-settings-modal'),
    formMatchSettings: document.getElementById('form-match-settings'),
    settingsPeriodType: document.getElementById('settings-period-type'),
    settingsPeriodLen: document.getElementById('settings-period-length'),

    // Logs & Stats
    eventsLogList: document.getElementById('events-log-list'),
    statsTableBody: document.getElementById('stats-table-body'),
    
    // Backup & Restore
    btnExportRoster: document.getElementById('btn-export-roster'),
    btnImportRoster: document.getElementById('btn-import-roster'),
    fileImportInput: document.getElementById('file-import-input'),

    // Save Game Modals & Buttons
    btnSaveMatch: document.getElementById('btn-save-match'),
    saveMatchContainer: document.getElementById('save-match-container'),
    saveMatchModal: document.getElementById('save-match-modal'),
    closeSaveMatchModal: document.getElementById('close-save-match-modal'),
    formSaveMatch: document.getElementById('form-save-match'),

    // Season Modal & Controls
    btnSeasonTrigger: document.getElementById('btn-season-trigger'),
    seasonModal: document.getElementById('season-modal'),
    closeSeasonModal: document.getElementById('close-season-modal'),
    tabSeasonStats: document.getElementById('tab-season-stats'),
    tabMatchHistory: document.getElementById('tab-match-history'),
    tabContentStats: document.getElementById('tab-content-stats'),
    tabContentHistory: document.getElementById('tab-content-history'),
    seasonStatsBody: document.getElementById('season-stats-body'),
    matchHistoryList: document.getElementById('match-history-list'),

    // Match Archive Details Modal
    matchDetailsModal: document.getElementById('match-details-modal'),
    closeDetailsModal: document.getElementById('close-details-modal'),
    detailOpponent: document.getElementById('detail-opponent'),
    detailMeta: document.getElementById('detail-meta'),
    detailPlaytimesBody: document.getElementById('detail-playtimes-body'),
    detailEventsList: document.getElementById('detail-events-list')
  };

  // 1. Initialize Roster Manager
  const rosterManager = new RosterManager();

  // 1b. Initialize Season Manager
  const seasonManager = new SeasonManager();

  // 2. Initialize Match Timer
  const matchTimer = new MatchTimer(rosterManager, () => {
    // Tick Callback: update timer visual and update current play times
    updateTimerUI();
    pitchRenderer.render();
    renderStatsTable();
  });

  // 3. Initialize Drag & Drop Controller
  const dragDropController = new DragDropController(
    rosterManager, 
    matchTimer,
    () => {
      // On Drop/State Change Callback: refresh layout and table
      pitchRenderer.render();
      renderStatsTable();
    }
  );

  // 4. Initialize Pitch Renderer
  const pitchRenderer = new PitchRenderer(rosterManager, dragDropController, DOM);

  // Bind Formations in Dropdown
  function initFormationsDropdown() {
    DOM.formationSelect.innerHTML = '';
    Object.keys(FORMATIONS).forEach(key => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = FORMATIONS[key].name;
      DOM.formationSelect.appendChild(option);
    });
    // Set default selection
    DOM.formationSelect.value = pitchRenderer.activeFormationId;
  }

  // Sync Timer Controls Visuals
  function updateTimerUI() {
    DOM.periodDisplay.textContent = matchTimer.getPeriodLabel();
    
    if (matchTimer.isMatchFinished) {
      DOM.btnAdvancePeriod.disabled = true;
      DOM.btnAdvancePeriod.innerHTML = '<span>🏁</span> Match Finished';
      DOM.btnAdvancePeriod.classList.remove('btn-primary');
      DOM.btnAdvancePeriod.classList.add('btn-secondary');
    } else {
      DOM.btnAdvancePeriod.disabled = false;
      DOM.btnAdvancePeriod.innerHTML = '<span>➡️</span> End Period & Accrue Time';
      DOM.btnAdvancePeriod.classList.add('btn-primary');
      DOM.btnAdvancePeriod.classList.remove('btn-secondary');
    }

    // Toggle save button container based on playtime accrued
    const hasPlaytime = rosterManager.getPlayers().some(p => p.timePlayed > 0);
    if (hasPlaytime) {
      DOM.saveMatchContainer.style.display = 'block';
    } else {
      DOM.saveMatchContainer.style.display = 'none';
    }
  }

  // Populate Events Log
  function renderEventsLog() {
    DOM.eventsLogList.innerHTML = '';
    if (matchTimer.events.length === 0) {
      DOM.eventsLogList.innerHTML = '<li class="empty-log-message">No game events logged yet.</li>';
      return;
    }
    matchTimer.events.forEach(evt => {
      const li = document.createElement('li');
      li.classList.add('event-log-item');
      li.innerHTML = `
        <span class="event-meta">[${evt.period} - ${evt.timestamp}]</span>
        <span class="event-desc">${evt.description}</span>
      `;
      DOM.eventsLogList.appendChild(li);
    });
  }

  // Populate Play Time and equal play stats table
  function renderStatsTable() {
    DOM.statsTableBody.innerHTML = '';
    const players = [...rosterManager.getPlayers()];
    
    // Sort players by total playing time (ascending, so low minutes appear at the top)
    players.sort((a, b) => (a.timePlayed || 0) - (b.timePlayed || 0));

    // Calculate details for equal play warnings
    // Assume typical target is average play time, or highlight players with < 50% play time
    const completedPeriods = matchTimer.isMatchFinished 
      ? matchTimer.config.totalPeriods 
      : (matchTimer.currentPeriod - 1);
    const totalMatchTime = completedPeriods * matchTimer.config.periodLengthMinutes * 60;
    const benchmark = Math.max(1, totalMatchTime * 0.5); // 50% target warning

    players.forEach(player => {
      const mins = Math.floor((player.timePlayed || 0) / 60);
      const formattedPlayTime = `${mins}m`;

      const tr = document.createElement('tr');
      
      // Determine status highlight
      const isOnField = player.position !== null;
      let statusClass = 'status-bench';
      let statusLabel = 'Bench';
      
      if (isOnField) {
        statusClass = 'status-field';
        const formation = FORMATIONS[pitchRenderer.activeFormationId];
        const posInfo = formation.positions.find(p => p.id === player.position);
        statusLabel = posInfo ? posInfo.label : 'Field';
      }

      // Highlight alert if player has very low play time but game is progressing
      const needsPlayTime = !isOnField && player.timePlayed < benchmark && totalMatchTime > 300; // after 5 mins of play
      if (needsPlayTime) {
        tr.classList.add('alert-low-playtime');
      }

      tr.innerHTML = `
        <td><strong class="jersey-pill">${player.number}</strong></td>
        <td>
          <div class="stats-player-name">
            ${player.name}
            ${needsPlayTime ? '<span class="warning-tag" title="Player needs playing time (under 50%)">⚠ Sub In</span>' : ''}
          </div>
        </td>
        <td><span class="pos-pill">${player.preferredPosition}</span></td>
        <td><span class="player-status-badge ${statusClass}">${statusLabel}</span></td>
        <td><span class="playtime-counter">${formattedPlayTime}</span></td>
        <td class="action-cell">
          <button class="small-edit-btn" data-player-id="${player.id}">Manage</button>
        </td>
      `;

      // Wire manage button
      tr.querySelector('.small-edit-btn').addEventListener('click', () => {
        openEditPlayerModal(player);
      });

      DOM.statsTableBody.appendChild(tr);
    });
  }

  // --- Modal Forms Handlers ---

  function openEditPlayerModal(player) {
    DOM.editPlayerId.value = player.id;
    DOM.editPlayerName.value = player.name;
    DOM.editPlayerNumber.value = player.number;
    DOM.editPlayerPos.value = player.preferredPosition;
    DOM.editPlayerModal.classList.add('modal-active');
  }

  function closeModals() {
    DOM.addPlayerModal.classList.remove('modal-active');
    DOM.editPlayerModal.classList.remove('modal-active');
    DOM.matchSettingsModal.classList.remove('modal-active');
    DOM.saveMatchModal.classList.remove('modal-active');
    DOM.seasonModal.classList.remove('modal-active');
    DOM.matchDetailsModal.classList.remove('modal-active');
    
    // Reset forms
    DOM.formAddPlayer.reset();
    DOM.formSaveMatch.reset();
  }

  // Populate cumulative season statistics tab
  function renderSeasonStats() {
    DOM.seasonStatsBody.innerHTML = '';
    const stats = seasonManager.getSeasonStats(rosterManager.getPlayers());

    if (stats.length === 0) {
      DOM.seasonStatsBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No player records found.</td></tr>';
      return;
    }

    // Sort players numerically by jersey number
    stats.sort((a, b) => parseInt(a.number) - parseInt(b.number));

    stats.forEach(stat => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong class="jersey-pill">${stat.number}</strong></td>
        <td><strong>${stat.name}</strong> ${!stat.isCurrentRoster ? '<span style="font-size: 0.6rem; color: var(--text-muted);">(Former)</span>' : ''}</td>
        <td><span class="pos-pill">${stat.preferredPosition}</span></td>
        <td>${stat.matchesPlayed}</td>
        <td><span class="playtime-counter">${stat.totalMinutes}m</span></td>
        <td>${stat.avgMinutes}m</td>
        <td>
          <span style="font-weight: 700; color: ${stat.equalPlayPercent >= 50 ? 'var(--primary)' : 'var(--yellow)'};">
            ${stat.equalPlayPercent}%
          </span>
        </td>
      `;
      DOM.seasonStatsBody.appendChild(tr);
    });
  }

  // Populate historical matches list tab
  function renderMatchHistory() {
    DOM.matchHistoryList.innerHTML = '';
    const games = seasonManager.getGames();

    if (games.length === 0) {
      DOM.matchHistoryList.innerHTML = '<div class="empty-log-message" style="padding: 30px 0;">No matches archived in history yet. Close a match and save it to build history!</div>';
      return;
    }

    games.forEach(game => {
      const item = document.createElement('div');
      item.classList.add('match-history-item');

      const dateStr = new Date(game.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      const formatStr = `${game.totalPeriods} ${game.periodType === 'quarters' ? 'Quarters' : 'Halves'} • ${game.periodLengthMinutes}m`;

      item.innerHTML = `
        <div class="match-item-info">
          <div class="match-item-title">vs. ${game.opponent}</div>
          <div class="match-item-meta">${dateStr} • ${formatStr}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 15px;">
          <div class="match-item-score">${game.score}</div>
          <div class="match-item-actions">
            <button class="btn btn-secondary small-btn btn-view-details" data-game-id="${game.id}">Details</button>
            <button class="btn btn-danger small-btn btn-delete-match" style="padding: 6px 8px;" data-game-id="${game.id}" title="Delete Match">🗑</button>
          </div>
        </div>
      `;

      // Details listener
      item.querySelector('.btn-view-details').addEventListener('click', () => {
        renderMatchDetails(game);
      });

      // Delete listener
      item.querySelector('.btn-delete-match').addEventListener('click', () => {
        if (confirm(`Delete the match record vs. ${game.opponent} from season history? This cannot be undone.`)) {
          seasonManager.deleteGame(game.id);
          renderMatchHistory();
          renderSeasonStats();
        }
      });

      DOM.matchHistoryList.appendChild(item);
    });
  }

  // Populate match archive details view modal
  function renderMatchDetails(game) {
    DOM.detailOpponent.textContent = `vs. ${game.opponent}`;
    const dateStr = new Date(game.date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    DOM.detailMeta.textContent = `${dateStr} • ${game.totalPeriods} ${game.periodType === 'quarters' ? 'Quarters' : 'Halves'} (${game.periodLengthMinutes} min each)`;

    // Render details playtime table
    DOM.detailPlaytimesBody.innerHTML = '';
    const stats = [...game.playerStats];
    stats.sort((a, b) => parseInt(a.number) - parseInt(b.number));

    stats.forEach(stat => {
      const tr = document.createElement('tr');
      const mins = Math.floor(stat.timePlayed / 60);
      tr.innerHTML = `
        <td><strong class="jersey-pill">${stat.number}</strong></td>
        <td>${stat.name}</td>
        <td><span class="pos-pill">${stat.preferredPosition}</span></td>
        <td><span class="playtime-counter">${mins}m</span></td>
      `;
      DOM.detailPlaytimesBody.appendChild(tr);
    });

    // Render details log
    DOM.detailEventsList.innerHTML = '';
    if (!game.events || game.events.length === 0) {
      DOM.detailEventsList.innerHTML = '<li class="empty-log-message">No logged events for this match.</li>';
    } else {
      game.events.forEach(evt => {
        const li = document.createElement('li');
        li.classList.add('event-log-item');
        li.innerHTML = `
          <span class="event-meta">[${evt.period} - ${evt.timestamp}]</span>
          <span class="event-desc">${evt.description}</span>
        `;
        DOM.detailEventsList.appendChild(li);
      });
    }

    DOM.matchDetailsModal.classList.add('modal-active');
  }

  // --- Event Wireups ---

  // Timer controls
  DOM.btnAdvancePeriod.addEventListener('click', () => {
    if (confirm(`End the current ${matchTimer.config.periodType === 'quarters' ? 'Quarter' : 'Half'}? This will accrue playtime for all active players on the field.`)) {
      matchTimer.advancePeriod();
    }
  });

  DOM.btnResetClock.addEventListener('click', () => {
    if (confirm("Are you sure you want to reset the match period and stats? All substitution records and logged events will be cleared.")) {
      matchTimer.reset();
      rosterManager.resetPlayingTimes();
      pitchRenderer.render();
      renderStatsTable();
    }
  });

  // Strategy selections
  DOM.formationSelect.addEventListener('change', (e) => {
    const formationId = e.target.value;
    const formation = FORMATIONS[formationId];
    if (formation) {
      // Sync roster: bench any players whose positions do not exist in the new formation
      const benched = rosterManager.syncPositionsWithFormation(formation.positions);
      
      const success = pitchRenderer.setFormation(formationId);
      if (success) {
        matchTimer.logEvent(`Tactics changed to: ${formation.name}`);
        benched.forEach(p => {
          matchTimer.logSubstitution(null, p);
        });
        pitchRenderer.render();
        renderStatsTable();
      }
    }
  });

  DOM.btnClearField.addEventListener('click', () => {
    if (confirm("Bench all players on the pitch?")) {
      const activePlayers = rosterManager.getPlayers().filter(p => p.position !== null);
      rosterManager.clearField();
      activePlayers.forEach(p => matchTimer.logSubstitution(null, p));
      pitchRenderer.render();
      renderStatsTable();
    }
  });

  DOM.btnResetStats.addEventListener('click', () => {
    if (confirm("Reset everyone's playing time accumulation to 0 minutes? (Roster and active field positions are preserved.)")) {
      rosterManager.resetPlayingTimes();
      pitchRenderer.render();
      renderStatsTable();
      matchTimer.logEvent("Roster playing times reset to 0m");
    }
  });

  DOM.btnResetAllDefaults.addEventListener('click', () => {
    if (confirm("Reset roster to original 12 default demo players? All current customizations will be lost.")) {
      matchTimer.reset();
      rosterManager.resetRosterToDefault();
      pitchRenderer.render();
      renderStatsTable();
      matchTimer.logEvent("Reset database to default demo roster");
    }
  });

  // Add player form submit
  DOM.btnAddPlayerTrigger.addEventListener('click', () => {
    DOM.addPlayerModal.classList.add('modal-active');
  });

  DOM.closeAddModal.addEventListener('click', closeModals);
  DOM.formAddPlayer.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('add-player-name').value;
    const number = document.getElementById('add-player-number').value;
    const pos = document.getElementById('add-player-pos').value;
    
    const newPlayer = rosterManager.addPlayer(name, number, pos);
    matchTimer.logEvent(`Added player #${newPlayer.number} ${newPlayer.name}`);
    
    closeModals();
    pitchRenderer.render();
    renderStatsTable();
  });

  // Edit player form submit
  DOM.closeEditModal.addEventListener('click', closeModals);
  DOM.formEditPlayer.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = DOM.editPlayerId.value;
    const name = DOM.editPlayerName.value;
    const number = DOM.editPlayerNumber.value;
    const pos = DOM.editPlayerPos.value;

    const oldPlayer = rosterManager.getPlayerById(id);
    const updated = rosterManager.updatePlayer(id, {
      name,
      number,
      preferredPosition: pos
    });

    if (updated) {
      matchTimer.logEvent(`Updated player #${oldPlayer.number} ➔ #${updated.number} ${updated.name}`);
    }

    closeModals();
    pitchRenderer.render();
    renderStatsTable();
  });

  // Delete player button
  DOM.btnDeletePlayer.addEventListener('click', () => {
    const id = DOM.editPlayerId.value;
    const player = rosterManager.getPlayerById(id);
    if (player && confirm(`Remove ${player.name} from roster entirely?`)) {
      // If player was on field, log they went out
      if (player.position !== null) {
        matchTimer.logSubstitution(null, player);
      }
      rosterManager.removePlayer(id);
      matchTimer.logEvent(`Removed player #${player.number} ${player.name}`);
      
      closeModals();
      pitchRenderer.render();
      renderStatsTable();
    }
  });

  // Match settings modal trigger
  DOM.btnMatchSettingsTrigger.addEventListener('click', () => {
    DOM.settingsPeriodType.value = matchTimer.config.periodType;
    DOM.settingsPeriodLen.value = matchTimer.config.periodLengthMinutes;
    DOM.matchSettingsModal.classList.add('modal-active');
  });

  DOM.closeSettingsModal.addEventListener('click', closeModals);
  DOM.formMatchSettings.addEventListener('submit', (e) => {
    e.preventDefault();
    const pType = DOM.settingsPeriodType.value;
    const pLen = parseInt(DOM.settingsPeriodLen.value);
    
    matchTimer.configureMatch(pType, pLen);
    DOM.periodDisplay.textContent = matchTimer.getPeriodLabel();
    
    closeModals();
    updateTimerUI();
    pitchRenderer.render();
    renderStatsTable();
  });

  // Global event integrations (like custom events from badges)
  window.addEventListener('player-edit-requested', (e) => {
    openEditPlayerModal(e.detail.player);
  });

  window.addEventListener('player-benched', (e) => {
    matchTimer.logSubstitution(null, e.detail.player);
    renderStatsTable();
  });

  window.addEventListener('match-event-logged', () => {
    renderEventsLog();
  });

  // Close modals on clicking backdrop
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      closeModals();
    }
  });

  // Backup & Restore handlers
  DOM.btnExportRoster.addEventListener('click', () => {
    const dataStr = rosterManager.exportRoster();
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'soccer_roster_backup.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  });

  DOM.btnImportRoster.addEventListener('click', () => {
    DOM.fileImportInput.click();
  });

  DOM.fileImportInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target.result;
      const success = rosterManager.importRoster(content);
      if (success) {
        alert("Roster imported successfully!");
        pitchRenderer.render();
        renderStatsTable();
        matchTimer.logEvent("Imported roster backup");
      } else {
        alert("Error: Invalid roster backup file.");
      }
    };
    reader.readAsText(file);
    DOM.fileImportInput.value = ''; // Reset input
  });

  // Wire new season and match saving triggers
  DOM.btnSaveMatch.addEventListener('click', () => {
    DOM.saveMatchModal.classList.add('modal-active');
  });

  DOM.closeSaveMatchModal.addEventListener('click', closeModals);
  DOM.formSaveMatch.addEventListener('submit', (e) => {
    e.preventDefault();
    const opponent = document.getElementById('save-opponent-name').value;
    const score = document.getElementById('save-match-score').value;

    const rosterPlayers = rosterManager.getPlayers();
    
    // Save to season
    seasonManager.saveGame(
      opponent,
      score,
      matchTimer.config,
      rosterPlayers,
      matchTimer.events
    );

    // Reset game state
    matchTimer.reset();
    rosterManager.resetPlayingTimes();
    
    closeModals();
    
    // Refresh display
    pitchRenderer.render();
    renderStatsTable();
    updateTimerUI();
    renderEventsLog();

    alert(`Match vs. ${opponent} saved successfully! Current game statistics have been reset.`);
  });

  DOM.btnSeasonTrigger.addEventListener('click', () => {
    renderSeasonStats();
    renderMatchHistory();
    DOM.seasonModal.classList.add('modal-active');
  });

  DOM.closeSeasonModal.addEventListener('click', closeModals);
  DOM.closeDetailsModal.addEventListener('click', () => {
    DOM.matchDetailsModal.classList.remove('modal-active');
  });

  // Handle Season Modal Tabs
  DOM.tabSeasonStats.addEventListener('click', () => {
    DOM.tabSeasonStats.classList.add('active');
    DOM.tabMatchHistory.classList.remove('active');
    DOM.tabContentStats.classList.add('active-content');
    DOM.tabContentHistory.classList.remove('active-content');
  });

  DOM.tabMatchHistory.addEventListener('click', () => {
    DOM.tabMatchHistory.classList.add('active');
    DOM.tabSeasonStats.classList.remove('active');
    DOM.tabContentHistory.classList.add('active-content');
    DOM.tabContentStats.classList.remove('active-content');
  });

  // Initialize display
  initFormationsDropdown();
  updateTimerUI();
  pitchRenderer.render();
  renderStatsTable();
  renderEventsLog();
});
