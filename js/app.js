// App Coordinator Module.
// Initializes modules, sets up DOM listeners, and manages app-wide visual sync.

import { RosterManager } from './roster.js';
import { MatchTimer } from './timer.js';
import { DragDropController } from './dragdrop.js';
import { PitchRenderer } from './pitch.js';
import { FORMATIONS } from './formations.js';

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
    fileImportInput: document.getElementById('file-import-input')
  };

  // 1. Initialize Roster Manager
  const rosterManager = new RosterManager();

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
    
    // Reset forms
    DOM.formAddPlayer.reset();
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

  // Initialize display
  initFormationsDropdown();
  updateTimerUI();
  pitchRenderer.render();
  renderStatsTable();
  renderEventsLog();
});
