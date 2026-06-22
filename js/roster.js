// Roster management module.
// Manages player records, status, playing time, and localStorage persistence.

const STORAGE_KEY = 'soccer_coach_roster';

const DEFAULT_PLAYERS = [
  { id: 'p1', name: 'Ethan Miller', number: '1', preferredPosition: 'GK', position: 'gk', timePlayed: 0 },
  { id: 'p2', name: 'Caleb Davis', number: '4', preferredPosition: 'DF', position: 'lcb', timePlayed: 0 },
  { id: 'p3', name: 'Mason Rodriguez', number: '7', preferredPosition: 'MF', position: 'cm', timePlayed: 0 },
  { id: 'p4', name: 'Liam Johnson', number: '9', preferredPosition: 'FW', position: 'lst', timePlayed: 0 },
  { id: 'p5', name: 'Lucas Smith', number: '10', preferredPosition: 'FW', position: 'rst', timePlayed: 0 },
  { id: 'p6', name: 'Aiden Jones', number: '11', preferredPosition: 'MF', position: 'lm', timePlayed: 0 },
  { id: 'p7', name: 'Oliver Wilson', number: '13', preferredPosition: 'DF', position: 'cb', timePlayed: 0 },
  { id: 'p8', name: 'Noah Brown', number: '14', preferredPosition: 'DF', position: 'rcb', timePlayed: 0 },
  { id: 'p9', name: 'James Taylor', number: '17', preferredPosition: 'MF', position: 'rm', timePlayed: 0 },
  { id: 'p10', name: 'Benjamin Thomas', number: '18', preferredPosition: 'DF', position: null, timePlayed: 0 },
  { id: 'p11', name: 'Henry Garcia', number: '21', preferredPosition: 'MF', position: null, timePlayed: 0 },
  { id: 'p12', name: 'Samuel Martinez', number: '23', preferredPosition: 'FW', position: null, timePlayed: 0 }
];

export class RosterManager {
  constructor() {
    this.players = [];
    this.loadRoster();
  }

  loadRoster() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        this.players = JSON.parse(data);
      } catch (e) {
        console.error("Error parsing roster data, loading defaults", e);
        this.players = JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
        this.saveRoster();
      }
    } else {
      // Pre-populate with beautiful default roster so the app is instantly ready
      this.players = JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
      this.saveRoster();
    }
  }

  saveRoster() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.players));
  }

  getPlayers() {
    return this.players;
  }

  getPlayerById(id) {
    return this.players.find(p => p.id === id);
  }

  getPlayerAtPosition(positionId) {
    return this.players.find(p => p.position === positionId);
  }

  addPlayer(name, number, preferredPosition = 'MF') {
    const id = 'p_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const newPlayer = {
      id,
      name: name.trim() || 'New Player',
      number: number.trim() || '99',
      preferredPosition,
      position: null, // Starts on bench
      timePlayed: 0
    };
    this.players.push(newPlayer);
    this.saveRoster();
    return newPlayer;
  }

  updatePlayer(id, updatedFields) {
    const player = this.getPlayerById(id);
    if (player) {
      Object.assign(player, updatedFields);
      this.saveRoster();
      return player;
    }
    return null;
  }

  removePlayer(id) {
    this.players = this.players.filter(p => p.id !== id);
    this.saveRoster();
  }

  assignPlayerToPosition(playerId, positionId) {
    // If positionId is null, player goes to bench
    if (positionId === null) {
      const player = this.getPlayerById(playerId);
      if (player) {
        player.position = null;
        this.saveRoster();
      }
      return { success: true };
    }

    // Find if another player is already in this position
    const existingPlayer = this.getPlayerAtPosition(positionId);
    const targetPlayer = this.getPlayerById(playerId);

    if (!targetPlayer) return { success: false, error: 'Player not found' };

    const oldPosition = targetPlayer.position;

    if (existingPlayer) {
      // Swap their positions! If targetPlayer was on the bench, existingPlayer goes to the bench.
      // If targetPlayer was at oldPosition, existingPlayer goes to oldPosition.
      existingPlayer.position = oldPosition;
    }

    targetPlayer.position = positionId;
    this.saveRoster();
    return { success: true, swapped: existingPlayer };
  }

  unassignPlayer(playerId) {
    return this.assignPlayerToPosition(playerId, null);
  }

  syncPositionsWithFormation(positions) {
    const validIds = new Set(positions.map(p => p.id));
    const benchedPlayers = [];
    this.players.forEach(player => {
      if (player.position !== null && !validIds.has(player.position)) {
        benchedPlayers.push(player);
        player.position = null;
      }
    });
    if (benchedPlayers.length > 0) {
      this.saveRoster();
    }
    return benchedPlayers;
  }

  clearField() {
    this.players.forEach(p => p.position = null);
    this.saveRoster();
  }

  resetPlayingTimes() {
    this.players.forEach(p => p.timePlayed = 0);
    this.saveRoster();
  }

  resetRosterToDefault() {
    this.players = JSON.parse(JSON.stringify(DEFAULT_PLAYERS));
    this.saveRoster();
  }

  importRoster(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data)) {
        // Validate each item roughly
        const validData = data.map((p, idx) => ({
          id: p.id || 'p_' + Date.now() + '_' + idx,
          name: p.name || 'Imported Player',
          number: String(p.number || '99'),
          preferredPosition: p.preferredPosition || 'MF',
          position: p.position || null,
          timePlayed: Number(p.timePlayed) || 0
        }));
        this.players = validData;
        this.saveRoster();
        return true;
      }
    } catch (e) {
      console.error("Failed to import roster", e);
    }
    return false;
  }

  exportRoster() {
    return JSON.stringify(this.players, null, 2);
  }
}
