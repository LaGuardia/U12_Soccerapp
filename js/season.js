// Season statistics and match history manager.
// Manages archiving game stats and calculating aggregated season play times.

const STORAGE_KEY = 'soccer_coach_games';

export class SeasonManager {
  constructor() {
    this.games = [];
    this.loadGames();
  }

  loadGames() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        this.games = JSON.parse(data);
      } catch (e) {
        console.error("Error parsing season games data", e);
        this.games = [];
      }
    } else {
      this.games = [];
    }
  }

  saveGames() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.games));
  }

  getGames() {
    return this.games;
  }

  getGameById(id) {
    return this.games.find(g => g.id === id);
  }

  saveGame(opponent, score, timerConfig, players, events) {
    const id = 'g_' + Date.now();
    const newGame = {
      id,
      date: new Date().toISOString(),
      opponent: opponent.trim() || 'Opponent',
      score: score.trim() || 'N/A',
      periodType: timerConfig.periodType,
      periodLengthMinutes: timerConfig.periodLengthMinutes,
      totalPeriods: timerConfig.totalPeriods,
      playerStats: players.map(p => ({
        id: p.id,
        name: p.name,
        number: p.number,
        preferredPosition: p.preferredPosition,
        timePlayed: p.timePlayed || 0
      })),
      events: JSON.parse(JSON.stringify(events))
    };
    this.games.unshift(newGame); // Newest games first
    this.saveGames();
    return newGame;
  }

  deleteGame(id) {
    this.games = this.games.filter(g => g.id !== id);
    this.saveGames();
  }

  getSeasonStats(rosterPlayers) {
    const statsMap = new Map();

    // Pre-populate with current roster players
    rosterPlayers.forEach(p => {
      statsMap.set(p.id, {
        id: p.id,
        name: p.name,
        number: p.number,
        preferredPosition: p.preferredPosition,
        matchesPlayed: 0,
        totalSeconds: 0,
        isCurrentRoster: true
      });
    });

    // Accumulate from saved games
    let totalAvailableSeconds = 0;
    this.games.forEach(game => {
      const matchSeconds = game.totalPeriods * game.periodLengthMinutes * 60;
      totalAvailableSeconds += matchSeconds;

      game.playerStats.forEach(pStat => {
        if (!statsMap.has(pStat.id)) {
          statsMap.set(pStat.id, {
            id: pStat.id,
            name: pStat.name,
            number: pStat.number,
            preferredPosition: pStat.preferredPosition,
            matchesPlayed: 0,
            totalSeconds: 0,
            isCurrentRoster: false
          });
        }
        const stat = statsMap.get(pStat.id);
        if (pStat.timePlayed > 0) {
          stat.matchesPlayed += 1;
          stat.totalSeconds += pStat.timePlayed;
        }
      });
    });

    // Convert map to array and compute statistics
    const statsList = Array.from(statsMap.values());
    statsList.forEach(stat => {
      stat.totalMinutes = Math.round(stat.totalSeconds / 60);
      stat.avgMinutes = stat.matchesPlayed > 0 ? Math.round((stat.totalSeconds / stat.matchesPlayed) / 60) : 0;
      stat.equalPlayPercent = totalAvailableSeconds > 0 
        ? Math.round((stat.totalSeconds / totalAvailableSeconds) * 100) 
        : 0;
    });

    return statsList;
  }
}
