# Hytopia "6-7 Meme Battleground" — ADAPTED GDD FOR HYTOPIA SDK

**Owner:** Chris Campbell
**Platform:** Hytopia (Browser-based, Server-Authoritative)
**Tech:** Hytopia SDK (TypeScript), HTML/CSS UI, Hytopia Marketplace
**Version:** v2.0 (Hytopia SDK Native Build)

---

## 🎯 Executive Summary

A viral, round-based **meme party royale** where 8-16 players react to the "6-7" TikTok audio through fast micro-games. Built 100% on Hytopia's server-authoritative architecture with instant browser access and blockchain-backed cosmetic marketplace.

**Why This Works on Hytopia:**
- ✅ Zero download friction = viral TikTok audience can play instantly
- ✅ Server-authoritative = cheat-proof competitive integrity
- ✅ Marketplace launching Nov 2025 = perfect monetization timing
- ✅ 85% creator revenue = sustainable indie game business
- ✅ TypeScript SDK = rapid iteration with modern tooling

---

## 1) Core Concept (Adapted for Hytopia)

**ONE-LINE PITCH:**
A chaotic 3-minute meme arena where players jump between platforms "6" and "7" on beat, survive eliminations, and flex cosmetics from Hytopia's marketplace.

**TARGET SESSION:**
- 3-5 minutes per match (mobile-friendly)
- 8-16 players per lobby (Hytopia auto-scales)
- 5-7 rounds of micro-games
- Instant browser access (no download)

**VIRAL HOOKS:**
- TikTok trending audio ("6-7")
- Spectator camera on winner (clip-ready moments)
- Cosmetic flexing (marketplace items)
- Leaderboard competitions

---

## 2) Technical Architecture (Hytopia SDK)

### 2.1 Server-Authoritative Design ✅

**Perfect Alignment:** Your original GDD's server-authoritative approach maps directly to Hytopia's architecture!

```typescript
// ALL game logic runs server-side in Hytopia
startServer(world => {
  const gameManager = GameManager.instance;
  gameManager.setupGame(world);
});
```

**What Hytopia Handles Automatically:**
- Player authentication & matchmaking
- Regional server assignment
- Horizontal scaling
- WebSocket connections (no manual networking!)
- Cheat prevention (client can't modify game state)

### 2.2 Adapted Architecture

**ORIGINAL GDD:** Custom ECS (AudioSyncSystem, ScoringSystem, etc.)
**HYTOPIA SDK:** Entity + Controller pattern + GameManager singleton

```typescript
// New architecture based on Hytopia examples
/root
  /classes
    GameManager.ts          // Singleton, handles rounds + scoring
    GamePlayerEntity.ts     // Extends DefaultPlayerEntity
    PlatformEntity.ts       // 6 and 7 platforms (Block or Model entities)
    BeatManager.ts          // Pre-computed beat timing (NO auto-detection)
    ScoreboardUI.ts         // Leaderboard logic
  /assets
    /audio
      six_seven_v1.ogg      // Main track
      beat_timings.json     // Pre-computed beat times!
    /ui
      index.html            // Overlay UI (HUD, timer, etc)
    /models
      platform_6.gltf       // Glowing "6" platform
      platform_7.gltf       // Glowing "7" platform
  index.ts                  // startServer() entry point
```

### 2.3 Audio Sync Strategy (CRITICAL ADAPTATION)

**ORIGINAL GDD:** Real-time beat detection + client offset calibration
**HYTOPIA REALITY:** NO built-in beat detection or frame-perfect sync

**NEW APPROACH:**
1. **Pre-compute beat timings** offline (use Audacity/music software)
2. Store in `beat_timings.json`:
```json
{
  "bpm": 120,
  "beatTimes": [0, 500, 1000, 1500, 2000, 2500, 3000],
  "markers": ["six", "six", "seven", "six", "seven", "six", "seven"]
}
```
3. **Server-side countdown** synced to `Date.now()`
4. **Client plays audio** on countdown (within ~100-200ms tolerance)
5. **Server validates inputs** against pre-computed beat windows

**Code Pattern:**
```typescript
// Server
const beatData = loadJSON('audio/beat_timings.json');
const trackAudio = new Audio({
  uri: 'audio/six_seven_v1.ogg',
  loop: false,
  volume: 0.8
});

const roundStartTime = Date.now() + 3000; // 3s countdown
players.forEach(p => {
  p.ui.sendData({
    type: 'round-start',
    audioUri: 'six_seven_v1.ogg',
    startTime: roundStartTime
  });
});

// At roundStartTime
trackAudio.play(world); // Ambient audio for all players

// Score inputs based on server time
function scoreJump(player, platform, timestamp) {
  const elapsed = timestamp - roundStartTime;
  const nearestBeat = findNearestBeat(elapsed, beatData.beatTimes);
  const delta = Math.abs(elapsed - nearestBeat);

  if (delta <= 150) return 'PERFECT'; // ±150ms window (generous for network)
  if (delta <= 300) return 'GOOD';
  return 'MISS';
}
```

**Tradeoff:** Less frame-perfect than original GDD, but Hytopia's server tick (60 FPS) + typical 50-100ms latency means ±150ms windows are reasonable for casual play.

---

## 3) Core Game Loop (Hytopia Implementation)

### 3.1 Match Lifecycle

```typescript
// GameManager.ts (based on zombies-fps example)
export default class GameManager {
  public static readonly instance = new GameManager();

  private _currentRound = 0;
  private _alivePlayers: Set<string> = new Set();
  private _scores: Map<string, number> = new Map();

  public setupGame(world: World) {
    this.world = world;
    this._spawnPlatforms(); // Platforms 6 and 7
    this._waitForPlayers(); // Min 4 players
  }

  public startMatch() {
    this._currentRound = 1;
    this._alivePlayers = new Set(world.entityManager.getAllPlayerEntities().map(e => e.player.id));
    this._runRound();
  }

  private async _runRound() {
    const microGame = this._selectMicroGame(); // MG-01: Platforms 6/7
    await this._playMicroGame(microGame);
    this._eliminateFailures();

    if (this._alivePlayers.size <= 3) {
      this._endMatch(); // Top 3 win
    } else {
      this._currentRound++;
      setTimeout(() => this._runRound(), 5000); // 5s between rounds
    }
  }

  private async _playMicroGame(mg: MicroGame) {
    const beatData = mg.beatData;
    const roundStartTime = Date.now() + 3000; // 3s countdown

    // Send countdown to all players
    this._broadcastUI({ type: 'countdown', seconds: 3 });

    // Play audio for all
    const audio = new Audio({ uri: mg.audioUri, loop: false, volume: 0.8 });
    setTimeout(() => audio.play(this.world!), 3000);

    // Listen for player inputs
    this._listenForJumps(roundStartTime, beatData);

    // Wait for track to finish
    await new Promise(resolve => setTimeout(resolve, mg.durationMs + 3000));
  }
}
```

### 3.2 Input Handling (Hytopia Pattern)

**ORIGINAL GDD:** Custom input validation
**HYTOPIA SDK:** Use `player.input` streamed every tick

```typescript
// GamePlayerEntity.ts
export default class GamePlayerEntity extends DefaultPlayerEntity {
  private _lastJumpTime = 0;

  public onTick() {
    const input = this.player.input;

    // Left platform (6)
    if (input['6'] && !this._wasPressed('6')) {
      GameManager.instance.handleJump(this.player, 'PLATFORM_6');
    }

    // Right platform (7)
    if (input['7'] && !this._wasPressed('7')) {
      GameManager.instance.handleJump(this.player, 'PLATFORM_7');
    }
  }
}
```

**Input Mapping:**
- `6` key = jump to platform 6
- `7` key = jump to platform 7
- **Mobile:** Custom UI buttons (see §5.4)

---

## 4) Micro-Games (Launch Set)

### MG-01: Platforms 6 vs 7 ✅ (MVP)

**Description:** Two platforms. Audio plays "6... 7... 6... 7...". Jump to correct platform on beat.

**Implementation:**
```typescript
// PlatformEntity.ts (Block Entity approach)
export class PlatformEntity extends Entity {
  constructor(number: 6 | 7) {
    super({
      name: `Platform ${number}`,
      blockTextureUri: `blocks/platform_${number}.png`, // Glowing texture
      blockHalfExtents: { x: 3, y: 0.2, z: 3 }, // 6x6 block platform
      rigidBodyOptions: {
        type: RigidBodyType.STATIC // Platforms don't move
      }
    });

    this.addTag(`platform-${number}`);
  }

  public glow() {
    // Visual feedback when platform is "active" (correct answer)
    // Use model with emissive material or particle effects
  }
}
```

**Scoring:**
```typescript
// Server validates: Did player jump to correct platform within ±150ms of beat?
function validateJump(player: Player, platform: 6 | 7, timestamp: number) {
  const elapsed = timestamp - roundStartTime;
  const nearestBeat = beatTimes.find(bt => Math.abs(elapsed - bt) < 300);

  if (!nearestBeat) return { result: 'MISS', score: 0 };

  const expectedPlatform = markers[beatTimes.indexOf(nearestBeat)]; // 'six' or 'seven'
  const delta = Math.abs(elapsed - nearestBeat);

  if (platform !== (expectedPlatform === 'six' ? 6 : 7)) {
    return { result: 'WRONG_PLATFORM', score: 0, eliminate: true };
  }

  if (delta <= 150) return { result: 'PERFECT', score: 100 };
  if (delta <= 300) return { result: 'GOOD', score: 50 };
  return { result: 'LATE', score: 10 };
}
```

### MG-02: Emote on Beat (Post-MVP)

**Adaptation:** Use Hytopia animations system

```typescript
// Trigger emote animation on spacebar
playerEntity.on(PlayerEvent.INPUT, ({ input }) => {
  if (input.sp) { // Spacebar
    playerEntity.startModelOneshotAnimations(['emote_67_hand']);
    GameManager.instance.scoreEmote(player, Date.now());
  }
});
```

### MG-03: Freeze on Seven (Simpler Alternative)

**Description:** Players move freely while music plays. When "seven" drops, everyone must stop moving (WASD inputs = elimination).

**Why This Works:** Easier to implement than Simon Says, no animation state tracking needed.

### MG-04: Boss Round - 6-7 Demon (Finale)

**Description:** Platforms light up in sequence. Stand on correct one or take damage. 3 HP, progressively faster.

```typescript
// Visual telegraphing with Scene UI
const platformUI = new SceneUI({
  template: 'platform-indicator', // HTML template showing "6" or "7"
  attachedToEntity: platform6Entity,
  offset: { x: 0, y: 2, z: 0 }
});
```

---

## 5) User Interface (Hytopia HTML/CSS)

### 5.1 Overlay UI Structure

**File:** `assets/ui/index.html`

```html
<!-- HUD Elements -->
<div class="game-hud">
  <!-- Round Timer -->
  <div class="round-timer">
    <span class="round-number">Round 1</span>
    <span class="timer">0:00</span>
  </div>

  <!-- Leaderboard (top-right) -->
  <div class="leaderboard">
    <div class="leaderboard-title">ALIVE</div>
    <div class="player-list"></div>
  </div>

  <!-- Beat Indicator (center) -->
  <div class="beat-indicator"></div>

  <!-- Score Popup -->
  <div class="score-popup"></div>
</div>

<!-- Countdown Overlay -->
<div class="countdown-overlay">
  <span class="countdown-number">3</span>
</div>

<!-- Scene UI Templates -->
<template id="platform-indicator">
  <div class="platform-label">
    <span class="platform-number"></span>
  </div>
</template>

<script>
  // Register Scene UI for platform indicators
  hytopia.registerSceneUITemplate('platform-indicator', (id, onState) => {
    const template = document.getElementById('platform-indicator');
    const clone = template.content.cloneNode(true);
    const numberEl = clone.querySelector('.platform-number');

    onState(state => {
      numberEl.textContent = state.number; // "6" or "7"
      numberEl.style.color = state.isActive ? '#00ff00' : '#ffffff';
    });

    return clone;
  });

  // Handle game state updates from server
  hytopia.onData(data => {
    if (data.type === 'countdown') {
      showCountdown(data.seconds);
    }

    if (data.type === 'round-start') {
      document.querySelector('.round-number').textContent = `Round ${data.round}`;
    }

    if (data.type === 'score') {
      showScorePopup(data.result, data.score); // "PERFECT +100"
    }

    if (data.type === 'leaderboard') {
      updateLeaderboard(data.players);
    }
  });

  function showScorePopup(result, score) {
    const popup = document.querySelector('.score-popup');
    popup.textContent = `${result} +${score}`;
    popup.classList.add('show');
    setTimeout(() => popup.classList.remove('show'), 2000);
  }
</script>

<style>
  .game-hud {
    font-family: 'Arial', sans-serif;
    color: #ffffff;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  }

  .round-timer {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 24px;
    font-weight: bold;
  }

  .leaderboard {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.7);
    padding: 15px;
    border-radius: 8px;
    min-width: 200px;
  }

  .beat-indicator {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 60px;
    border: 4px solid #ffffff;
    border-radius: 50%;
    animation: pulse 0.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.5; }
    50% { transform: translateX(-50%) scale(1.2); opacity: 1; }
  }

  .score-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 48px;
    font-weight: bold;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .score-popup.show {
    opacity: 1;
    animation: popupFade 2s ease-out;
  }

  @keyframes popupFade {
    0% { transform: translate(-50%, -50%) scale(0.5); }
    20% { transform: translate(-50%, -50%) scale(1.2); }
    80% { opacity: 1; }
    100% { transform: translate(-50%, -80%) scale(1); opacity: 0; }
  }

  .platform-label {
    background: rgba(0, 0, 0, 0.9);
    padding: 20px;
    border-radius: 8px;
    font-size: 72px;
    font-weight: bold;
    text-align: center;
    min-width: 100px;
  }
</style>
```

### 5.2 Server → Client Data Flow

```typescript
// Server sends game state updates
player.ui.sendData({
  type: 'round-start',
  round: 3,
  audioUri: 'audio/six_seven_v1.ogg',
  startTime: Date.now() + 3000
});

player.ui.sendData({
  type: 'score',
  result: 'PERFECT',
  score: 100
});

player.ui.sendData({
  type: 'leaderboard',
  players: [
    { username: 'Player1', score: 450, alive: true },
    { username: 'Player2', score: 300, alive: true },
    { username: 'Player3', score: 200, alive: false }
  ]
});
```

### 5.3 Client → Server Input Flow

```typescript
// Client sends jump input (from key press or button click)
hytopia.sendData({
  type: 'jump',
  platform: 6,
  timestamp: Date.now()
});

// Server receives and validates
player.ui.on(PlayerUIEvent.DATA, ({ data }) => {
  if (data.type === 'jump') {
    GameManager.instance.handleJump(player, data.platform, data.timestamp);
  }
});
```

### 5.4 Mobile Support

**Hytopia Mobile Controls:** Built-in virtual joystick + 4 action buttons

**Custom Touch Buttons for "6" and "7":**

```html
<!-- Mobile-only platform buttons -->
<div class="mobile-controls">
  <button class="platform-btn" data-platform="6">6</button>
  <button class="platform-btn" data-platform="7">7</button>
</div>

<style>
  .mobile-controls {
    display: none; /* Show only on mobile */
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    gap: 40px;
  }

  @media (max-width: 768px) {
    .mobile-controls { display: flex; }
  }

  .platform-btn {
    width: 100px;
    height: 100px;
    font-size: 48px;
    font-weight: bold;
    border: 4px solid #ffffff;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.7);
    color: #ffffff;
    cursor: pointer;
  }

  .platform-btn:active {
    background: rgba(255, 255, 255, 0.3);
  }
</style>

<script>
  document.querySelectorAll('.platform-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const platform = parseInt(e.target.dataset.platform);
      hytopia.sendData({ type: 'jump', platform, timestamp: Date.now() });
    });
  });
</script>
```

---

## 6) Progression & Economy (Hytopia Marketplace)

### 6.1 Monetization Strategy

**CRITICAL UPDATE:** Hytopia Marketplace launches **November 2025**

**Revenue Split:**
- **85% Creator** (you!)
- **0% Hytopia** (promotional period)
- **15% Staking Pool** (Web3 tokenomics)

**Supported Product Types:**
1. **Cosmetics** (Global, cross-game compatible)
2. **Lootboxes** (RNG drops)
3. **Bundles** (curated sets)
4. **Microtransactions** (in-game popup purchases)

### 6.2 Cosmetics for This Game

**Perfect Alignment:** Hytopia's voxel/blocky style fits meme aesthetic!

**Launch Catalog (Marketplace):**

| Item | Type | Price | Rarity |
|------|------|-------|--------|
| 6-7 Hand Motion Emote | Emote | $2.99 | Uncommon |
| Neon 6 Aura | BACK cosmetic | $4.99 | Rare |
| Number 7 Crown | HEAD cosmetic | $3.99 | Uncommon |
| Sigma Strut Emote | Emote | $1.99 | Common |
| Brain-Rot Particle Trail | BACK cosmetic | $5.99 | Epic |
| "Certified 6-7" Title Banner | UI Badge | $0.99 | Common |

**Bundle Example:**
```json
{
  "name": "Ultimate 6-7 Bundle",
  "price": "$14.99",
  "items": [
    "emote_67_hand",
    "back_neon_6_aura",
    "head_number_7_crown",
    "emote_sigma_strut"
  ],
  "discount": "25% savings"
}
```

**Lootbox Example:**
```json
{
  "name": "6-7 Mystery Box",
  "price": "$1.99",
  "contains": [
    { "item": "emote_sigma_strut", "rarity": "Normal", "dropRate": "60%" },
    { "item": "back_neon_6_aura", "rarity": "Rare", "dropRate": "20%" },
    { "item": "head_legendary_demon", "rarity": "Legendary", "dropRate": "3%" }
  ]
}
```

### 6.3 In-Game Microtransactions

**Use Case:** Quick purchases without leaving game

**Examples:**
- "Revive Token" - $0.99 (respawn after elimination)
- "XP Boost 2x" - $1.99 (1 hour)
- "Winner's Spotlight" - $4.99 (custom victory animation)

**Implementation:**
```typescript
// Server triggers purchase popup
player.ui.sendData({
  type: 'microtransaction-offer',
  productId: 'revive_token',
  name: 'Revive Token',
  price: '$0.99',
  description: 'Come back for one more round!'
});

// Player completes purchase (Hytopia handles payment)
// Server receives confirmation event
world.on(PlayerEvent.MICROTRANSACTION_COMPLETE, ({ player, productId }) => {
  if (productId === 'revive_token') {
    GameManager.instance.revivePlayer(player);
  }
});
```

### 6.4 Player Progression (Persisted Data)

**Use Hytopia's Built-in Persistence:**

```typescript
// Data structure
interface PlayerProfile {
  level: number;
  xp: number;
  totalMatches: number;
  wins: number;
  perfectHits: number;
  rizzRank: 'Bronze' | 'Silver' | 'Gold' | 'Certified 6-7' | 'Meme Lord';
  equippedCosmetics: string[]; // Marketplace item IDs
  unlockedTitles: string[];
}

// On player join
world.on(PlayerEvent.JOINED_WORLD, async ({ player }) => {
  const data = await player.getPersistedData() as PlayerProfile;

  if (!data || Object.keys(data).length === 0) {
    // New player - initialize
    await player.setPersistedData({
      level: 1,
      xp: 0,
      totalMatches: 0,
      wins: 0,
      perfectHits: 0,
      rizzRank: 'Bronze',
      equippedCosmetics: [],
      unlockedTitles: []
    });
  }

  // Apply cosmetics from marketplace
  const playerEntity = new GamePlayerEntity(player, {
    cosmeticHiddenSlots: [] // Show all equipped cosmetics
  });

  playerEntity.spawn(world, { x: 0, y: 10, z: 0 });
});

// On match end - grant XP
async function grantMatchXP(player: Player, score: number, won: boolean) {
  const data = await player.getPersistedData() as PlayerProfile;

  data.xp += score;
  data.totalMatches += 1;
  if (won) data.wins += 1;

  // Level up check
  const requiredXP = data.level * 1000;
  if (data.xp >= requiredXP) {
    data.level += 1;
    data.xp -= requiredXP;

    player.ui.sendData({ type: 'level-up', level: data.level });
  }

  await player.setPersistedData(data);
}
```

**XP Sources:**
- Match completion: +100 XP
- Perfect hit: +10 XP
- Good hit: +5 XP
- Round survived: +25 XP
- Match win: +500 XP

**Rank Progression:**
- Bronze: 0-1000 XP
- Silver: 1000-5000 XP
- Gold: 5000-15000 XP
- Certified 6-7: 15000-50000 XP
- Meme Lord: 50000+ XP

---

## 7) Anti-Cheat & Security ✅

**Perfect Alignment:** Hytopia's server-authoritative architecture prevents most cheats!

**What Hytopia Blocks Automatically:**
- ✅ Position spoofing (rigid bodies server-side)
- ✅ Instant kills / damage hacks (all damage server-validated)
- ✅ Speedhacks (velocity enforced server-side)
- ✅ ESP / wallhacks (clients don't receive hidden entity data)

**Additional Validation Needed:**

```typescript
// Rate-limit input spam
class InputRateLimiter {
  private _lastInputTime = 0;
  private _inputCount = 0;

  public canProcessInput(player: Player): boolean {
    const now = Date.now();

    if (now - this._lastInputTime > 1000) {
      this._inputCount = 0; // Reset counter every second
    }

    this._inputCount++;
    this._lastInputTime = now;

    if (this._inputCount > 10) {
      console.warn(`[ANTI-CHEAT] ${player.username} exceeded input rate limit`);
      return false;
    }

    return true;
  }
}

// Validate timing windows
function validateBeatTiming(timestamp: number, beatTime: number): boolean {
  const delta = Math.abs(timestamp - beatTime);

  if (delta > 500) {
    // Impossible timing - likely spoofed timestamp
    return false;
  }

  return true;
}
```

---

## 8) Analytics & KPIs

**Use Hytopia's Built-in Events + Custom Tracking**

```typescript
// Track custom events
class AnalyticsManager {
  public trackEvent(eventName: string, properties: Record<string, any>) {
    // Log to console (Hytopia provides server logs)
    console.log(`[ANALYTICS] ${eventName}`, JSON.stringify(properties));

    // Future: Send to external analytics (Mixpanel, Amplitude)
    // via HTTP request from server
  }
}

// Example events
analytics.trackEvent('match_start', {
  playerCount: 12,
  roundNumber: 1
});

analytics.trackEvent('player_score', {
  username: player.username,
  result: 'PERFECT',
  score: 100,
  beatDelta: 45 // ms
});

analytics.trackEvent('match_end', {
  duration: 180, // seconds
  winner: 'Player1',
  totalPlayers: 12,
  totalRounds: 6
});
```

**Key Metrics to Track:**
- **D1/D7 Retention** (% players returning)
- **Avg Session Length** (target: 15+ minutes)
- **Matches Per Session** (target: 3+)
- **Perfect Hit Rate** (measure difficulty balance)
- **Cosmetic Attach Rate** (% players with ≥1 marketplace item)
- **ARPDAU** (Average Revenue Per Daily Active User)

---

## 9) World Map Design (Hytopia Maps)

### 9.1 Arena Layout

**File:** `assets/map.json` (Hytopia map format)

**Design:**
```
        [Spectator Stands]
              |
    [Platform 6] --- [Center] --- [Platform 7]
              |
         [Spawn Zone]
```

**Block Composition:**
- Platforms: Glowing neon blocks (custom textures)
- Center: Neutral spawn area
- Spectator stands: Elevated bleachers for eliminated players
- Sky: Particle effects (brain-rot theme)

### 9.2 Map Creation

**Tools:**
- MagicaVoxel (free voxel editor)
- Hytopia Map Converter (converts .vox to map.json)

**Alternative:** Use Hytopia's procedural generation

```typescript
// Programmatic map building
function buildArena(world: World) {
  // Platform 6 (left)
  for (let x = -10; x <= -5; x++) {
    for (let z = -3; z <= 3; z++) {
      world.chunkLattice.setBlock(
        { x, y: 0, z },
        PLATFORM_6_BLOCK_ID
      );
    }
  }

  // Platform 7 (right)
  for (let x = 5; x <= 10; x++) {
    for (let z = -3; z <= 3; z++) {
      world.chunkLattice.setBlock(
        { x, y: 0, z },
        PLATFORM_7_BLOCK_ID
      );
    }
  }

  // Center bridge
  for (let x = -4; x <= 4; x++) {
    world.chunkLattice.setBlock(
      { x, y: 0, z: 0 },
      BRIDGE_BLOCK_ID
    );
  }
}
```

---

## 10) Development Roadmap (Hytopia-Optimized)

### Phase 1: MVP (2-3 Weeks)
**Goal:** Playable Platforms 6/7 game with 1 micro-game

✅ **Week 1:**
- [ ] Setup Hytopia project (`hytopia init`)
- [ ] GameManager singleton + round system
- [ ] Platform entities + jump detection
- [ ] Pre-computed beat timing JSON
- [ ] Audio playback sync (server-side)
- [ ] Basic scoring (PERFECT/GOOD/MISS)

✅ **Week 2:**
- [ ] Overlay UI (timer, leaderboard, score popups)
- [ ] Mobile touch controls
- [ ] Player elimination + spectator mode
- [ ] Winner announcement
- [ ] Persisted XP/level system

✅ **Week 3:**
- [ ] Polish animations
- [ ] Balance beat windows (playtesting)
- [ ] Add 2-3 more audio tracks
- [ ] Bug fixes + optimization
- [ ] **Deploy to Hytopia testnet**

### Phase 2: Content Expansion (2 Weeks)
- [ ] MG-02: Emote on Beat
- [ ] MG-03: Freeze on Seven
- [ ] Boss Round (finale)
- [ ] Leaderboard UI improvements
- [ ] Daily challenges

### Phase 3: Marketplace Launch (Nov 2025)
- [ ] Design 10+ cosmetics (3D models)
- [ ] Submit to Hytopia marketplace review
- [ ] Create lootboxes + bundles
- [ ] Setup microtransactions
- [ ] Launch marketing campaign

### Phase 4: Post-Launch (Ongoing)
- [ ] Weekly audio track drops
- [ ] Seasonal events
- [ ] Community sound room voting
- [ ] Influencer collaborations

---

## 11) Asset Requirements

### 11.1 Audio Assets
- **6-7 Track v1** (main): 30-45 seconds, BPM ~120
- **6-7 Track v2** (remix): Faster variant, BPM ~140
- **SFX:**
  - Jump sound (platformer-style)
  - Perfect hit (ding!)
  - Good hit (beep)
  - Miss hit (buzzer)
  - Elimination (whoosh + explosion)
  - Winner fanfare

**Licensing:** Use royalty-free remixes OR partner with TikTok creators (revenue share)

### 11.2 3D Models (GLTF)

**Platforms:**
- `platform_6.gltf` - Glowing "6" block with emissive material
- `platform_7.gltf` - Glowing "7" block with emissive material

**Cosmetics (for Marketplace):**
- `back_neon_6_aura.gltf` - Particle trail attachment
- `head_number_7_crown.gltf` - Wearable crown
- `emote_67_hand.gltf` - Hand gesture animation

**Modeling Guidelines:**
- Max 5,000 triangles per asset (Hytopia performance)
- Voxel/blocky style required for marketplace
- Emissive materials for glowing effects
- Animations at 30 FPS

### 11.3 Textures
- Platform blocks: 128x128 PNG (neon gradients)
- Arena floor: 256x256 PNG (grid pattern)
- Skybox: 1024x1024 cubemap (meme-themed)

---

## 12) Technical Challenges & Solutions

### Challenge 1: Audio Sync Across Network Latency
**Problem:** Players have 50-200ms latency variance
**Solution:**
- Generous ±150ms scoring windows
- Server-side validation (no client trust)
- Visual beat indicators (pulsing UI elements)
- "GOOD" tier for 150-300ms (still rewarding)

### Challenge 2: No Built-in Beat Detection
**Problem:** Hytopia Audio class doesn't detect beats
**Solution:**
- Pre-compute beat timings offline (Audacity, music software)
- Store in JSON: `{ beatTimes: [0, 500, 1000, ...], markers: ['six', 'seven', ...] }`
- Server timer-based validation

### Challenge 3: Mobile Input Latency
**Problem:** Touch screens have ~80-120ms input delay
**Solution:**
- Larger scoring windows for mobile (±200ms)
- Haptic feedback on button press
- Visual feedback (button press animation)

### Challenge 4: Marketplace Not Live Until Nov 2025
**Problem:** Can't monetize cosmetics yet
**Solution:**
- Build audience now (free-to-play)
- Grow player base for marketplace launch
- Implement XP/progression to retain players
- Pre-announce cosmetics ("Coming to Marketplace!")

---

## 13) Competitive Advantages on Hytopia

### ✅ Why This Game Will Succeed on Hytopia:

1. **Zero Friction Access**
   - No download = viral TikTok audience can play instantly
   - Mobile browser support = massive addressable market

2. **Trend-Jacking**
   - "6-7" audio is actively trending (millions of views)
   - First mover advantage on Hytopia platform

3. **Built-in Monetization**
   - 85% revenue split = sustainable for indie dev
   - Marketplace launches Nov 2025 (perfect timing)
   - Blockchain ownership = players invest in cosmetics

4. **Cheat-Proof**
   - Server-authoritative = competitive integrity
   - Leaderboards can be trusted

5. **Rapid Iteration**
   - TypeScript = fast development
   - Hot reload = instant testing
   - No client updates needed

---

## 14) Success Metrics (6 Months Post-Launch)

**Player Metrics:**
- 10,000+ total players
- 500+ DAU (Daily Active Users)
- 40% D1 retention, 20% D7 retention
- 15 min avg session length
- 3+ matches per session

**Revenue Metrics (Post-Marketplace):**
- 5% cosmetic attach rate
- $2.50 ARPDAU (paying users)
- $500-1000/month MRR (Month 6)
- 10+ marketplace items live

**Virality Metrics:**
- 1,000+ TikTok clips created
- 50+ influencer plays
- Top 10 on Hytopia trending games

---

## 15) Next Steps - Implementation Guide

### Step 1: Initialize Hytopia Project
```bash
npm install -g hytopia
hytopia init six-seven-battleground
cd six-seven-battleground
npm install
```

### Step 2: Project Structure
```
six-seven-battleground/
├── assets/
│   ├── audio/
│   │   ├── six_seven_v1.ogg
│   │   └── beat_timings.json
│   ├── models/
│   │   ├── platform_6.gltf
│   │   └── platform_7.gltf
│   ├── ui/
│   │   └── index.html
│   └── map.json
├── classes/
│   ├── GameManager.ts
│   ├── GamePlayerEntity.ts
│   ├── PlatformEntity.ts
│   ├── BeatManager.ts
│   └── AnalyticsManager.ts
├── index.ts
├── package.json
└── tsconfig.json
```

### Step 3: Core Files Boilerplate

**index.ts** (entry point):
```typescript
import { startServer, PlayerEvent, World } from 'hytopia';
import GameManager from './classes/GameManager';
import GamePlayerEntity from './classes/GamePlayerEntity';
import worldMap from './assets/map.json' with { type: 'json' };

startServer(world => {
  // Load arena map
  world.loadMap(worldMap);

  // Initialize game manager
  GameManager.instance.setupGame(world);

  // Handle player joins
  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    player.ui.load('ui/index.html');
    GameManager.instance.spawnPlayerEntity(player);
  });

  // Handle player leaves
  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
    GameManager.instance.handlePlayerLeave(player);
  });
});
```

**classes/GameManager.ts** (singleton):
```typescript
import { World, Player, Audio } from 'hytopia';
import GamePlayerEntity from './GamePlayerEntity';
import PlatformEntity from './PlatformEntity';
import beatTimings from '../assets/audio/beat_timings.json' with { type: 'json' };

export default class GameManager {
  public static readonly instance = new GameManager();

  public world?: World;
  private _currentRound = 0;
  private _roundStartTime = 0;
  private _alivePlayers = new Set<string>();
  private _scores = new Map<string, number>();

  private _platform6?: PlatformEntity;
  private _platform7?: PlatformEntity;

  public setupGame(world: World) {
    this.world = world;
    this._spawnPlatforms();
    this._waitForMinPlayers();
  }

  public spawnPlayerEntity(player: Player) {
    if (!this.world) return;

    const playerEntity = new GamePlayerEntity(player);
    playerEntity.spawn(this.world, { x: 0, y: 5, z: 0 });

    this._syncUIForPlayer(player);
  }

  public handleJump(player: Player, platform: 6 | 7, timestamp: number) {
    if (!this._alivePlayers.has(player.id)) return; // Already eliminated

    const elapsed = timestamp - this._roundStartTime;
    const result = this._validateJump(elapsed, platform);

    // Send feedback to player
    player.ui.sendData({
      type: 'score',
      result: result.type,
      score: result.score
    });

    // Update score
    const currentScore = this._scores.get(player.id) || 0;
    this._scores.set(player.id, currentScore + result.score);

    // Eliminate if wrong platform
    if (result.eliminate) {
      this._eliminatePlayer(player);
    }
  }

  private _validateJump(elapsed: number, platform: 6 | 7) {
    // Find nearest beat
    let nearestBeat = beatTimings.beatTimes[0];
    let nearestIndex = 0;
    let minDelta = Math.abs(elapsed - nearestBeat);

    for (let i = 1; i < beatTimings.beatTimes.length; i++) {
      const delta = Math.abs(elapsed - beatTimings.beatTimes[i]);
      if (delta < minDelta) {
        minDelta = delta;
        nearestBeat = beatTimings.beatTimes[i];
        nearestIndex = i;
      }
    }

    // Check correct platform
    const expectedMarker = beatTimings.markers[nearestIndex];
    const expectedPlatform = expectedMarker === 'six' ? 6 : 7;

    if (platform !== expectedPlatform) {
      return { type: 'WRONG', score: 0, eliminate: true };
    }

    // Score based on timing
    if (minDelta <= 150) return { type: 'PERFECT', score: 100, eliminate: false };
    if (minDelta <= 300) return { type: 'GOOD', score: 50, eliminate: false };
    return { type: 'LATE', score: 10, eliminate: false };
  }

  private _spawnPlatforms() {
    if (!this.world) return;

    this._platform6 = new PlatformEntity(6);
    this._platform6.spawn(this.world, { x: -8, y: 0, z: 0 });

    this._platform7 = new PlatformEntity(7);
    this._platform7.spawn(this.world, { x: 8, y: 0, z: 0 });
  }

  private _waitForMinPlayers() {
    // Wait for 4+ players to start
    const checkInterval = setInterval(() => {
      if (!this.world) return;

      const playerCount = this.world.entityManager.getAllPlayerEntities().length;

      if (playerCount >= 4) {
        clearInterval(checkInterval);
        this._startMatch();
      }
    }, 1000);
  }

  private _startMatch() {
    // Implementation for starting match
    console.log('[GAME] Match starting!');
    this._runRound();
  }

  private _runRound() {
    if (!this.world) return;

    this._currentRound++;
    this._roundStartTime = Date.now() + 3000; // 3s countdown

    // Broadcast countdown
    this._broadcastToAll({ type: 'countdown', seconds: 3 });

    // Play audio after countdown
    setTimeout(() => {
      const audio = new Audio({
        uri: 'audio/six_seven_v1.ogg',
        loop: false,
        volume: 0.8
      });
      audio.play(this.world!);
    }, 3000);

    // End round after track duration
    setTimeout(() => {
      this._endRound();
    }, 3000 + 30000); // 3s countdown + 30s track
  }

  private _endRound() {
    // Check for winners, start next round or end match
    if (this._alivePlayers.size <= 3) {
      this._endMatch();
    } else {
      setTimeout(() => this._runRound(), 5000); // 5s break
    }
  }

  private _endMatch() {
    console.log('[GAME] Match ended!');
    // Announce winner, reset game
  }

  private _eliminatePlayer(player: Player) {
    this._alivePlayers.delete(player.id);
    player.ui.sendData({ type: 'eliminated' });

    // Move to spectator mode
    const entity = this.world?.entityManager.getAllPlayerEntities()
      .find(e => e.player.id === player.id);

    if (entity) {
      entity.setPosition({ x: 0, y: 20, z: 0 }); // Elevated spectator position
    }
  }

  private _broadcastToAll(data: any) {
    if (!this.world) return;

    this.world.entityManager.getAllPlayerEntities().forEach(entity => {
      entity.player.ui.sendData(data);
    });
  }

  private _syncUIForPlayer(player: Player) {
    player.ui.sendData({
      type: 'game-state',
      round: this._currentRound,
      players: Array.from(this._alivePlayers),
      scores: Object.fromEntries(this._scores)
    });
  }
}
```

**classes/GamePlayerEntity.ts**:
```typescript
import { DefaultPlayerEntity, Player, PlayerInputState } from 'hytopia';
import GameManager from './GameManager';

export default class GamePlayerEntity extends DefaultPlayerEntity {
  private _last6Press = false;
  private _last7Press = false;

  constructor(player: Player) {
    super({
      player,
      name: player.username,
      cosmeticHiddenSlots: [] // Show all cosmetics
    });
  }

  public onTick() {
    super.onTick();

    const input = this.player.input;

    // Detect key press (not hold)
    if (input['6'] && !this._last6Press) {
      GameManager.instance.handleJump(this.player, 6, Date.now());
    }
    this._last6Press = input['6'] || false;

    if (input['7'] && !this._last7Press) {
      GameManager.instance.handleJump(this.player, 7, Date.now());
    }
    this._last7Press = input['7'] || false;
  }
}
```

**classes/PlatformEntity.ts**:
```typescript
import { Entity, RigidBodyType, World } from 'hytopia';

export default class PlatformEntity extends Entity {
  constructor(number: 6 | 7) {
    super({
      name: `Platform ${number}`,
      blockTextureUri: `blocks/platform_${number}.png`,
      blockHalfExtents: { x: 3, y: 0.2, z: 3 },
      rigidBodyOptions: {
        type: RigidBodyType.STATIC
      }
    });

    this.addTag(`platform-${number}`);
  }

  public glow() {
    // Future: Add particle effects or emissive material
  }
}
```

**assets/audio/beat_timings.json**:
```json
{
  "bpm": 120,
  "beatTimes": [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000],
  "markers": ["six", "six", "seven", "six", "seven", "six", "seven", "six", "seven"]
}
```

### Step 4: Run Local Development
```bash
hytopia start
```

### Step 5: Multiplayer Testing
```bash
# Terminal 1
NODE_ENV=production hytopia start

# Terminal 2
cloudflared tunnel --url http://localhost:8080

# Share the tunnel link with testers!
```

---

## 16) Marketing & Launch Strategy

### Pre-Launch (1-2 Months Before)
- [ ] Create TikTok account (@sixsevenbattleground)
- [ ] Post dev updates (3x/week)
- [ ] Tease cosmetics "Coming to Hytopia Marketplace"
- [ ] Partner with 3-5 micro-influencers (1k-10k followers)

### Launch Week
- [ ] Submit to Hytopia game directory
- [ ] Post launch trailer on TikTok (use actual "6-7" audio)
- [ ] Reddit posts (r/browsergames, r/webgames)
- [ ] Discord communities (Hytopia, indie games)
- [ ] Paid ads ($100 budget on TikTok)

### Post-Launch Growth
- [ ] Weekly content drops (new audio tracks)
- [ ] Seasonal events (Halloween 6-7 Demon mode)
- [ ] Leaderboard competitions (top 10 get exclusive cosmetic)
- [ ] User-generated content contests

---

## 17) Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Audio trend dies | Medium | High | Support multiple audio packs, rebrand to "Beat Party Royale" |
| Marketplace delayed | Low | Medium | Grow free player base, monetize later |
| Network latency issues | Medium | High | Generous scoring windows (±150-300ms) |
| Low player count | Medium | High | Bots for solo practice mode, marketing push |
| Copyright claim on audio | Low | Critical | Use royalty-free remixes OR license officially |

---

## 18) Conclusion - Why Build This on Hytopia?

### Perfect Platform Match:
✅ **Viral Potential** - Zero-friction browser access = TikTok audience converts instantly
✅ **Server Authority** - Cheat-proof competitive integrity
✅ **Monetization Ready** - 85% revenue split on marketplace (Nov 2025)
✅ **Mobile Support** - Built-in touch controls
✅ **Rapid Development** - TypeScript SDK, hot reload, automatic scaling
✅ **Web3 Benefits** - True ownership for players = higher cosmetic value

### Investment vs Return:
- **Development Time:** 4-6 weeks to MVP
- **Asset Costs:** $500-1000 (audio licenses, 3D models)
- **Marketing Budget:** $500 (influencers + ads)
- **Total Investment:** ~$2000 + time
- **Projected 6-Month Revenue:** $3000-5000 (conservative)
- **Upside:** If viral, 10x+ returns possible

---

## 19) IMMEDIATE NEXT ACTIONS

### This Week:
1. **Setup Hytopia development environment**
   ```bash
   npm install -g hytopia
   hytopia init six-seven-battleground
   ```

2. **Create beat timing JSON**
   - Download "6-7" audio (royalty-free version)
   - Use Audacity to mark beat times
   - Export to `beat_timings.json`

3. **Build MVP prototype**
   - GameManager skeleton
   - Platform entities
   - Basic jump detection
   - Audio playback test

4. **Internal playtesting**
   - Test with 2-4 friends using Cloudflare tunnel
   - Balance scoring windows
   - Fix critical bugs

### Next Week:
5. **UI Polish**
   - Implement overlay HUD
   - Score popups
   - Leaderboard

6. **Mobile Testing**
   - Add touch button controls
   - Test on phones/tablets

7. **Public Alpha**
   - Deploy to Hytopia testnet
   - Share on Hytopia Discord
   - Gather feedback

### Month 2:
8. **Content Expansion**
   - Add 2-3 more micro-games
   - Boss round implementation
   - Progression system

9. **Pre-Marketplace Marketing**
   - TikTok dev diary series
   - Cosmetic teasers
   - Influencer outreach

10. **Marketplace Preparation (Nov 2025)**
    - Design 10+ cosmetics
    - Submit for review
    - Price testing

---

## 20) Appendix: Hytopia SDK Resources

### Official Documentation:
- **Dev Docs:** https://dev.hytopia.com/
- **API Reference:** https://github.com/hytopiagg/sdk/tree/main/docs
- **Discord:** https://discord.gg/hytopia
- **Examples:** https://github.com/hytopiagg/

### Community Resources:
- **r/hytopia** (Reddit)
- **@HYTOPIA_** (Twitter/X)
- **Creator Fund:** https://creatorfund.hytopia.com/ ($250k grants!)

### Tools:
- **MagicaVoxel:** Free voxel editor for 3D models
- **Blender:** 3D modeling (GLTF export)
- **Audacity:** Audio editing + beat detection
- **Cloudflared:** Free tunneling for multiplayer testing

---

**Ready to build the viral meme game of 2025? Let's ship this! 🚀**

**Questions? Ping me when you're ready to start coding the MVP.**
