// Pitch and player badge rendering manager.
// Builds the tactical formation nodes, visual player badges, and bench list.

import { FORMATIONS } from './formations.js';

export class PitchRenderer {
  constructor(rosterManager, dragDropController, elements) {
    this.rosterManager = rosterManager;
    this.dragDropController = dragDropController;
    this.elements = elements; // DOM element references
    
    this.activeFormationId = '3-3-2';
    
    this.initPitchBackground();
  }

  // Draw soccer pitch lines using SVG
  initPitchBackground() {
    const pitchBg = this.elements.pitchBackground;
    if (!pitchBg) return;

    // A beautiful responsive SVG overlay for soccer lines
    pitchBg.innerHTML = `
      <svg viewBox="0 0 100 130" preserveAspectRatio="none" style="width: 100%; height: 100%; display: block;">
        <!-- Grass Pattern / Background -->
        <rect x="0" y="0" width="100" height="130" fill="transparent" />
        
        <!-- Pitch Outer Boundary -->
        <rect x="3" y="3" width="94" height="124" fill="none" stroke="rgba(255, 255, 255, 0.45)" stroke-width="0.8" />
        
        <!-- Midfield Line -->
        <line x1="3" y1="65" x2="97" y2="65" stroke="rgba(255, 255, 255, 0.45)" stroke-width="0.8" />
        
        <!-- Center Circle -->
        <circle cx="50" cy="65" r="12" fill="none" stroke="rgba(255, 255, 255, 0.45)" stroke-width="0.8" />
        <circle cx="50" cy="65" r="1" fill="rgba(255, 255, 255, 0.6)" />
        
        <!-- Penalty Area - TOP (Opposition) -->
        <rect x="25" y="3" width="50" height="20" fill="none" stroke="rgba(255, 255, 255, 0.45)" stroke-width="0.8" />
        <!-- Goal Area - TOP -->
        <rect x="38" y="3" width="24" height="7" fill="none" stroke="rgba(255, 255, 255, 0.45)" stroke-width="0.8" />
        <!-- Penalty Spot - TOP -->
        <circle cx="50" cy="15" r="0.6" fill="rgba(255, 255, 255, 0.6)" />
        <!-- Penalty Arc - TOP -->
        <path d="M 38 23 A 12 12 0 0 0 62 23" fill="none" stroke="rgba(255, 255, 255, 0.45)" stroke-width="0.8" />
        <!-- Goal - TOP -->
        <rect x="42" y="0.5" width="16" height="2.5" fill="none" stroke="rgba(255, 255, 255, 0.3)" stroke-width="0.8" />
        
        <!-- Penalty Area - BOTTOM (Home) -->
        <rect x="25" y="107" width="50" height="20" fill="none" stroke="rgba(255, 255, 255, 0.45)" stroke-width="0.8" />
        <!-- Goal Area - BOTTOM -->
        <rect x="38" y="120" width="24" height="7" fill="none" stroke="rgba(255, 255, 255, 0.45)" stroke-width="0.8" />
        <!-- Penalty Spot - BOTTOM -->
        <circle cx="50" cy="115" r="0.6" fill="rgba(255, 255, 255, 0.6)" />
        <!-- Penalty Arc - BOTTOM -->
        <path d="M 38 107 A 12 12 0 0 1 62 107" fill="none" stroke="rgba(255, 255, 255, 0.45)" stroke-width="0.8" />
        <!-- Goal - BOTTOM -->
        <rect x="42" y="127" width="16" height="2.5" fill="none" stroke="rgba(255, 255, 255, 0.3)" stroke-width="0.8" />
        
        <!-- Corner Arcs -->
        <!-- Top Left -->
        <path d="M 6 3 A 3 3 0 0 1 3 6" fill="none" stroke="rgba(255, 255, 255, 0.4)" stroke-width="0.6" />
        <!-- Top Right -->
        <path d="M 94 3 A 3 3 0 0 0 97 6" fill="none" stroke="rgba(255, 255, 255, 0.4)" stroke-width="0.6" />
        <!-- Bottom Left -->
        <path d="M 3 124 A 3 3 0 0 1 6 127" fill="none" stroke="rgba(255, 255, 255, 0.4)" stroke-width="0.6" />
        <!-- Bottom Right -->
        <path d="M 97 124 A 3 3 0 0 0 94 127" fill="none" stroke="rgba(255, 255, 255, 0.4)" stroke-width="0.6" />
      </svg>
    `;
  }

  setFormation(formationId) {
    if (FORMATIONS[formationId]) {
      this.activeFormationId = formationId;
      this.render();
      return true;
    }
    return false;
  }

  render() {
    this.renderPitchPositions();
    this.renderBench();
  }

  renderPitchPositions() {
    const container = this.elements.pitchPositionsContainer;
    if (!container) return;

    container.innerHTML = '';
    const formation = FORMATIONS[this.activeFormationId];
    if (!formation) return;

    formation.positions.forEach(pos => {
      // Create slot container
      const slot = document.createElement('div');
      slot.classList.add('pitch-position-slot', 'drop-zone');
      slot.setAttribute('data-position-id', pos.id);
      
      // Position on the pitch based on percentage
      slot.style.left = `${pos.x}%`;
      slot.style.top = `${pos.y}%`;
      slot.style.transform = 'translate(-50%, -50%)';

      const player = this.rosterManager.getPlayerAtPosition(pos.id);

      if (player) {
        // Player is active in this position
        slot.classList.add('occupied');
        const badge = this.createPlayerBadge(player, true);
        slot.appendChild(badge);
        this.dragDropController.attachDraggable(badge);
      } else {
        // Empty position placeholder
        slot.innerHTML = `
          <div class="position-placeholder">
            <span class="placeholder-label">${pos.label}</span>
          </div>
        `;
      }

      container.appendChild(slot);
    });
  }

  renderBench() {
    const benchContainer = this.elements.benchContainer;
    if (!benchContainer) return;

    benchContainer.innerHTML = '';
    const players = this.rosterManager.getPlayers();
    
    // Bench players are those with position === null
    const benchPlayers = players.filter(p => p.position === null);

    if (benchPlayers.length === 0) {
      benchContainer.innerHTML = `
        <div class="empty-bench-message">
          No players on bench. Drag players here to bench them, or add new players.
        </div>
      `;
      return;
    }

    // Sort by playing time (ascending, so coach sees who needs play time most)
    benchPlayers.sort((a, b) => (a.timePlayed || 0) - (b.timePlayed || 0));

    benchPlayers.forEach(player => {
      const badge = this.createPlayerBadge(player, false);
      benchContainer.appendChild(badge);
      this.dragDropController.attachDraggable(badge);
    });
  }

  // Create a reusable visual player badge/card
  createPlayerBadge(player, isOnField) {
    const badge = document.createElement('div');
    badge.classList.add('player-badge');
    badge.setAttribute('data-player-id', player.id);
    if (isOnField) {
      badge.classList.add('field-badge');
    } else {
      badge.classList.add('bench-badge');
    }

    // GK styling
    const isGK = isOnField && player.position === 'gk';
    if (isGK) {
      badge.classList.add('gk-badge');
    }

    const minsPlayed = Math.floor((player.timePlayed || 0) / 60);

    // Initial letters
    const initials = player.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    // Layout of the badge
    badge.innerHTML = `
      <div class="badge-inner">
        <!-- Jersey circle -->
        <div class="jersey-circle">
          <span class="jersey-number">${player.number}</span>
        </div>
        
        <!-- Player Info -->
        <div class="player-info">
          <span class="player-name-text">${player.name}</span>
          <span class="player-sub-info">
            <span class="preferred-pos">${player.preferredPosition}</span>
            <span class="play-time-tag">${minsPlayed}'</span>
          </span>
        </div>
        
        <!-- Quick action - bench / edit buttons -->
        ${isOnField ? `
          <button class="badge-action-btn bench-btn" title="Bench Player" data-action="bench">
            ✕
          </button>
        ` : `
          <button class="badge-action-btn edit-btn" title="Edit Player" data-action="edit">
            ✎
          </button>
        `}
      </div>
    `;

    // Hook up quick action buttons
    const benchBtn = badge.querySelector('.bench-btn');
    if (benchBtn) {
      // Prevent drag trigger on click
      benchBtn.addEventListener('pointerdown', e => e.stopPropagation());
      benchBtn.addEventListener('click', e => {
        e.stopPropagation();
        this.rosterManager.unassignPlayer(player.id);
        window.dispatchEvent(new CustomEvent('player-benched', { detail: { player } }));
        this.render();
      });
    }

    const editBtn = badge.querySelector('.edit-btn');
    if (editBtn) {
      editBtn.addEventListener('pointerdown', e => e.stopPropagation());
      editBtn.addEventListener('click', e => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('player-edit-requested', { detail: { player } }));
      });
    }

    return badge;
  }
}
