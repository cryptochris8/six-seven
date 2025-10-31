# 🎵 Adding New Audio Tracks - 6-7 Battleground

Your game now supports **multiple audio tracks** that randomly play each round! This guide shows you how to add more voice variations.

---

## 🎯 **Quick Overview**

Your game will randomly select a different voice/track for each round:
- Round 1: "6-7 Chill Vibes" (relaxed voice)
- Round 2: "6-7 Hype Beast" (excited voice)
- Round 3: "6-7 Deep Voice" (bass-boosted)
- And so on!

---

## 📁 **File Structure**

```
assets/audio/
├── six_seven_original.mp3       ← Your current track
├── six_seven_hype.mp3           ← Add these!
├── six_seven_chill.mp3
├── six_seven_deep.mp3
├── six_seven_chipmunk.mp3
└── beat_timings/
    ├── six_seven_original.json  ← Your current timing data
    ├── six_seven_hype.json      ← Create matching JSON files
    ├── six_seven_chill.json
    ├── six_seven_deep.json
    └── six_seven_chipmunk.json
```

---

## 🎤 **Step 1: Create Audio with ElevenLabs**

### **Track Ideas & Voice Settings:**

#### **1. "Hype Beast" (High Energy)**
**ElevenLabs Settings:**
- Voice: Josh / Adam / Antoni
- Stability: 30% (more variation)
- Similarity: 70%
- Speed: 1.2x faster
- **Script:** "Six! Seven! Six! Seven! Six! Seven! Six! Seven! Six! Seven!" (excited, fast)

#### **2. "Chill Vibes" (Relaxed)**
**ElevenLabs Settings:**
- Voice: Bella / Rachel
- Stability: 70% (smooth, consistent)
- Similarity: 80%
- Speed: 0.9x slower
- **Script:** "six... seven... six... seven..." (calm, drawn out)

#### **3. "Deep Voice" (Bass-Boosted)**
**ElevenLabs Settings:**
- Voice: Arnold / Josh (lower pitch)
- Stability: 50%
- Similarity: 70%
- Pitch: -2 to -4 semitones (use audio editor after)
- **Script:** "SIX. SEVEN. SIX. SEVEN." (commanding, deep)

#### **4. "Chipmunk" (High-Pitched, Funny)**
**ElevenLabs Settings:**
- Voice: Any voice
- Speed: Normal
- **Post-Processing:** Use Audacity/audio editor to pitch up +8 semitones
- **Script:** "six! seven! six! seven!" (fast, high energy)

#### **5. "Robot" (Monotone, Mechanical)**
**ElevenLabs Settings:**
- Voice: Sam (or custom voice with monotone)
- Stability: 90% (no variation)
- Similarity: 50%
- **Script:** "six. seven. six. seven." (robotic, no emotion)

---

## ⏱️ **Step 2: Generate Beat Timing Data**

### **Option A: Copy & Modify Existing**

Since your audio has the same pattern (6-7 repeated), you can copy your existing timing file:

```bash
# Copy the original timing file
cd C:\Users\chris\Six-Seven\assets\audio\beat_timings
copy six_seven_original.json six_seven_hype.json
```

Then edit `six_seven_hype.json` and change:
- `id`: `"six_seven_hype"`
- `name`: `"6-7 Hype Beast"`

**The beat times stay the same if your audio follows the same rhythm!**

### **Option B: Generate New Timings (If Rhythm Changes)**

If your new track has different timing, create a new JSON file:

```json
{
  "id": "six_seven_hype",
  "name": "6-7 Hype Beast",
  "bpm": 120,
  "beatTimes": [
    500, 1000, 1500, 2000, 2500, 3000, 3500, 4000,
    /* ... add all beat timestamps in milliseconds ... */
    29500
  ],
  "markers": [
    "six", "seven", "six", "seven", "six", "seven",
    /* ... must match beatTimes length ... */
    "seven"
  ]
}
```

**Pro Tip:** Use a tool like [Sonic Visualizer](https://www.sonicvisualiser.org/) to mark beat positions if they change!

---

## 🎮 **Step 3: Add Track to Game Config**

The system is **already configured**! Your tracks are defined in `gameConfig.ts`:

```typescript
export const AUDIO_TRACKS: AudioTrack[] = [
  {
    id: 'six_seven_original',
    name: '6-7 Original',
    uri: 'audio/six_seven_original.mp3',
    beatTimingsUri: 'audio/beat_timings/six_seven_original.json',
    durationMs: 30000
  },
  // Add more here...
];
```

The game will automatically use any tracks in this array!

---

## 🚀 **Step 4: Add Your New Tracks**

### **Example: Adding "Hype Beast"**

1. **Create audio** in ElevenLabs (high energy voice)
2. **Export as MP3**, name it `six_seven_hype.mp3`
3. **Place in** `assets/audio/`
4. **Copy timing file:**
   ```bash
   copy assets\audio\beat_timings\six_seven_original.json assets\audio\beat_timings\six_seven_hype.json
   ```
5. **Edit** `six_seven_hype.json`:
   - Change `id` to `"six_seven_hype"`
   - Change `name` to `"6-7 Hype Beast"`
6. **Done!** The track is already registered in `gameConfig.ts`

---

## 🎯 **Quick Add: 5 Tracks in 30 Minutes**

Here's how to add 5 variations quickly:

### **1. Create All Audio Files (15 minutes)**
- Open ElevenLabs
- Use same script: "Six! Seven! Six! Seven! ..." (repeat 30 times)
- Generate 5 versions:
  1. Hype (energetic male)
  2. Chill (relaxed female)
  3. Deep (low voice)
  4. Chipmunk (pitch up in audio editor)
  5. Robot (monotone)

### **2. Copy Timing Files (5 minutes)**
```bash
cd assets\audio\beat_timings
copy six_seven_original.json six_seven_hype.json
copy six_seven_original.json six_seven_chill.json
copy six_seven_original.json six_seven_deep.json
copy six_seven_original.json six_seven_chipmunk.json
```

### **3. Edit Each JSON File (10 minutes)**
Just change `id` and `name` in each file.

**Done!** You now have 6 tracks rotating randomly! 🎉

---

## 🎲 **Track Selection Modes**

In `gameConfig.ts`, you can change how tracks are selected:

```typescript
export const TRACK_SELECTION_MODE: TrackSelectionMode = 'random';
```

**Options:**
- `'random'` - Random track each round (default, most fun!)
- `'sequential'` - Round-robin (1, 2, 3, 4, 5, 1, 2...)
- `'vote'` - Players vote (not yet implemented)

---

## 🎨 **Creative Track Ideas**

### **Personality Tracks:**
- 😎 **"Swag Mode"** - Lazy, cool voice
- 😱 **"Panic Mode"** - Frantic, stressed voice
- 🤖 **"GLaDOS"** - Sarcastic AI voice
- 👴 **"Old Man"** - Slow, grumpy voice
- 🎭 **"Anime"** - Energetic anime girl voice

### **Themed Tracks:**
- 🎃 **"Halloween"** - Spooky, creepy voice
- 🎅 **"Christmas"** - Jolly, festive voice
- 🇫🇷 **"French"** - "Six! Sept! Six! Sept!"
- 🇪🇸 **"Spanish"** - "Seis! Siete! Seis! Siete!"
- 🗣️ **"Whisper"** - ASMR whisper (hilariously wrong for this game)

### **Meme Tracks:**
- 💀 **"Vine Boom"** - Add sound effects between numbers
- 🔊 **"Bass Boost"** - Ultra-distorted deep voice
- 🎵 **"Auto-Tune"** - Heavy vocal effects
- 📢 **"Sports Announcer"** - Over-the-top commentary

---

## 🔧 **Troubleshooting**

### **"Track not found" error:**
- Check file name matches exactly (case-sensitive!)
- Make sure file is in `assets/audio/`
- Verify JSON file exists in `assets/audio/beat_timings/`

### **"Wrong beat timing":**
- Open your JSON file and verify `beatTimes` array
- Make sure your audio file is exactly 30 seconds
- Check that `markers` array matches `beatTimes` length

### **"Same track every time":**
- Check `TRACK_SELECTION_MODE` in `gameConfig.ts`
- Make sure multiple tracks are uncommented in `AUDIO_TRACKS` array
- Restart server after changes

---

## 📊 **Test Your Tracks**

After adding new tracks:

1. **Restart server:** `hytopia start`
2. **Look for log:** `[6-7 BATTLEGROUND] 5 audio tracks available!`
3. **Play multiple rounds**
4. **Check logs:** `[6-7 BATTLEGROUND] Selected track: 6-7 Hype Beast`
5. **Verify different tracks play**

---

## 🎉 **You're Done!**

Your game now has **endless variety**! Players will love hearing different voices each round.

**Pro Tips:**
- Start with 3-5 tracks (manageable)
- Get player feedback on which voices they love/hate
- Add seasonal tracks for events
- Consider adding "rare" tracks (1% chance) for excitement

**Next Steps:**
- Create your ElevenLabs tracks
- Test them in game
- Share clips with different voices on TikTok!

---

**Questions?** Check the main README.md or join the Hytopia Discord!
