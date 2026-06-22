// Match Period and Event Logging module.
// Manages quarters/halves and static playing time accumulation (per period).

export class MatchTimer {
  constructor(rosterManager, onTickCallback) {
    this.rosterManager = rosterManager;
    this.onTickCallback = onTickCallback; // Callback for UI updates
    
    // Default match configurations
    this.config = {
      periodType: 'quarters', // 'halves' or 'quarters'
      periodLengthMinutes: 15, // 15 mins for 12U quarters
      totalPeriods: 4
    };
    
    this.currentPeriod = 1;
    this.events = [];
    this.isMatchFinished = false;
    this.loadTimerState();
  }

  loadTimerState() {
    const saved = localStorage.getItem('soccer_coach_timer_state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        this.currentPeriod = state.currentPeriod || 1;
        this.config = state.config || this.config;
        this.events = state.events || [];
        this.isMatchFinished = state.isMatchFinished || false;
      } catch (e) {
        console.error("Error loading timer state", e);
      }
    }
  }

  saveTimerState() {
    const state = {
      currentPeriod: this.currentPeriod,
      config: this.config,
      events: this.events,
      isMatchFinished: this.isMatchFinished
    };
    localStorage.setItem('soccer_coach_timer_state', JSON.stringify(state));
  }

  advancePeriod() {
    if (this.isMatchFinished) return;

    const periodLabel = this.getPeriodSingleLabel();
    
    // Accumulate playing time for all players currently on the pitch for the full period length
    const secondsInPeriod = this.config.periodLengthMinutes * 60;
    const players = this.rosterManager.getPlayers();
    players.forEach(p => {
      if (p.position !== null) {
        p.timePlayed = (p.timePlayed || 0) + secondsInPeriod;
      }
    });

    this.rosterManager.saveRoster();
    this.logEvent(`${periodLabel} completed - Play time accrued`);

    if (this.currentPeriod < this.config.totalPeriods) {
      this.currentPeriod++;
      this.logEvent(`Moved to ${this.getPeriodSingleLabel()}`);
    } else {
      this.isMatchFinished = true;
      this.logEvent("Match finished!");
    }
    
    this.saveTimerState();
    
    if (this.onTickCallback) {
      this.onTickCallback();
    }
  }

  reset() {
    this.currentPeriod = 1;
    this.isMatchFinished = false;
    this.events = [];
    this.saveTimerState();
    this.logEvent("Match stats reset");
    if (this.onTickCallback) this.onTickCallback();
  }

  logEvent(description) {
    const periodLabel = this.getPeriodSingleLabel();
    const event = {
      id: 'ev_' + Date.now() + '_' + Math.random(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      period: periodLabel,
      description
    };
    
    this.events.unshift(event); // Newest events first
    this.saveTimerState();
    
    // Dispatch a custom event so other components know an event was logged
    window.dispatchEvent(new CustomEvent('match-event-logged', { detail: event }));
  }

  logSubstitution(playerIn, playerOut) {
    if (!playerIn && !playerOut) return;
    
    let msg = "";
    if (playerIn && playerOut) {
      msg = `SUB: #${playerIn.number} ${playerIn.name} IN ↔ #${playerOut.number} ${playerOut.name} OUT`;
    } else if (playerIn) {
      msg = `IN: #${playerIn.number} ${playerIn.name} enters field`;
    } else if (playerOut) {
      msg = `OUT: #${playerOut.number} ${playerOut.name} exits to bench`;
    }
    
    this.logEvent(msg);
  }

  getPeriodSingleLabel() {
    const label = this.config.periodType === 'quarters' ? 'Quarter' : 'Half';
    return `${label} ${this.currentPeriod}`;
  }

  getPeriodLabel() {
    if (this.isMatchFinished) {
      return "Match Finished";
    }
    const label = this.config.periodType === 'quarters' ? 'Quarter' : 'Half';
    return `${label} ${this.currentPeriod}/${this.config.totalPeriods}`;
  }

  configureMatch(periodType, lengthMinutes) {
    this.config.periodType = periodType;
    this.config.periodLengthMinutes = parseInt(lengthMinutes) || 15;
    this.config.totalPeriods = periodType === 'quarters' ? 4 : 2;
    this.reset();
  }
}
