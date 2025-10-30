# 🎮 6-7 Meme Battleground

> A viral, round-based meme party royale where players react to the "6-7" TikTok audio through fast micro-games!

Built on [Hytopia](https://hytopia.com/) - The browser-based multiplayer game engine.

---

## 🎯 Game Concept

**React to the beat!** Jump to platforms 6 or 7 on the beat to survive eliminations and become the ultimate meme champion!

- **Players:** 2-16 per lobby
- **Match Length:** 3-5 minutes
- **Rounds:** 6 rounds of intense beat-matching action
- **Platform:** Browser-based (no download required!)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+)
- **npm** or **pnpm**
- **Hytopia CLI** installed globally

### Installation

1. **Install Hytopia CLI** (if not already installed):
```bash
npm install -g hytopia
```

2. **Install dependencies**:
```bash
npm install
```

3. **Start the development server**:
```bash
npm run dev
```

4. **Open your browser** and go to:
```
http://localhost:8080
```

---

## 🎮 How to Play

### Controls

**Desktop:**
- `WASD` - Move
- `SPACE` - Jump
- `SHIFT` - Sprint
- **`6` or `7`** - Jump to platform (on the beat!)

**Mobile:**
- Virtual joystick for movement
- Touch buttons for 6 and 7

### Gameplay

1. **Wait for Players** - Minimum 2 players to start
2. **Get Ready** - 3-second countdown before each round
3. **React to the Beat** - Jump to platform 6 or 7 when the audio calls it
4. **Timing is Everything:**
   - **PERFECT** (±150ms): +100 points
   - **GOOD** (±300ms): +50 points
   - **LATE** (±500ms): +10 points
   - **MISS/WRONG**: Elimination!
5. **Survive 6 Rounds** - Last player standing wins!

### Chat Commands

- `/help` - Show game instructions
- `/stats` - View your player stats
- `/rocket` - Blast yourself into the air (fun!)

---

## 📁 Project Structure

```
six-seven-battleground/
├── assets/
│   ├── audio/
│   │   ├── beat_timings/
│   │   │   └── six_seven_v1.json      # Pre-computed beat timing data
│   │   └── six_seven_v1.mp3           # ⚠️ YOU NEED TO ADD THIS
│   ├── ui/
│   │   └── index.html                 # Game UI (HUD, leaderboard, etc.)
│   └── map.json                       # World map
├── classes/
│   ├── BeatManager.ts                 # Beat timing validation & scoring
│   ├── GameManager.ts                 # Main game orchestration (singleton)
│   ├── GamePlayerEntity.ts            # Player entity with game logic
│   └── PlatformEntity.ts              # The 6 and 7 platforms
├── gameConfig.ts                      # All game constants & configuration
├── index.ts                           # Entry point
├── package.json
└── tsconfig.json
```

---

## ⚠️ IMPORTANT: Missing Audio File

**The game needs the "6-7" audio track to work!**

### How to Add the Audio:

1. **Download or create a 30-second audio track** (royalty-free version of "6-7" meme audio)

2. **Convert to MP3** (if needed)

3. **Place it here:**
   ```
   assets/audio/six_seven_v1.mp3
   ```

4. **Verify beat timings match** the audio (currently set to 120 BPM)

### Alternative: Use a Placeholder

For testing, you can use ANY 30-second audio track:
- Just name it `six_seven_v1.mp3`
- Place it in `assets/audio/`
- The game will work with any audio (but won't match the meme!)

---

## 🎨 Customization

### Game Balance (edit `gameConfig.ts`)

```typescript
// Scoring windows (milliseconds)
export const PERFECT_TIMING_WINDOW_MS = 150; // Tighter = harder
export const GOOD_TIMING_WINDOW_MS = 300;
export const LATE_TIMING_WINDOW_MS = 500;

// Match settings
export const ROUNDS_PER_MATCH = 6;           // Number of rounds
export const MINIMUM_PLAYERS_TO_START = 2;   // Min players needed
export const SECONDS_BETWEEN_ROUNDS = 5;     // Rest time
```

### Beat Timing (`assets/audio/beat_timings/six_seven_v1.json`)

```json
{
  "bpm": 120,
  "beatTimes": [0, 500, 1000, 1500, ...],
  "markers": ["six", "seven", "six", ...]
}
```

**Pro Tip:** Use Audacity to find exact beat times in your audio!

---

## 🌐 Multiplayer Testing

### Local Network (Friends)

1. **Start the server in production mode:**
   ```bash
   npm run prod
   ```

2. **In another terminal, start Cloudflare tunnel:**
   ```bash
   cloudflared tunnel --url http://localhost:8080
   ```

3. **Share the tunnel URL** with friends:
   ```
   https://your-tunnel-id.trycloudflare.com
   ```

4. **Players connect** at: `https://hytopia.com/play?join=your-tunnel-id.trycloudflare.com`

---

## 🏗️ Development Guide

### Adding New Features

**Example: Add a new micro-game**

1. Create new class in `classes/` (e.g., `EmoteGame.ts`)
2. Add game mode to `gameConfig.ts`
3. Update `GameManager.ts` to select the new game
4. Test thoroughly!

### Debug Mode

Enable physics debug rendering (helpful for testing):

```typescript
// In index.ts
world.simulation.enableDebugRendering(true);
```

### Hot Reload

The Hytopia dev server automatically reloads when you save files!

---

## 📊 Player Progression

### XP System

Players earn XP for:
- **Match completion:** +100 XP
- **Perfect hit:** +10 XP per hit
- **Good hit:** +5 XP per hit
- **Round survived:** +25 XP
- **Match win:** +500 XP

### Rizz Ranks

- **Bronze:** 0-1,000 XP
- **Silver:** 1,000-5,000 XP
- **Gold:** 5,000-15,000 XP
- **Certified 6-7:** 15,000-50,000 XP
- **Meme Lord:** 50,000+ XP

All progression is automatically saved using Hytopia's built-in persistence!

---

## 🎯 Roadmap

### MVP (Current) ✅
- [x] Platform 6/7 jumping mechanic
- [x] Beat timing validation
- [x] Round-based elimination
- [x] Leaderboard
- [x] Player progression (XP/levels)
- [x] Mobile support

### Phase 2 (Next)
- [ ] Add actual "6-7" audio (with proper licensing)
- [ ] Platform visual effects (glowing, particles)
- [ ] Emote on beat micro-game
- [ ] Boss round finale
- [ ] Daily challenges

### Phase 3 (Future)
- [ ] Cosmetics integration (Hytopia Marketplace)
- [ ] Seasonal events
- [ ] Multiple audio tracks
- [ ] Spectator camera improvements

---

## 🐛 Known Issues

1. **No audio file included** - You must add your own (see above)
2. **Platform textures missing** - Currently using default Hytopia blocks
3. **Network latency** - Timing windows may need adjustment based on player ping

### Reporting Bugs

Please report issues with:
- Clear description
- Steps to reproduce
- Browser/device info

---

## 🤝 Contributing

Want to improve the game? Here's how:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request!

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Credits

- **Built with:** [Hytopia SDK](https://dev.hytopia.com/)
- **Inspired by:** The viral "6-7" TikTok audio trend
- **Developer:** Chris Campbell

### Resources

- [Hytopia Documentation](https://dev.hytopia.com/)
- [Hytopia Discord](https://discord.gg/hytopia)
- [Hytopia SDK GitHub](https://github.com/hytopiagg/sdk)

---

## 🚨 Important Notes

### Audio Licensing

⚠️ **The "6-7" audio is copyrighted!** If you plan to publish this game:
- Use a royalty-free remix
- Get permission from the original creator
- Or partner with the TikTok creator for revenue share

### Hytopia Marketplace (Nov 2025)

This game is ready for Hytopia's upcoming marketplace:
- 85% creator revenue split
- Cosmetic items integration ready
- Player progression already implemented

---

## 💬 Support

Need help?
- Check the [Hytopia Docs](https://dev.hytopia.com/)
- Join the [Hytopia Discord](https://discord.gg/hytopia)
- Review the code comments (extensive!)

---

**Ready to ship this?** 🚀

1. Add the audio file
2. Run `npm run dev`
3. Test with friends
4. Deploy to Hytopia!

---

Made with 💚 using Hytopia
