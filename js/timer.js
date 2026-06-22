// Match Timer and Event Logging module.
// Manages play clock, dynamic time played accumulation, and game events logger.

export class MatchTimer {
  constructor(rosterManager, onTickCallback) {
    this.rosterManager = rosterManager;
    this.onTickCallback = onTickCallback; // Callback for UI updates on each tick
    this.elapsedSeconds = 0;
    this.isRunning = false;
    this.intervalId = null;
    
    // Default match configurations
    this.config = {
      periodType: 'quarters', // 'halves' or 'quarters'
      periodLengthMinutes: 15, // 15 mins for 12U quarters
      totalPeriods: 4
    };
    
    this.currentPeriod = 1;
    this.events = [];
    this.loadTimerState();
  }

  loadTimerState() {
    const saved = localStorage.getItem('soccer_coach_timer_state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        this.elapsedSeconds = state.elapsedSeconds || 0;
        this.currentPeriod = state.currentPeriod || 1;
        this.config = state.config || this.config;
        this.events = state.events || [];
      } catch (e) {
        console.error("Error loading timer state", e);
      }
    }
  }

  saveTimerState() {
    const state = {
      elapsedSeconds: this.elapsedSeconds,
      currentPeriod: this.currentPeriod,
      config: this.config,
      events: this.events
    };
    localStorage.setItem('soccer_coach_timer_state', JSON.stringify(state));
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.intervalId = setInterval(() => this.tick(), 1000);
    this.logEvent("Match resumed");
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.logEvent("Match paused");
    this.saveTimerState();
  }

  reset() {
    this.stop();
    this.elapsedSeconds = 0;
    this.currentPeriod = 1;
    this.events = [];
    this.saveTimerState();
    this.logEvent("Match clock reset");
    if (this.onTickCallback) this.onTickCallback();
  }

  tick() {
    this.elapsedSeconds++;
    
    // Accumulate playing time for all players currently on the pitch
    const players = this.rosterManager.getPlayers();
    players.forEach(p => {
      if (p.position !== null) {
        p.timePlayed = (p.timePlayed || 0) + 1;
      }
    });
    
    // Auto-save roster so minutes are saved in real-time
    this.rosterManager.saveRoster();
    this.saveTimerState();
    
    // Check if period ended
    const limit = this.config.periodLengthMinutes * 60;
    if (this.elapsedSeconds >= limit) {
      this.handlePeriodEnd();
    }
    
    if (this.onTickCallback) {
      this.onTickCallback();
    }
  }

  handlePeriodEnd() {
    this.stop();
    const periodLabel = this.config.periodType === 'quarters' 
      ? `Quarter ${this.currentPeriod}` 
      : `Half ${this.currentPeriod}`;
    
    this.logEvent(`${periodLabel} completed`);
    
    if (this.currentPeriod < this.config.totalPeriods) {
      // Prompt user or simply log next period ready
      this.currentPeriod++;
      this.elapsedSeconds = 0;
      this.logEvent(`Ready for period ${this.currentPeriod}`);
    } else {
      this.logEvent("Match finished!");
    }
    this.saveTimerState();
  }

  logEvent(description) {
    const timestamp = this.getFormattedTime();
    const periodLabel = this.config.periodType === 'quarters' 
      ? `Q${this.currentPeriod}` 
      : `H${this.currentPeriod}`;
    
    const event = {
      id: 'ev_' + Date.now() + '_' + Math.random(),
      timestamp,
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

  getFormattedTime() {
    const mins = Math.floor(this.elapsedSeconds / 60);
    const secs = this.elapsedSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  getPeriodLabel() {
    const label = this.config.periodType === 'quarters' ? 'Quarter' : 'Half';
    return `${label} ${this.currentPeriod}/${this.config.totalPeriods}`;
  }

  configureMatch(periodType, lengthMinutes) {
    this.stop();
    this.config.periodType = periodType;
    this.config.periodLengthMinutes = parseInt(lengthMinutes) || 15;
    this.config.totalPeriods = periodType === 'quarters' ? 4 : 2;
    this.reset();
  }
}
