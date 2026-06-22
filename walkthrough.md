# Walkthrough — Soccer Game Day Manager

A modern, premium, touch-friendly web application for 12U soccer coaches to manage rosters, formations, and equal playing time on game day.

---

## 📸 Visual Progress

### Full App — Desktop Layout
![Full app desktop view](docs/screenshot_main_view.png)

*Three-column layout: left sidebar (period tracker + event log), center pitch, right sidebar (bench + roster table)*

---

### Tactical Pitch Close-up
![Tactical pitch with player badges](docs/screenshot_pitch_closeup.png)

*SVG-rendered emerald pitch with white field markings and player badges — gold for GK, blue for outfield*

---

### Match Period Tracker Panel
![Match period tracker](docs/screenshot_period_tracker.png)

*Period tracker showing Quarter 2/4 with "End Period & Accrue Time" button and formation selector*

---

### Equal Playing Time Table
![Roster and play time stats table](docs/screenshot_stats_table.png)

*Roster table sorted by least play time; amber ⚠ Sub In badge for players below the 50% threshold*

---

## ✅ What Was Built

### 1. Tactical Pitch Visualizer
A fully SVG-rendered soccer field with accurate pitch markings:
- Boundary lines, midfield line, center circle and spot
- Top and bottom penalty areas, goal areas, penalty spots, and penalty arcs
- Correctly curved corner arcs at all four corners (bug fixed — bottom corners were originally inverted)
- Goalkeeper position styled in gold, outfield players in blue
- Player badges show jersey number, name, preferred position, and minutes accrued

### 2. Touch-Friendly Drag & Drop
Built using the Pointer Events API (not HTML5 drag-and-drop):
- Works on desktop mouse, iPad touch, and Android touch
- Drag players from the bench to any field position slot
- Dropping onto an occupied slot **swaps** the two players
- Drag a player back to the bench area to bench them
- Position slots pulse/highlight while a drag is active to guide the coach

### 3. Roster Management
- Pre-loaded 12-player demo roster (9 starters + 3 on bench)
- Add players via the ➕ Add button — enter name, jersey number, and preferred zone (GK/DF/MF/FW)
- Edit any player's details or remove them from the roster via the **Manage** button in the stats table
- All data stored in `localStorage` — persists between page reloads without a server
- Export roster to a `.json` file for backup; restore from file on a new device

### 4. Match Period Tracker *(replaces game clock)*
Instead of a live ticking game clock, the app tracks periods:
- Displays the current period prominently: **Quarter 1/4**, **Quarter 2/4**, etc.
- Supports **4 Quarters** (default, 15 min each — standard 12U) or **2 Halves**
- At the end of each period, the coach clicks **"End Period & Accrue Time"** — the full period's minutes are instantly credited to all players currently on the field
- After the final period, the button shows 🏁 **Match Finished** and disables
- Period format and length are configurable via **Period Config** in Admin Settings

### 5. Equal Playing Time Monitor
The stats table always shows:
- Every player sorted by **least time played** at the top
- Their current status: field position label (CM, LW, GK, etc.) or "Bench"
- Total minutes accrued this match
- A ⚠ **Sub In** amber warning badge for bench players who have played under 50% of completed periods — appears only after the first period ends

### 6. Tactical Formation Switcher
Four 9v9 formations pre-defined with percentage-based pitch coordinates:
- **3-3-2** — Standard Balanced
- **3-2-3** — Attacking Wings
- **4-3-1** — Defensive & Solid
- **2-4-2** — Midfield Domination

Switching formations automatically benches any player whose assigned position no longer exists in the new scheme, logs the OUT event, and re-renders the field.

### 7. Match Event Log
A live, timestamped log in the left sidebar records:
- Every substitution with player names and jersey numbers
- Formation changes
- Period completions and transitions
- Roster additions, edits, and removals
- Entries tagged with the current period (Q1, Q2, H1, etc.) and wall-clock time

---

## 🐛 Bugs Fixed

| Issue | Resolution |
|-------|-----------|
| Bottom corner arcs on the pitch SVG were curving outward (inverted) | Corrected the SVG `sweep-flag` on the bottom-left and bottom-right corner arc paths |
| `-webkit-background-clip: text` on the app title had no standard property fallback | Added `background-clip: text` for CSS spec compliance and cross-browser compatibility |
| Switching tactical formations left players assigned to positions that no longer exist | Added `syncPositionsWithFormation()` — any orphaned player is automatically benched and logged |

---

## 🗂 File Layout

```
U12_Soccerapp/
├── index.html          # Structural HTML, sidebar layout, field area, modal dialogs
├── README.md           # Project documentation
├── docs/               # Screenshots and documentation images
├── css/
│   └── style.css       # Design system: dark theme, glassmorphism, pitch overlay, animations, responsive layout
└── js/
    ├── app.js          # DOM wiring, event handlers, UI sync — the central coordinator
    ├── formations.js   # 9v9 position definitions with % pitch coordinates per formation
    ├── roster.js       # RosterManager: player CRUD, localStorage, position syncing
    ├── timer.js        # MatchTimer (period manager): period tracking, playtime accrual, event logging
    ├── dragdrop.js     # DragDropController: Pointer Event drag-and-drop, swap logic, logging
    └── pitch.js        # PitchRenderer: SVG field, position slots, player badge creation
```

---

## 🎨 Design System

| Element | Style |
|---------|-------|
| Background | Deep slate `#0b0f17` with subtle radial gradients |
| Pitch | Emerald green radial gradient with white SVG markings |
| Sidebar panels | Glassmorphic (`backdrop-filter: blur`) with dark translucent backgrounds |
| GK badge | Gold gradient jersey circle |
| Outfield badge | Royal blue gradient jersey circle |
| Typography | **Outfit** (headings) + **Inter** (body) via Google Fonts |
| Animations | Badge spawn scale-in, drop zone pulse, drag clone shadow |
| Layout | CSS Grid — 3-col desktop, 2-col tablet, 1-col mobile |
