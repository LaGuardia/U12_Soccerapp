// Custom Pointer-Event Drag & Drop Controller.
// Provides smooth, touch-friendly dragging for mobile devices, tablets, and desktops.

export class DragDropController {
  constructor(rosterManager, matchTimer, onStateChanged) {
    this.rosterManager = rosterManager;
    this.matchTimer = matchTimer;
    this.onStateChanged = onStateChanged; // Callback to re-render the view
    
    // Drag state
    this.activeDrag = null;
    
    // Bind handlers
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
  }

  // Attach event listeners to a player card or badge
  attachDraggable(element) {
    element.style.touchAction = 'none'; // Prevent browser scrolling while dragging
    element.addEventListener('pointerdown', this.handlePointerDown);
  }

  handlePointerDown(e) {
    const target = e.currentTarget;
    const playerId = target.getAttribute('data-player-id');
    if (!playerId) return;

    // Initialize dragging state
    const rect = target.getBoundingClientRect();
    
    // Create a floating clone
    const clone = target.cloneNode(true);
    clone.classList.add('dragging-clone');
    
    // Apply styling so it floats under the cursor
    Object.assign(clone.style, {
      position: 'fixed',
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      pointerEvents: 'none', // Critical: allows elementFromPoint to see through it
      zIndex: '9999',
      opacity: '0.9',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
      transform: 'scale(1.05)',
      transition: 'none'
    });

    document.body.appendChild(clone);
    
    // Hide original token or lower opacity
    target.classList.add('original-dragging');
    
    // Record starting positions
    this.activeDrag = {
      playerId,
      originalElement: target,
      clone,
      pointerId: e.pointerId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false
    };

    target.setPointerCapture(e.pointerId);
    target.addEventListener('pointermove', this.handlePointerMove);
    target.addEventListener('pointerup', this.handlePointerUp);
    target.addEventListener('pointercancel', this.handlePointerUp);
    
    // Add visual highlights to valid drop zones
    document.querySelectorAll('.drop-zone').forEach(zone => {
      zone.classList.add('drop-zone-active');
    });
  }

  handlePointerMove(e) {
    if (!this.activeDrag || this.activeDrag.pointerId !== e.pointerId) return;

    const drag = this.activeDrag;
    drag.hasMoved = true;

    // Update clone position
    const x = e.clientX - drag.offsetX;
    const y = e.clientY - drag.offsetY;
    drag.clone.style.left = `${x}px`;
    drag.clone.style.top = `${y}px`;

    // Highlight hovered drop zone
    const hoveredElement = document.elementFromPoint(e.clientX, e.clientY);
    const dropZone = hoveredElement ? hoveredElement.closest('.drop-zone') : null;

    // Reset all highlights first
    document.querySelectorAll('.drop-zone').forEach(zone => {
      zone.classList.remove('drop-zone-hover');
    });

    if (dropZone) {
      dropZone.classList.add('drop-zone-hover');
    }
  }

  handlePointerUp(e) {
    if (!this.activeDrag || this.activeDrag.pointerId !== e.pointerId) return;

    const drag = this.activeDrag;
    
    // Clean up event listeners
    drag.originalElement.releasePointerCapture(e.pointerId);
    drag.originalElement.removeEventListener('pointermove', this.handlePointerMove);
    drag.originalElement.removeEventListener('pointerup', this.handlePointerUp);
    drag.originalElement.removeEventListener('pointercancel', this.handlePointerUp);

    // Remove clone and restore original
    if (drag.clone && drag.clone.parentNode) {
      drag.clone.parentNode.removeChild(drag.clone);
    }
    drag.originalElement.classList.remove('original-dragging');

    // Clean up highlights
    document.querySelectorAll('.drop-zone').forEach(zone => {
      zone.classList.remove('drop-zone-active', 'drop-zone-hover');
    });

    // Check where it was dropped
    const hoveredElement = document.elementFromPoint(e.clientX, e.clientY);
    const dropZone = hoveredElement ? hoveredElement.closest('.drop-zone') : null;
    
    if (dropZone && drag.hasMoved) {
      const positionId = dropZone.getAttribute('data-position-id'); // e.g. "gk", "cb" or "bench"
      const targetPlayer = this.rosterManager.getPlayerById(drag.playerId);
      
      if (targetPlayer) {
        const prevPosition = targetPlayer.position;
        
        if (positionId === 'bench') {
          // Move to bench
          if (prevPosition !== null) {
            this.rosterManager.unassignPlayer(drag.playerId);
            this.matchTimer.logSubstitution(null, targetPlayer);
          }
        } else if (positionId && positionId !== prevPosition) {
          // Assign to pitch position
          const result = this.rosterManager.assignPlayerToPosition(drag.playerId, positionId);
          
          if (result.success) {
            // Substitution logging logic
            const swappedPlayer = result.swapped;
            if (swappedPlayer) {
              // If we swapped with another player, log the exchange
              this.matchTimer.logSubstitution(targetPlayer, swappedPlayer);
            } else {
              // Just moving from bench to field
              if (prevPosition === null) {
                this.matchTimer.logSubstitution(targetPlayer, null);
              }
              // If moving positions on field, don't necessarily log as sub, or could log as tactical move
            }
          }
        }
      }
    }

    this.activeDrag = null;
    
    // Trigger view updates
    if (this.onStateChanged) {
      this.onStateChanged();
    }
  }
}
