# Hytopia “6–7 Meme Battleground” — Full GDD + Build Plan

**Owner:** Chris Campbell  
**Platform:** Hytopia  
**Tech:** Hytopia SDK, TypeScript, Claude Code (Cursor), Firebase (optional), Stripe (for marketplace web), In‑game Hytopia monetization  
**Version:** v1.0 (Full Build Path — “Answer B”)

---

## 1) One‑Line Pitch
A chaotic, round‑based **meme party royale** where players react to trending audio (e.g., **“6‑7”**) through fast micro‑games, earn **Rizz**, flex **cosmetics**, and co‑create viral **sound rooms** that can trend across the server.

---

## 2) Target Goals
- **Engagement:** 3–6 minute sessions, high replay (12+ rounds/hour).  
- **Virality:** Built‑in TikTok capture prompts + "Clip this" moments.  
- **UGC:** Player‑curated meme audio via moderated **Sound Rooms**.  
- **Monetization:** Cosmetics, emotes, voicepacks, trails, pets, seasonal passes.  
- **Extensibility:** Add new micro‑games weekly without patching core.

---

## 3) Core Loop (Player POV)
1. **Queue → Lobby:** Vote on next “meme pack” (e.g., 6‑7 pack, Skibidi pack, Random).  
2. **Rounds:** 4–6 micro‑games per session (20–30 sec each).  
3. **React:** Emote, move to platform, copy dance, or time a beat press.  
4. **Elimination:** Fail = spectacular “brain‑rot burst.”  
5. **Finale:** Top 2–4 in a boss round (e.g., 6‑7 Demon Simon Says).  
6. **Rewards:** XP, Coins, Rizz Rank; cosmetics RNG drops; highlight reel prompt.  
7. **Social:** Party up, visit Sound Rooms, browse Shop.

---

## 4) Game Modes / Micro‑Games (Launch Set)
**MG‑01: 6 vs 7 Platforms**  
- Audio plays; players must jump to **6** or **7** on beat.  
- Fakeouts (silence, reversed audio).  

**MG‑02: Emote Sync**  
- Perform the **“6‑7 Hand Motion”** at the beat marker; perfect/good/late scores.

**MG‑03: Meme Simon**  
- NPC does a 3‑step meme combo (gesture + move). Players repeat.

**MG‑04: Beat Dash**  
- Sprint track with rhythmic gates that only open on the **“6‑7”** hits.

**MG‑05: Freeze on Seven**  
- Move while music plays, **freeze** exactly at the “seven” drop.

**MG‑06: Sound Sniper**  
- Multiple speakers; only one plays the real “6‑7.” Stand by the correct one.

**MG‑07: Boss Round — 6‑7 Demon**  
- Pattern recognition + dodge VFX blasts on wrong beats.

_Add 2–3 weekly: Skibidi Strafe, Ohio Obby, Sigma Walkoff, Gyatt Platformer, etc._

---

## 5) Progression & Economy
**Rizz Meter:** Fills with perfect reactions; decay out‑of‑round. Unlocks **Rizz Aura** trail intensities.  
**Ranks:** Bronze → Silver → Gold → **Certified 6‑7** → Meme Lord.  
**Currencies:**  
- **Coins** (earnable): playtime, wins, challenges.  
- **Shards** (premium): purchased; used for rare cosmetics/season pass.  
**Battle Pass:** 50 tiers/season, free + premium lane; weekly meme challenges.  
**Gacha Drops:** End‑of‑match low‑chance skin/emote; pity timer.

---

## 6) Monetization (Launch Catalog)
- **Emotes:** 6‑7 Hand Motion; Sigma Strut; Ohio Stare; Skibidi Nod.  
- **Voicepacks:** Announcer (Deadpan, Hype, "Certified 6‑7"); meme stingers.  
- **Trails:** Brain‑Rot Particles; Neon 6‑7 Aura; Glitch Voxels.  
- **Outfits:** Meme Hoodies; Demon 6‑7 Skin; Sigma Suit.  
- **Pets:** Mini Skibidi; Sigma Wolf Pup; Floating Number 7.  
- **Badges/Titles:** "Certified 6‑7", "I speak in sounds", "Beat Goblin".

Pricing ladder: 100–1500 Coins; premium 200–2000 Shards; bundles and seasonal sales.

---

## 7) Social & UGC
**Sound Rooms:** Instanced rooms where player DJs queue curated meme sounds.  
- **Moderation:** whitelist packs; auto‑transcribe + toxicity filter; vote to mute.  
- **Trending:** Rooms with high retention surface in a **Trending** browser.  
- **Creator Rewards:** If a room’s playlist hits retention thresholds, the host earns bonus Coins + cosmetics.

**Clipping Hooks:** End‑screen prompt → auto camera pan on MVP with **/CLIP** guide overlay.

---

## 8) Technical Architecture
- **Authoritative Server Logic:** Round timer, elimination, scoring.  
- **Client:** Input, prediction for movement/emotes; cosmetic rendering.  
- **ECS:** Systems: AudioSyncSystem, PromptSystem, EliminationSystem, RewardSystem.  
- **Content Packs:** JSON‑described micro‑games + audio timings (hot‑swappable).

### 8.1 Core Data Models (TypeScript)
```ts
// Content
interface MemeAudioCue { id: string; url: string; bpm: number; beatTimes: number[]; markers: ("six"|"seven")[] }
interface MicroGameDef { id: string; type: "PLATFORM"|"EMOTE"|"SIMON"|"DASH"|"FREEZE"|"SNIPER"|"BOSS"; audio: string; params: Record<string, any> }
interface PackDef { id: string; name: string; microgames: string[]; }

// Match
interface PlayerState { id: string; name: string; rizz: number; isEliminated: boolean; cosmetics: string[] }
interface RoundState { id: string; microGameId: string; startTime: number; alivePlayerIds: string[]; }
interface MatchState { id: string; packId: string; rounds: RoundState[]; status: "LOBBY"|"IN_ROUND"|"RESULTS" }

// Economy
interface InventoryItem { id: string; type: "EMOTE"|"TRAIL"|"PET"|"OUTFIT"|"VOICE"; rarity: "C"|"R"|"E"|"L" }
interface Profile { id: string; xp: number; coins: number; shards: number; rank: string; inventory: InventoryItem[] }
```

### 8.2 System Flow (Pseudocode)
```ts
onLobbyReady() {
  const pack = voteOrPickPack();
  for (let i=0; i<NUM_ROUNDS; i++) {
    const mg = pickMicroGame(pack);
    startRound(mg);
    await runMicroGame(mg); // authoritative
    eliminateFailures();
    if (alivePlayers() <= FINALE_THRESHOLD) break;
  }
  runFinale();
  distributeRewards();
}

async function runMicroGame(mg: MicroGameDef) {
  preloadAudio(mg.audio);
  broadcast("ROUND_START", mg);
  await waitForBeatWindow(mg.audio, mg.params.prepMs);
  startScoringWindow();
  while (!roundOver()) {
    const inputs = collectInputsWithinBeat();
    scoreInputs(inputs, mg.type);
  }
}
```

### 8.3 Audio Sync Strategy
- Precompute **beatTimes** per track; send server **T0**; clients interpolate.  
- Use short **latency calibration** (tap test) to set client offset.  
- Score windows: **Perfect (±75ms)**, **Good (±150ms)**, **Late (±250ms)**.

---

## 9) Anti‑Cheat & Moderation
- **Server‑validated scoring** windows; ignore client‑side perfect spam.  
- **Rate‑limit inputs**; flag impossible sequences.  
- **Audio UGC:** Only from curated library; ASR → block slurs/hate; live vote‑to‑mute; room reputation scores; creator cooldowns.  
- **Chat Filters:** Bad word list + heuristic.  

---

## 10) Analytics (Events)
- `session_start`, `session_end`  
- `round_start` {microGameId}, `round_result` {score, eliminated}  
- `beat_score` {timingMs, rating}  
- `shop_view`, `shop_purchase` {sku}  
- `ugc_room_enter`, `ugc_room_retention`, `ugc_room_vote`

KPIs: D1/D7 retention, Avg rounds/session, Conversion %, ARPDAU, UGC room retention.

---

## 11) Maps & Level Design
- **Central Arena:** Circular floor with numbered platforms (6/7) + speaker towers.  
- **Micro‑Game Variants:** Modular props (gates, pads, lasers).  
- **Boss Arena:** Dark cathedral with animated 6/7 glyphs.

---

## 12) Asset List (Launch)
- **SFX/Music:** 8 tracks (incl. 6‑7 variations), 60+ stingers.  
- **Emotes:** 10 (incl. 6‑7 Hand Motion, Sigma Strut).  
- **Outfits:** 8 base sets; 2 legendaries.  
- **Trails:** 6 (Neon, Brain‑Rot, Glitch).  
- **Pets:** 3.  
- **VFX:** Burst, aura, boss blasts, beat rings.  
- **UI:** Lobby, Voting, Round HUD, Results, Shop, UGC browser.

---

## 13) Build Milestones (3–6 weeks)
**Week 1:** Core loop (lobby → rounds → results), MG‑01/02 functional, audio sync, basic cosmetics render.  
**Week 2:** MG‑03/04/05, elimination VFX, Rizz Meter, inventory persistence.  
**Week 3:** Shop + currency, Battle Pass v1, analytics, polish.  
**Week 4:** UGC Sound Rooms (read‑only playlists), moderation v1.  
**Week 5:** Boss Round, trending algorithm, gacha drops.  
**Week 6:** Balance, QA, launch trailer, creator outreach.

(*If needed, compress to 3–4 weeks by trimming UGC v1 and shipping more micro‑games later.*)

---

## 14) Claude Code — Ready‑To‑Paste Prompts

**A) Core Systems Boilerplate**
> You are an expert Hytopia SDK engineer. Create a TypeScript project scaffold with ECS systems for Lobby, Round, AudioSync, Scoring, Elimination, Rewards. Include interfaces from the GDD. Implement MG‑01 (Platforms 6/7) with server‑authoritative scoring and client latency calibration. Provide stubs `content/packs/` JSON and a loader. Add unit tests for scoring windows (±75/150/250ms).

**B) Audio Beat Extractor (Local Tooling)**
> Write a Node script using `music-metadata` + `web-audio-api` to detect beats and generate `beatTimes[]` JSON for a folder of `.ogg` tracks. Allow manual markers for "six"/"seven" timestamps. Output to `content/audio/*.json`.

**C) Cosmetics & Economy**
> Implement an in‑memory store with SKUs for EMOTE/TRAIL/PET/OUTFIT/VOICE. Create purchase flow, inventory persistence, and end‑of‑match gacha with pity timer. Expose `grantItem(id)` admin command for testing.

**D) UGC Sound Rooms (v1)**
> Build instanced rooms that play server‑curated playlists. Add join/leave, queue display, vote‑to‑mute, and retention tracking. No file uploads—tracks only from `content/audio/whitelist.json`.

**E) Analytics Wrapper**
> Create an event queue with batching + backoff to POST to a mock endpoint. Instrument the events listed in the GDD.

---

## 15) Suggested Repo Structure
```
root/
 ├─ src/
 │   ├─ ecs/
 │   │   ├─ systems/ (Lobby, Round, AudioSync, Scoring, Elimination, Rewards)
 │   │   └─ components/
 │   ├─ gameplay/
 │   │   ├─ microgames/ (platforms67, emoteSync, memeSimon, beatDash, freezeSeven, soundSniper, boss67)
 │   │   └─ packs/
 │   ├─ net/ (rpc, messages, validation)
 │   ├─ economy/ (store, inventory, gacha, battlepass)
 │   ├─ ugc/ (rooms, moderation)
 │   ├─ util/ (rng, timing, latencyCal)
 │   └─ index.ts
 ├─ content/
 │   ├─ audio/ (ogg, json cues)
 │   ├─ packs/ (json)
 │   └─ cosmetics/ (json)
 ├─ tests/
 ├─ tools/ (beat-extractor, pack-validator)
 └─ README.md
```

---

## 16) Key Algorithms (Concise)
**Latency Calibration:** tap test over 8 beats → median offset → clamp ±120ms.  
**Scoring:** `rating = min( late2good(lateMs), good2perfect(lateMs) )` with hysteresis to avoid flicker.  
**Trending Rooms:** `score = retention@2m * (uniqueVisitors^0.6) * (avgVotes+1)`; decay per hour.

---

## 17) Example Hytopia SDK Pseudocode (Platforms 6/7)
```ts
// Server
onRoundStart(mg) {
  audio = loadCue(mg.audio); // beatTimes[]
  T0 = now()+1500; // 1.5s prep
  broadcast({type:"AUDIO_START", T0, audioId: mg.audio});
}

onPlayerInput(pid, {type:"JUMP", toPlatform, t}) {
  if (isEliminated(pid)) return;
  const lateMs = deltaToNearestBeat(t - T0, audio.beatTimes);
  const rating = windowFor(lateMs); // PERFECT/GOOD/LATE/FAIL
  if (!correctPlatform(toPlatform)) markFail(pid);
  else addRizz(pid, rating);
}

onRoundEnd() { eliminateBelowThreshold(); awardCoinsXp(); }

// Client
on("AUDIO_START", msg => {
  localOffset = calibrateIfNeeded();
  schedulePlay(msg.audioId, msg.T0 + localOffset);
});
```

---

## 18) Voice Lines & SFX Pack (Sample Script)
**Announcer (Deadpan):**  
- "Certified 6‑7."  
- "Wrong beat. Delete the app."  
- "Perfect. You speak fluent number."  
**Hype:**  
- "Six… SEVEN!"  
- "Cooked!"  
- "Rizz level: forbidden."  
**Fail Stingers:** brain‑rot pop, glitch whoosh, demon chuckle.  
**Round Start:** sub‑bass sweep + tick‑tick‑tick + beat drop.

---

## 19) QA & Playtest Checklist
- Beat window fairness across low/high latency.  
- New‑player tutorial (60 sec) explains **6 vs 7** + emote timing.  
- Accessibility: color‑blind safe markers; optional vibration cue.  
- Session length AB tests (4 vs 6 rounds).

---

## 20) Launch & Growth
- **Creator Packs:** Partner TikTokers for exclusive voicepacks.  
- **Weekly Micro‑Game Drops:** small patch notes inside lobby screen.  
- **Events:** Double Rizz Weekend; 6‑7 Anniversary.  
- **Community:** Room spotlights; creator leaderboard.

---

## 21) Risks & Mitigations
- **Audio rights:** Use royalty‑free/licensed packs; in‑house remixes.  
- **Trend decay:** Framework enables weekly swaps; non‑6‑7 packs supported.  
- **Toxicity:** ASR + vote‑to‑mute + room reputation + cooldowns.

---

## 22) Next Actions (Execution Ready)
1) Generate project scaffold via **Claude Code** using prompts in §14.  
2) Implement MG‑01/02 + audio sync + scoring tests.  
3) Hook economy + cosmetics (stub content).  
4) Add two more micro‑games + Boss.  
5) Ship closed playtest; tune beat windows; record 20+ voice lines.  
6) Prepare launch trailer and shop bundles.



---

## 23) Starter Repo Scaffold — Copy/Paste into Claude Code

**Prompt (paste into Claude Code):**

> You are an expert Hytopia SDK engineer. Create a TypeScript monorepo scaffold for a multiplayer round‑based game called **six-seven-brainrot**. Use pnpm. Provide these files with complete contents:
> 
> **root**
> - `package.json` (scripts: dev, build, test, lint, typecheck, format)
> - `pnpm-workspace.yaml`
> - `tsconfig.json` (composite project; strict true)
> - `.editorconfig`, `.gitignore`, `.prettierrc`
> - `README.md` (how to run, dev workflow)
> 
> **apps/server** (Node runtime)
> - `package.json` (type: module; deps: zod, ws or Hytopia net lib, uuid)
> - `tsconfig.json`
> - `src/index.ts` (bootstrap server; match loop; message bus)
> - `src/net/messages.ts` (Zod schemas for RPC/events)
> - `src/state/matchState.ts` (types + helpers)
> - `src/ecs/systems/{LobbySystem,RoundSystem,AudioSyncSystem,ScoringSystem,EliminationSystem,RewardSystem}.ts`
> - `src/gameplay/microgames/{platforms67,emoteSync,memeSimon,beatDash,freezeSeven,soundSniper,boss67}.ts` (stubs)
> - `src/content/loader.ts` (hot‑swappable JSON packs)
> - `src/util/{rng.ts,timing.ts,latencyCal.ts}`
> - `tests/scoring.test.ts` (±75/150/250ms windows)
> 
> **apps/client** (Hytopia client)
> - `package.json`
> - `tsconfig.json`
> - `src/index.ts` (connects to server; input; HUD stubs)
> - `src/hytopia/{bootstrap.ts, input.ts, ui.ts}`
> 
> **packages/content**
> - `package.json`
> - `src/audio/cues/*.json` (example `six_seven_v1.json` with `bpm`, `beatTimes[]`, `markers[]`)
> - `src/packs/launchPack.json`
> - `src/cosmetics/catalog.json`
> - `tools/beat-extractor.ts` (Node script: detect beats; write JSON)
> 
> **Requirements**
> - Implement **server‑authoritative** scoring windows and elimination.
> - Implement **latency calibration** tap test and store per‑client offset.
> - Provide **Platforms 6/7** micro‑game working end‑to‑end (server + client), with numbered platforms, beat windows, and elimination VFX hook.
> - Add a simple **in‑memory store** and inventory persistence (JSON file) with SKUs for EMOTE/TRAIL.
> - Add analytics wrapper with queued POST + backoff; instrument core events.
> - Include exhaustive comments and TODOs for each file to expand later.
> - Ensure `pnpm dev` runs both server and client with ts-node/tsx and nodemon.

---

## 24) Concrete TypeScript Stubs (drop‑in)

> Paste these files over the scaffold to get the **Platforms 6/7** loop working quickly.

### apps/server/src/net/messages.ts
```ts
import { z } from "zod";

export const ClientHello = z.object({ type: z.literal("CLIENT_HELLO"), name: z.string() });
export const ServerHello = z.object({ type: z.literal("SERVER_HELLO"), t0: z.number() });

export const InputJump = z.object({
  type: z.literal("INPUT_JUMP"),
  to: z.enum(["P6","P7"]),
  tClient: z.number(), // ms since epoch client
});

export const AudioStart = z.object({
  type: z.literal("AUDIO_START"),
  audioId: z.string(),
  T0: z.number(), // authoritative start time in ms
});

export type ClientMsg = z.infer<typeof ClientHello> | z.infer<typeof InputJump>;
export type ServerMsg = z.infer<typeof ServerHello> | z.infer<typeof AudioStart>;
```

### apps/server/src/util/timing.ts
```ts
export const now = () => Date.now();
export function nearestBeatDeltaMs(t: number, beatTimes: number[], T0: number) {
  // t is absolute ms; beatTimes are ms offsets from T0
  let best = Infinity;
  for (const bt of beatTimes) best = Math.min(best, Math.abs((T0 + bt) - t));
  return best; // |lateMs|
}
export function windowFor(lateMs: number) {
  if (lateMs <= 75) return "PERFECT" as const;
  if (lateMs <= 150) return "GOOD" as const;
  if (lateMs <= 250) return "LATE" as const;
  return "FAIL" as const;
}
```

### apps/server/src/gameplay/microgames/platforms67.ts
```ts
import { nearestBeatDeltaMs, windowFor, now } from "../../util/timing";

export interface Cue { id: string; beatTimes: number[]; markers: ("six"|"seven")[] }
export interface RoundCtx {
  T0: number; // ms
  cue: Cue;
  alive: Set<string>;
  platformFor: (uid: string) => "P6" | "P7" | null;
  eliminate: (uid: string, reason: string) => void;
  addRizz: (uid: string, rating: "PERFECT"|"GOOD"|"LATE") => void;
}

export function scoreJump(ctx: RoundCtx, uid: string, platform: "P6"|"P7", tClient: number, clientOffsetMs: number) {
  if (!ctx.alive.has(uid)) return;
  const tServerEst = tClient - clientOffsetMs; // naive offset correction
  const late = nearestBeatDeltaMs(tServerEst, ctx.cue.beatTimes, ctx.T0);
  const rating = windowFor(late);
  const expected = expectedPlatformAt(ctx);
  if (platform !== expected || rating === "FAIL") return ctx.eliminate(uid, `wrong:${expected}|${rating}`);
  ctx.addRizz(uid, rating);
}

function expectedPlatformAt(ctx: RoundCtx): "P6"|"P7" {
  // Find last marker not past now
  const elapsed = now() - ctx.T0;
  let idx = 0;
  while (idx + 1 < ctx.cue.beatTimes.length && ctx.cue.beatTimes[idx + 1] <= elapsed) idx++;
  const mark = ctx.cue.markers[idx] ?? "six";
  return mark === "six" ? "P6" : "P7";
}
```

### apps/server/src/ecs/systems/AudioSyncSystem.ts
```ts
import type { Cue } from "../../gameplay/microgames/platforms67";
export interface AudioBus { broadcast(msg: unknown): void }

export function startAudio(bus: AudioBus, cue: Cue, prepMs = 1500) {
  const T0 = Date.now() + prepMs;
  bus.broadcast({ type: "AUDIO_START", audioId: cue.id, T0 });
  return T0;
}
```

### apps/client/src/hytopia/input.ts
```ts
export type Platform = "P6"|"P7";
export interface Net { send(msg: unknown): void; now(): number; getLatencyOffset(): number }

export function bindPlatformInputs(net: Net, getTarget: () => Platform) {
  // Bind to two keys for demo; map to platforms in Hytopia UI later
  window.addEventListener("keydown", (e) => {
    if (e.key === "6") net.send({ type: "INPUT_JUMP", to: "P6", tClient: net.now() });
    if (e.key === "7") net.send({ type: "INPUT_JUMP", to: "P7", tClient: net.now() });
  });
}
```

### packages/content/src/audio/cues/six_seven_v1.json
```json
{
  "id": "six_seven_v1",
  "bpm": 120,
  "beatTimes": [0,500,1000,1500,2000,2500,3000,3500,4000],
  "markers": ["six","six","seven","six","seven","six","seven","six","seven"]
}
```

### tests/scoring.test.ts (excerpt)
```ts
import { windowFor } from "../apps/server/src/util/timing";

describe("windows", () => {
  it("perfect <= 75", () => expect(windowFor(60)).toBe("PERFECT"));
  it("good <= 150", () => expect(windowFor(120)).toBe("GOOD"));
  it("late <= 250", () => expect(windowFor(200)).toBe("LATE"));
  it("fail > 250", () => expect(windowFor(400)).toBe("FAIL"));
});
```

### README.md (run commands)
```md
# six-seven-brainrot

## Dev
```bash
pnpm i
pnpm dev # runs server+client with hot reload
```

## Test
```bash
pnpm test
```
```

---

## 25) Next Step
- Use the **Scaffold Prompt** in §23 to generate the full project.
- Drop in the **stubs** from §24 to get Platforms 6/7 playable.
- Ping me when you want the **UGC Sound Rooms v1** and **Shop** code next.



---

## 26) UGC Sound Rooms v1 — Design + Code (Copy/Paste)

### 26.1 Feature Scope (v1)
- Curated **playlist-only** rooms (no uploads). Tracks come from `content/audio/whitelist.json`.
- Create/Join/Leave room; queue browsing; now-playing HUD; DJ host handoff.
- **Vote-to-mute** current track; **room reputation**; AFK auto-kick.
- Analytics: `ugc_room_create`, `enter`, `leave`, `vote_mute`, `retention_tick`.

### 26.2 Data Models
```ts
// packages/content/src/audio/whitelist.json
interface WhitelistTrack { id: string; title: string; durationMs: number; cueId: string }
interface Whitelist { tracks: WhitelistTrack[] }

// apps/server/src/ugc/types.ts
export interface Room {
  id: string;
  name: string;
  hostId: string; // player id
  queue: string[]; // track ids
  now?: { trackId: string; startedAt: number };
  members: Set<string>;
  votesMute: Set<string>;
  rep: number; // -100..+100
}
```

### 26.3 Server: Room Manager
```ts
// apps/server/src/ugc/rooms.ts
import { now } from "../util/timing";
import type { Room } from "./types";

export class RoomManager {
  rooms = new Map<string, Room>();

  create(name: string, hostId: string, firstTrackId?: string) {
    const id = `room_${Math.random().toString(36).slice(2,8)}`;
    const r: Room = { id, name, hostId, queue: [], members: new Set(), votesMute: new Set(), rep: 0 };
    if (firstTrackId) r.queue.push(firstTrackId);
    this.rooms.set(id, r);
    return r;
  }

  join(roomId: string, playerId: string) {
    const r = this.rooms.get(roomId); if (!r) throw new Error("room");
    r.members.add(playerId); r.votesMute.delete(playerId);
    return r;
  }

  leave(roomId: string, playerId: string) {
    const r = this.rooms.get(roomId); if (!r) return;
    r.members.delete(playerId); r.votesMute.delete(playerId);
    if (r.members.size === 0) this.rooms.delete(roomId);
  }

  enqueue(roomId: string, trackId: string) {
    const r = this.rooms.get(roomId)!; r.queue.push(trackId);
  }

  startNext(roomId: string) {
    const r = this.rooms.get(roomId)!; const next = r.queue.shift();
    if (!next) { r.now = undefined; return; }
    r.now = { trackId: next, startedAt: now() };
  }

  voteMute(roomId: string, playerId: string) {
    const r = this.rooms.get(roomId)!; r.votesMute.add(playerId);
    // 60% of members triggers mute
    if (r.votesMute.size / Math.max(1, r.members.size) >= 0.6) {
      r.rep = Math.max(-100, r.rep - 2);
      this.startNext(roomId);
      r.votesMute.clear();
      return true;
    }
    return false;
  }
}
```

### 26.4 Messages & Handlers
```ts
// apps/server/src/net/ugcMessages.ts
import { z } from "zod";
export const CreateRoom = z.object({ type: z.literal("UGC_CREATE"), name: z.string(), firstTrackId: z.string().optional() });
export const JoinRoom   = z.object({ type: z.literal("UGC_JOIN"), roomId: z.string() });
export const LeaveRoom  = z.object({ type: z.literal("UGC_LEAVE"), roomId: z.string() });
export const Enqueue    = z.object({ type: z.literal("UGC_ENQUEUE"), roomId: z.string(), trackId: z.string() });
export const VoteMute   = z.object({ type: z.literal("UGC_VOTE_MUTE"), roomId: z.string() });

export const RoomUpdate = z.object({ type: z.literal("UGC_ROOM_UPDATE"), room: z.any() });
export type UGCClientMsg = z.infer<typeof CreateRoom|typeof JoinRoom|typeof LeaveRoom|typeof Enqueue|typeof VoteMute>;
export type UGCServerMsg = z.infer<typeof RoomUpdate>;
```

### 26.5 Client: Minimal UI Hooks
```ts
// apps/client/src/ui/ugc.ts
export function renderRoomList(rooms: any[]) { /* list + join buttons */ }
export function renderRoom(room: any) { /* show now playing, queue, vote-mute */ }

export function bindUGC(net: { send(m:any):void }) {
  (document.getElementById("btnCreateRoom") as HTMLButtonElement)?.addEventListener("click", () => {
    const name = (document.getElementById("roomName") as HTMLInputElement).value || "Sound Room";
    net.send({ type: "UGC_CREATE", name });
  });
}
```

### 26.6 Moderation & Trending (v1)
```ts
// apps/server/src/ugc/trending.ts
export function trendingScore(room: { rep:number, members:Set<string>, minutes:number, votes:number }) {
  const retention = Math.min(1, room.minutes / 2); // cap at 2m for score
  const visitors = Math.pow(Math.max(1, room.members.size), 0.6);
  const votesAdj = (room.votes + 1);
  return retention * visitors * votesAdj * (Math.max(0, room.rep + 100) / 200);
}
```

### 26.7 Analytics (server ticks)
```ts
// apps/server/src/ugc/analytics.ts
export function tickRetention(roomId: string, members: number) {
  emit("ugc_room_retention", { roomId, members, ts: Date.now() });
}
```

### 26.8 Claude Code Prompt (UGC)
> Implement the UGC Sound Rooms v1 per §26: add `rooms.ts`, `ugcMessages.ts`, client UI in `ui/ugc.ts`, wire server handlers to broadcast `UGC_ROOM_UPDATE` on changes, and add analytics events. Read whitelist from `packages/content/src/audio/whitelist.json`. No uploads; only play listed cues.

---

## 27) Shop + Cosmetics Flow — Design + Code

### 27.1 Catalog & Inventory
```ts
// packages/content/src/cosmetics/catalog.json
{
  "emotes": [
    { "id": "emote_67_hand", "name": "6‑7 Hand Motion", "rarity": "R", "priceCoins": 600 },
    { "id": "emote_sigma", "name": "Sigma Strut", "rarity": "E", "priceShards": 400 }
  ],
  "trails": [
    { "id": "trail_brainrot", "name": "Brain‑Rot Particles", "rarity": "E", "priceShards": 800 },
    { "id": "trail_neon67",  "name": "Neon 6‑7 Aura", "rarity": "L", "priceShards": 1500 }
  ]
}

// apps/server/src/economy/types.ts
export type Rarity = "C"|"R"|"E"|"L";
export interface SKU { id: string; type: "EMOTE"|"TRAIL"|"PET"|"OUTFIT"|"VOICE"; name: string; rarity: Rarity; priceCoins?: number; priceShards?: number }
export interface Profile { id: string; coins: number; shards: number; inventory: string[] }
```

### 27.2 Store Service
```ts
// apps/server/src/economy/store.ts
import type { SKU, Profile } from "./types";

export class StoreService {
  constructor(private catalog: Record<string, SKU>) {}

  canAfford(p: Profile, sku: SKU) {
    return (sku.priceCoins && p.coins >= sku.priceCoins) || (sku.priceShards && p.shards >= sku.priceShards);
  }

  purchase(p: Profile, skuId: string) {
    const sku = this.catalog[skuId]; if (!sku) throw new Error("sku");
    if (!this.canAfford(p, sku)) throw new Error("funds");
    if (p.inventory.includes(skuId)) throw new Error("owned");
    if (sku.priceCoins) p.coins -= sku.priceCoins;
    if (sku.priceShards) p.shards -= sku.priceShards;
    p.inventory.push(skuId);
    return sku;
  }
}
```

### 27.3 Persistence (JSON for dev)
```ts
// apps/server/src/economy/profiles.ts
import fs from "node:fs";
import type { Profile } from "./types";
const FILE = ".data/profiles.json";

export function loadProfile(id: string): Profile {
  try { const all = JSON.parse(fs.readFileSync(FILE,"utf8")); return all[id] ?? { id, coins: 500, shards: 100, inventory: [] }; }
  catch { return { id, coins: 500, shards: 100, inventory: [] }; }
}
export function saveProfile(p: Profile) {
  let all: Record<string, Profile> = {};
  try { all = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch {}
  all[p.id] = p; fs.mkdirSync(".data", { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(all, null, 2));
}
```

### 27.4 Messages & Flow
```ts
// apps/server/src/net/storeMessages.ts
import { z } from "zod";
export const StoreList = z.object({ type: z.literal("STORE_LIST") });
export const StoreBuy  = z.object({ type: z.literal("STORE_BUY"), skuId: z.string() });
export const StoreState= z.object({ type: z.literal("STORE_STATE"), coins: z.number(), shards: z.number(), inventory: z.array(z.string()), catalog: z.any() });
```

Server handler sketch:
```ts
// on STORE_LIST -> send StoreState with catalog + player funds + owned
// on STORE_BUY  -> attempt purchase via StoreService -> persist -> broadcast StoreState
```

### 27.5 Gacha (End‑of‑Match)
```ts
// apps/server/src/economy/gacha.ts
import type { SKU, Profile } from "./types";

export function roll(p: Profile, pool: SKU[], pity: number) {
  const r = Math.random();
  const boosted = r + pity; // crude pity boost
  const pick = boosted > 0.95 ? pickRarity(pool, "L") : boosted > 0.8 ? pickRarity(pool, "E") : pickRarity(pool, "R");
  if (!p.inventory.includes(pick.id)) p.inventory.push(pick.id);
  return pick;
}

function pickRarity(pool: SKU[], rarity: "C"|"R"|"E"|"L") { const c = pool.filter(s=>s.rarity===rarity); return c[Math.floor(Math.random()*c.length)] }
```

### 27.6 Client UI (Minimal)
```ts
// apps/client/src/ui/shop.ts
export function renderShop(state: { coins:number; shards:number; inventory:string[]; catalog: any }) {
  // Render items with Buy buttons; gray out owned.
}
```

### 27.7 Claude Code Prompt (Shop)
> Implement Shop per §27: catalog loader, StoreService, JSON profiles, messages and handlers, minimal UI that lists SKUs and lets player buy with coins/shards. Wire gacha `roll()` at match end and show a reveal modal.

---

## 28) What’s Next
- Integrate **Shop UI** into Results screen; add **gacha reveal** VFX.
- Hook **Sound Rooms** into Lobby menu + Trending list using §26.6 score.
- I can add **Battle Pass v1** and **Boss Round** code next on your signal.



---

## 29) Battle Pass v1 — Design + Code (Copy/Paste)

### 29.1 Scope
- 50 tiers, **Free** and **Premium** tracks.
- XP from matches, challenges, and daily login streaks.
- Rewards: Coins, Shards, cosmetics SKUs, titles.
- Season config as JSON; progression stored per profile.

### 29.2 Data & Storage
```ts
// packages/content/src/battlepass/season01.json
{
  "id": "s01",
  "endAt": 1767225600000,
  "tiers": [
    { "tier": 1,  "free": {"coins": 100}, "premium": {"sku": "emote_67_hand"} },
    { "tier": 2,  "free": {"coins": 150}, "premium": {"sku": "trail_brainrot"} }
    // ... up to 50
  ],
  "xpPerTier": 1000,
  "dailies": ["daily_play_3_rounds", "daily_perfect_5_beats"],
  "weeklies": ["weekly_win_3_matches"]
}

// apps/server/src/battlepass/types.ts
export interface BPState { seasonId: string; xp: number; premium: boolean; claimed: number[] }

// apps/server/src/economy/profileExt.ts
export interface ProfileExt { bp?: BPState; loginStreak?: { last: number; count: number } }
```

### 29.3 Server Helpers
```ts
// apps/server/src/battlepass/core.ts
import type { Profile } from "../economy/types";
import type { BPState } from "./types";
import season from "../../../packages/content/src/battlepass/season01.json" assert { type: "json" };

export function ensureBP(p: Profile & { ext?: any }): BPState {
  if (!p.ext) p.ext = {};
  if (!p.ext.bp || p.ext.bp.seasonId !== season.id) p.ext.bp = { seasonId: season.id, xp: 0, premium: false, claimed: [] };
  return p.ext.bp;
}

export function addXP(p: Profile & { ext?: any }, amount: number) {
  const bp = ensureBP(p); bp.xp = Math.max(0, Math.min( season.tiers.length * season.xpPerTier, bp.xp + amount ));
}

export function claimTier(p: Profile & { ext?: any }, tier: number, premium = false) {
  const bp = ensureBP(p);
  const reqXp = tier * season.xpPerTier;
  if (bp.xp < reqXp) throw new Error("insufficient_xp");
  const key = premium ? tier + 1000 : tier; // disambiguate
  if (bp.claimed.includes(key)) throw new Error("already_claimed");
  bp.claimed.push(key);
  return premium ? season.tiers[tier-1].premium : season.tiers[tier-1].free;
}

export function tierFromXP(xp: number) { return Math.floor(xp / season.xpPerTier); }
```

### 29.4 Events → XP
```ts
// apps/server/src/battlepass/xpRules.ts
export const XP_RULES = {
  session_end: (ctx:any) => 100, // base
  round_result: ({ rating }:any) => rating === "PERFECT" ? 20 : rating === "GOOD" ? 10 : 5,
  match_win: () => 150,
  daily_login: (streak:number) => 25 + Math.min(75, streak * 5)
};
```

### 29.5 Messages & UI
```ts
// apps/server/src/net/bpMessages.ts
import { z } from "zod";
export const BPList   = z.object({ type: z.literal("BP_LIST") });
export const BPClaim  = z.object({ type: z.literal("BP_CLAIM"), tier: z.number(), premium: z.boolean().optional() });
export const BPStateM = z.object({ type: z.literal("BP_STATE"), xp: z.number(), tier: z.number(), claimed: z.array(z.number()), premium: z.boolean() });

// apps/client/src/ui/battlepass.ts
export function renderBP(state: { xp:number; tier:number; claimed:number[]; premium:boolean; season:any }) { /* progress bar + claim buttons */ }
```

### 29.6 Claude Code Prompt (BP)
> Implement Battle Pass v1 per §29: load season01.json, extend profiles with BPState, grant XP from events in xpRules, expose BP_LIST/BP_CLAIM and a simple UI to view progress and claim rewards. On claim, deliver coins/shards or grant SKUs.

---

## 30) Boss Round — **6‑7 Demon** (Design + Code)

### 30.1 Mechanics
- Arena: circular platforms with safe wedges lighting on the **correct beat**.
- Demon fires **beat blasts**; standing off‑beat or wrong wedge = damage/elimination.
- Phase escalation: faster BPM, fake callouts, reverse pattern.

### 30.2 Data
```ts
// packages/content/src/boss/demon67.json
{
  "id": "boss_demon67",
  "cueId": "six_seven_v1",
  "phases": [
    { "speed": 1.0, "fakeouts": 0 },
    { "speed": 1.15, "fakeouts": 1 },
    { "speed": 1.3, "fakeouts": 2 }
  ]
}
```

### 30.3 Server Logic
```ts
// apps/server/src/gameplay/microgames/boss67.ts
import { nearestBeatDeltaMs, windowFor } from "../../util/timing";

export interface BossCtx { T0:number; beatTimes:number[]; alive:Set<string>; hp: Map<string,number>; damage:(id:string,amt:number)=>void; }

export function onBeat(ctx: BossCtx, t: number) {
  // Called each beat by RoundSystem
  // Telecast safe wedge based on marker (six vs seven)
}

export function scorePosition(ctx: BossCtx, uid: string, tClient: number, clientOffsetMs: number, inSafeWedge: boolean) {
  const tServerEst = tClient - clientOffsetMs;
  const late = nearestBeatDeltaMs(tServerEst, ctx.beatTimes, ctx.T0);
  const rating = windowFor(late);
  if (!inSafeWedge || rating === "FAIL") ctx.damage(uid, 1); // 3 HP total
}
```

### 30.4 Client Hooks
```ts
// apps/client/src/ui/boss67.ts
export function showTelegraph(wedge: "SIX"|"SEVEN") { /* light up floor wedge */ }
export function showBlast() { /* screen shake + vfx */ }
```

### 30.5 Announcer Lines
- "The demon counts in sevens. Keep up."
- "SIX… SEVEN! Dodge or dissolve."
- "Phase up. You wanted rot—now cook."

### 30.6 Claude Code Prompt (Boss)
> Implement boss67 per §30: telegraph safe wedge on each beat using cue markers, apply damage when off‑wedge or late>250ms, 3 HP per player, escalate phases based on time survived. Add VFX hooks on telegraph and blast.

---

## 31) Results Screen + Gacha Reveal

### 31.1 Flow
- After finale → **Results** panel shows placements, XP, Coins, Rizz gains.
- Trigger **gacha roll** with rarity animation (Common → Legendary).
- CTA: Equip reward, Go to Shop, Queue Again, Clip Moment.

### 31.2 Server → Client Payload
```ts
// apps/server/src/net/resultsMessages.ts
import { z } from "zod";
export const Results = z.object({
  type: z.literal("RESULTS"),
  placement: z.array(z.object({ id:z.string(), name:z.string(), rank:z.number() })),
  rewards: z.object({ xp:z.number(), coins:z.number(), shards:z.number(), gacha: z.object({ skuId:z.string(), rarity:z.string() }).optional() })
});
```

### 31.3 Client UI (Minimal)
```ts
// apps/client/src/ui/results.ts
export function renderResults(data:any) {
  // 1) placements table
  // 2) reward bars (XP, Coins, Shards)
  // 3) gacha reveal modal: glow pulses by rarity; confetti on Legendary
}
```

### 31.4 Claude Code Prompt (Results)
> Implement Results per §31: server computes placements and rewards, triggers `roll()` from gacha, sends RESULTS payload, client renders table, bars, and modal reveal with equip button that updates loadout.

---

## 32) Final Wiring Checklist
- Emit XP on `session_end`, `round_result`, `match_win`; show BP progress tick.
- Boss Round gates into Results; roll gacha and deliver inventory.
- UGC Rooms accessible from Lobby → Trending; room badge shows rep score.
- Store buttons from Results open Shop; equip new cosmetic immediately.

---

## 33) Next Up (pick any)
- **Tutorial popups** (first 2 sessions).  
- **Voicepack system** with announcer switching.  
- **Weekly Challenges** with bonus BP XP.  
- **Cross‑promo**: Pregame banners + SEC tie‑in special pack.



---

## 34) Tutorial Popups + First‑Time User Flow (FTUE)

### 34.1 Goals
- Teach **Platforms 6/7** and **Beat Timing** within 60–90s.
- Calibrate **latency** using tap test.
- Let users try an **unfail** practice (no elimination) before live rounds.

### 34.2 Profile Flags & Analytics
```ts
// apps/server/src/ftue/types.ts
export interface FTUEState { seen:boolean; completed:boolean; lastShown:number }
// extend ProfileExt
export interface ProfileExt { ftue?: FTUEState; /* ...existing... */ }

// analytics events: ftue_start, ftue_calibrate_done, ftue_practice_done, ftue_complete
```

### 34.3 Server: FTUE Gate
```ts
// apps/server/src/ftue/gate.ts
import type { Profile } from "../economy/types";
export function needsFTUE(p: Profile & { ext?: any }) {
  return !p.ext?.ftue?.completed;
}
export function markFTUE(p: Profile & { ext?: any }, part: "start"|"calibrate"|"practice"|"complete") {
  if (!p.ext) p.ext = {}; if (!p.ext.ftue) p.ext.ftue = { seen:false, completed:false, lastShown:Date.now() };
  if (part === "start") p.ext.ftue.seen = true;
  if (part === "complete") p.ext.ftue.completed = true;
  p.ext.ftue.lastShown = Date.now();
}
```

### 34.4 Client UI: Tutorial System
```ts
// apps/client/src/ui/tutorial.ts
export function startFTUE(show: (id:string, text:string)=>void, next: ()=>void) {
  show("tip_move", "Move with WASD / stick. You'll follow the beat.");
  show("tip_numbers", "Two platforms: 6 and 7. Jump to the one the beat calls.");
  show("tip_timing", "Press on the beat. Aim for PERFECT (±75ms).");
  next();
}

export function tipLatency(show:(id:string,text:string)=>void, calibrate:()=>Promise<number>) {
  show("tip_cal", "Tap SPACE to the beat 8 times to calibrate latency.");
  return calibrate();
}

export function tipPractice(show:(id:string,text:string)=>void) {
  show("tip_practice", "Practice round: you can't be eliminated. Try to hit 3 PERFECTs!");
}
```

### 34.5 Messages
```ts
// apps/server/src/net/ftueMessages.ts
import { z } from "zod";
export const FTUEStart = z.object({ type: z.literal("FTUE_START") });
export const FTUECalibrateDone = z.object({ type: z.literal("FTUE_CAL_DONE"), offset:number() });
export const FTUEPracticeDone = z.object({ type: z.literal("FTUE_PRACTICE_DONE"), perfects:z.number() });
export const FTUEComplete = z.object({ type: z.literal("FTUE_COMPLETE") });
```

### 34.6 Flow
1) **Lobby check** → if `needsFTUE` → route to FTUE scene.  
2) **Intro tips** → **Latency Tap** (store client offset) → **Practice MG‑01** (unfail).  
3) If 3 PERFECTs or 2 mins elapsed → **FTUE complete** → reward 100 Coins → queue live match.

### 34.7 Claude Code Prompt (FTUE)
> Implement FTUE per §34: add profile flags, UI tips, latency tap test, practice Platforms 6/7 that does not eliminate. On completion, mark profile, grant 100 Coins, emit analytics events, and return to normal matchmaking.

---

## 35) Voicepack System + Announcer Switching

### 35.1 Scope
- Runtime‑switchable **announcer voicepacks** with line categories: `round_start`, `perfect`, `good`, `fail`, `eliminate`, `boss_phase`, `results`.
- Content from JSON packs; local audio files or pre‑baked TTS.
- Player can **equip** a voicepack; server broadcasts category cues; client picks a line to play.

### 35.2 Content Format
```ts
// packages/content/src/voicepacks/deadpan.json
{
  "id": "vp_deadpan",
  "name": "Deadpan",
  "lines": {
    "round_start": ["Certified 6-7."],
    "perfect": ["Perfect. You speak fluent number."],
    "good": ["Good. Not perfect, but cooked."],
    "fail": ["Wrong beat. Delete the app."],
    "eliminate": ["Out. Return when numerate."],
    "boss_phase": ["Phase up."],
    "results": ["Summary incoming."]
  }
}

// packages/content/src/voicepacks/hype.json (similar)
```

### 35.3 Server: Cue Bus
```ts
// apps/server/src/audio/voiceBus.ts
export type VPEvent = "round_start"|"perfect"|"good"|"fail"|"eliminate"|"boss_phase"|"results";
export function cueVoiceAll(bus:{broadcast(m:any):void}, ev:VPEvent, meta?:any) {
  bus.broadcast({ type:"VP_CUE", ev, meta });
}
```

### 35.4 Messages & Equip Flow
```ts
// apps/server/src/net/voiceMessages.ts
import { z } from "zod";
export const VPList  = z.object({ type: z.literal("VP_LIST") });
export const VPEquip = z.object({ type: z.literal("VP_EQUIP"), id: z.string() });
export const VPState = z.object({ type: z.literal("VP_STATE"), equipped: z.string(), owned: z.array(z.string()), catalog: z.any() });
```

Profiles store `equippedVoicepackId` and ownership (buy via Shop SKU type `VOICE`).

### 35.5 Client Playback
```ts
// apps/client/src/audio/voice.ts
import packs from "@content/voicepacks/*.json";
export function playCue(equippedId:string, ev:string) {
  const pack = packs[equippedId] || packs["vp_deadpan"]; const arr = pack.lines[ev] || [];
  const line = arr[Math.floor(Math.random()*arr.length)];
  if (!line) return;
  // map line -> audio file path or TTS cache key, then play
}

export function bindCueBus(net:{on(type:string,cb:(m:any)=>void):void}, getEquipped:()=>string) {
  net.on("VP_CUE", (m:any)=> playCue(getEquipped(), m.ev));
}
```

### 35.6 Triggers
- `round_start` when a micro‑game begins.  
- `perfect`/`good`/`fail` from ScoringSystem (rate‑limited per player, e.g., 1/sec).  
- `eliminate` when a player is removed.  
- `boss_phase` on phase change.  
- `results` when Results screen opens.

### 35.7 Claude Code Prompt (Voicepacks)
> Implement voicepacks per §35: load JSON packs, extend Shop with VOICE SKUs, add equip UI, broadcast VP_CUE events from server, and play lines client‑side with basic rate‑limit to avoid spam.

---

## 36) Optional — Accessibility & Settings Pane
- **Beat Assist** (visual ring + optional vibration).  
- **Color‑blind friendly** platform shaders.  
- **Audio ducking** for voice lines vs music.  
- Toggle in **Settings**; persist to profile.

---

## 37) Ship Checklist (FTUE + Voicepacks)
- FTUE route triggers only for fresh profiles; skippable after 60s.  
- Calibrated latency stored and applied to scoring.
- Voicepacks appear in Shop and equipping updates immediately.  
- Analytics dashboards: FTUE completion rate, average offset, voicepack attach rate.

