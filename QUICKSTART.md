# 🚀 QUICKSTART - Get Playing in 2 Minutes!

## Step 1: Add Audio File (REQUIRED)

The game needs an audio file to work. For quick testing, you can use ANY 30-second MP3 file!

1. **Find any 30-second audio file** (or trim a song)
2. **Rename it to:** `six_seven_v1.mp3`
3. **Place it here:** `assets/audio/six_seven_v1.mp3`

> 💡 **Pro Tip:** Search YouTube for "6 7 audio meme" and use a YouTube-to-MP3 converter

---

## Step 2: Start the Server

```bash
npm run dev
```

Wait for this message:
```
✅ Server is running! Waiting for players...
```

---

## Step 3: Open the Game

**Browser:** `http://localhost:8080`

---

## Step 4: Play!

### Controls:
- **Move:** WASD
- **Jump:** SPACE
- **Sprint:** SHIFT
- **React to Beat:** Press `6` or `7` keys!

### How to Win:
1. Wait for 2 players (or open 2 browser tabs)
2. When countdown starts, get ready!
3. Press `6` or `7` on the beat
4. Survive 6 rounds to win!

---

## 🎮 Chat Commands

Type in chat:
- `/help` - Show instructions
- `/stats` - View your player stats
- `/rocket` - YEET yourself into the sky! 🚀

---

## 🐛 Troubleshooting

### Server won't start?
```bash
# Reinstall dependencies
npm install

# Try again
npm run dev
```

### Game crashes on start?
**Missing audio file!** Add `six_seven_v1.mp3` to `assets/audio/`

### No players showing up?
1. Make sure server is running
2. Check browser console for errors (F12)
3. Try refreshing the page

---

## 🌐 Test with Friends

1. **Start server in production mode:**
   ```bash
   npm run prod
   ```

2. **Start tunnel (in new terminal):**
   ```bash
   cloudflared tunnel --url http://localhost:8080
   ```

3. **Copy the tunnel URL** (e.g., `abc123.trycloudflare.com`)

4. **Share this link with friends:**
   ```
   https://hytopia.com/play?join=abc123.trycloudflare.com
   ```

---

## ⚙️ Configuration

Want to tweak the game?

**Edit `gameConfig.ts`:**
- Change timing windows (easier/harder)
- Adjust number of rounds
- Modify XP rewards
- Change player requirements

**Edit `assets/audio/beat_timings/six_seven_v1.json`:**
- Update beat times to match your audio
- Change "six"/"seven" patterns

---

## 📖 Full Documentation

See **README.md** for:
- Complete feature list
- Development guide
- Project structure
- Audio licensing info

---

## 🎯 Next Steps

1. ✅ Add proper "6-7" audio track
2. ✅ Test with friends
3. ✅ Customize game balance
4. ✅ Add platform textures (optional)
5. ✅ Deploy to Hytopia!

---

**Happy Gaming! 🎮**

Got it working? Type `/stats` in chat to see your progress!
