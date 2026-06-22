// Formations configuration for 9v9 soccer.
// Coordinates are in percentages (x: 0-100 from left to right, y: 0-100 from top to bottom)
// mapping positions to the field area.

export const FORMATIONS = {
  '3-3-2': {
    name: '3-3-2 (Standard Balanced)',
    positions: [
      { id: 'gk', label: 'GK', name: 'Goalkeeper', x: 50, y: 88 },
      { id: 'lcb', label: 'LCB', name: 'Left Center Back', x: 25, y: 68 },
      { id: 'cb', label: 'CB', name: 'Center Back', x: 50, y: 72 },
      { id: 'rcb', label: 'RCB', name: 'Right Center Back', x: 75, y: 68 },
      { id: 'lm', label: 'LM', name: 'Left Midfielder', x: 20, y: 45 },
      { id: 'cm', label: 'CM', name: 'Center Midfielder', x: 50, y: 47 },
      { id: 'rm', label: 'RM', name: 'Right Midfielder', x: 80, y: 45 },
      { id: 'lst', label: 'LST', name: 'Left Striker', x: 33, y: 22 },
      { id: 'rst', label: 'RST', name: 'Right Striker', x: 67, y: 22 }
    ]
  },
  '3-2-3': {
    name: '3-2-3 (Attacking Wings)',
    positions: [
      { id: 'gk', label: 'GK', name: 'Goalkeeper', x: 50, y: 88 },
      { id: 'lcb', label: 'LCB', name: 'Left Center Back', x: 25, y: 68 },
      { id: 'cb', label: 'CB', name: 'Center Back', x: 50, y: 72 },
      { id: 'rcb', label: 'RCB', name: 'Right Center Back', x: 75, y: 68 },
      { id: 'lcm', label: 'LCM', name: 'Left Center Midfielder', x: 33, y: 47 },
      { id: 'rcm', label: 'RCM', name: 'Right Center Midfielder', x: 67, y: 47 },
      { id: 'lw', label: 'LW', name: 'Left Winger', x: 18, y: 24 },
      { id: 'st', label: 'ST', name: 'Striker', x: 50, y: 18 },
      { id: 'rw', label: 'RW', name: 'Right Winger', x: 82, y: 24 }
    ]
  },
  '4-3-1': {
    name: '4-3-1 (Defensive & Solid)',
    positions: [
      { id: 'gk', label: 'GK', name: 'Goalkeeper', x: 50, y: 88 },
      { id: 'lb', label: 'LB', name: 'Left Back', x: 18, y: 68 },
      { id: 'lcb', label: 'LCB', name: 'Left Center Back', x: 38, y: 72 },
      { id: 'rcb', label: 'RCB', name: 'Right Center Back', x: 62, y: 72 },
      { id: 'rb', label: 'RB', name: 'Right Back', x: 82, y: 68 },
      { id: 'lm', label: 'LM', name: 'Left Midfielder', x: 22, y: 45 },
      { id: 'cm', label: 'CM', name: 'Center Midfielder', x: 50, y: 47 },
      { id: 'rm', label: 'RM', name: 'Right Midfielder', x: 78, y: 45 },
      { id: 'st', label: 'ST', name: 'Striker', x: 50, y: 20 }
    ]
  },
  '2-4-2': {
    name: '2-4-2 (Midfield Domination)',
    positions: [
      { id: 'gk', label: 'GK', name: 'Goalkeeper', x: 50, y: 88 },
      { id: 'lcb', label: 'LCB', name: 'Left Center Back', x: 33, y: 70 },
      { id: 'rcb', label: 'RCB', name: 'Right Center Back', x: 67, y: 70 },
      { id: 'lm', label: 'LM', name: 'Left Midfielder', x: 15, y: 45 },
      { id: 'lcm', label: 'LCM', name: 'Left Center Midfielder', x: 38, y: 47 },
      { id: 'rcm', label: 'RCM', name: 'Right Center Midfielder', x: 62, y: 47 },
      { id: 'rm', label: 'RM', name: 'Right Midfielder', x: 85, y: 45 },
      { id: 'lst', label: 'LST', name: 'Left Striker', x: 33, y: 22 },
      { id: 'rst', label: 'RST', name: 'Right Striker', x: 67, y: 22 }
    ]
  }
};
