# 🎵 Syncing Audio Track Timings - 6-7 Battleground

This guide helps you create perfect beat timing data for each audio track to ensure platform indicators sync perfectly with the audio.

---

## 🎯 The Problem

The **Original** track syncs perfectly, but the new tracks (Hype, Chill, Deep, Chipmunk) may have timing drift because:
- Each ElevenLabs voice has different speech patterns
- Words start at slightly different times
- Spacing between "SIX" and "SEVEN" varies by voice

Currently, all tracks use the **same timing data** (copied from original), which causes misalignment.

---

## ✅ Solution: Create Custom Timing Data Per Track

We need to analyze each audio file and create accurate beat timing JSON files.

---

## 📊 Method 1: Using Audacity (Most Accurate)

### **Step 1: Open Your Audio File**

1. Open **Audacity**
2. **File → Open** → Select `assets/audio/six_seven_hype.mp3` (or whichever track you're analyzing)
3. The waveform will appear

### **Step 2: Add Labels at Each Beat**

1. **Zoom in** for precision:
   - Use **Ctrl+1** multiple times to zoom in on the waveform
   - You should see clear spikes where each word is spoken

2. **Play the audio** (Spacebar) and listen for each word

3. **Find the exact start of each "SIX" or "SEVEN":**
   - Look for the visual spike in the waveform
   - Click at the **exact start** of the spike (before the word begins)
   - The spike represents the audio energy of the word

4. **Add a label:**
   - Press **Ctrl+B** to add a label at your cursor position
   - Type either `six` or `seven` in the label
   - Press **Enter**

5. **Repeat** for all ~60 beats in the 30-second track

**Visual Guide:**
```
Waveform:     ___/‾‾‾\___  ___/‾‾‾\___  ___/‾‾‾\___
Label Position:   ↑            ↑            ↑
              (click here)  (click here)  (click here)
Labels:        "six"        "seven"       "six"
```

### **Step 3: Export Labels**

1. Once all beats are labeled: **File → Export → Export Labels**
2. Save as: `six_seven_hype_labels.txt` (or whatever track you're working on)
3. This creates a text file with timestamps

### **Step 4: Convert to JSON Format**

The exported file looks like this:
```
0.500000	0.500000	six
1.000000	1.000000	seven
1.500000	1.500000	six
2.000000	2.000000	seven
```

You need to convert this to milliseconds and create a JSON file.

**Use this template** for `assets/audio/beat_timings/six_seven_hype.json`:

```json
{
  "id": "six_seven_hype",
  "name": "6-7 Hype Beast",
  "bpm": 120,
  "beatTimes": [
    500,    // First timestamp * 1000 (convert seconds to ms)
    1000,   // Second timestamp * 1000
    1500,   // Third timestamp * 1000
    2000    // And so on...
    // Add all timestamps here
  ],
  "markers": [
    "six",    // Matches first beatTime
    "seven",  // Matches second beatTime
    "six",    // Matches third beatTime
    "seven"   // And so on...
    // Must have same length as beatTimes!
  ]
}
```

**Conversion:**
- Seconds to milliseconds: multiply by 1000
- Example: `0.500000` → `500`
- Example: `1.234567` → `1235` (round to nearest ms)

---

## ⚡ Method 2: Quick Offset Adjustment (Faster But Less Accurate)

If all tracks are off by roughly the **same amount**, you can apply a timing offset.

### **Step 1: Test and Measure**

Play several rounds and note for each track:
- **Track name:** (Hype, Chill, Deep, Chipmunk)
- **Early or Late?** (Are indicators before or after the audio?)
- **By how much?** (Rough estimate: 50ms, 100ms, 200ms, etc.)

Example test results:
```
✅ Original: Perfect sync
⚠️ Hype: ~150ms LATE (indicators show after you hear the word)
⚠️ Chill: ~100ms LATE
⚠️ Deep: ~200ms LATE
⚠️ Chipmunk: ~50ms LATE
```

### **Step 2: Adjust JSON Timing Files**

For each track that's off, modify its JSON file:

**If indicators are LATE (most common):**
Subtract the offset from all beatTimes:

```json
{
  "beatTimes": [
    350,   // Was 500, now 500 - 150 = 350 (150ms earlier)
    850,   // Was 1000, now 1000 - 150 = 850
    1350,  // Was 1500, now 1500 - 150 = 1350
    // ... adjust all times
  ]
}
```

**If indicators are EARLY (rare):**
Add the offset to all beatTimes:

```json
{
  "beatTimes": [
    600,   // Was 500, now 500 + 100 = 600 (100ms later)
    1100,  // Was 1000, now 1000 + 100 = 1100
    1600,  // Was 1500, now 1500 + 100 = 1600
    // ... adjust all times
  ]
}
```

---

## 🧪 Method 3: Use Online Beat Detection Tools

Some online tools can auto-detect beats:

1. **Upload your MP3** to a beat detection tool:
   - [Sonic Visualiser](https://www.sonicvisualiser.org/) (free desktop app)
   - Online beat detectors (search "beat detection tool")

2. **Export beat timestamps**

3. **Convert to JSON** (same as Method 1, Step 4)

---

## 🎮 Testing Your Changes

After adjusting timing files:

1. **Restart the server:** `hytopia start`
2. **Play multiple rounds** with different tracks
3. **Watch platform indicators** vs. when you hear the words
4. **Fine-tune** by adjusting beatTimes up/down by 50ms increments

**Perfect sync = Platform lights up RIGHT as you hear the word**

---

## 📝 Recommended Workflow

**For each track (Hype, Chill, Deep, Chipmunk):**

1. ✅ Open in Audacity
2. ✅ Add labels at each beat (use zoom and waveform visual)
3. ✅ Export labels to text file
4. ✅ Convert to JSON (multiply by 1000 for milliseconds)
5. ✅ Replace the track's JSON file in `assets/audio/beat_timings/`
6. ✅ Test in-game
7. ✅ Fine-tune if needed (adjust times by ±50ms)

---

## 🔧 Quick Reference: File Locations

**Audio files:**
```
assets/audio/six_seven_original.mp3
assets/audio/six_seven_hype.mp3
assets/audio/six_seven_chill.mp3
assets/audio/six_seven_deep.mp3
assets/audio/six_seven_chipmunk.mp3
```

**Timing JSON files:**
```
assets/audio/beat_timings/six_seven_original.json  ✅ PERFECT (reference this!)
assets/audio/beat_timings/six_seven_hype.json      ⚠️ Needs adjustment
assets/audio/beat_timings/six_seven_chill.json     ⚠️ Needs adjustment
assets/audio/beat_timings/six_seven_deep.json      ⚠️ Needs adjustment
assets/audio/beat_timings/six_seven_chipmunk.json  ⚠️ Needs adjustment
```

---

## 💡 Pro Tips

### **Use the Original as Reference**
Listen to `six_seven_original.mp3` side-by-side with new tracks to hear timing differences.

### **Check First 5 Beats Only**
If the first 5 beats are off by the same amount, likely ALL beats are off by that amount. Quick offset fix will work!

### **Round to Nearest 50ms**
Beat timings don't need to be hyper-precise. Round to nearest 50ms for cleaner JSON:
- `1247ms` → `1250ms`
- `2891ms` → `2900ms`

### **Markers Must Match beatTimes Length**
Every beatTime needs a corresponding marker ("six" or "seven"). Count must be identical!

---

## 🎯 Goal

**Perfect sync = Players see platform light up EXACTLY when they hear "SIX" or "SEVEN"**

This is critical for fair gameplay - players need visual and audio cues to align perfectly for accurate timing!

---

## ❓ Need Help?

If you get stuck:
1. Share the exported Audacity labels file
2. I can convert it to JSON format for you
3. Or share your test results (which tracks are early/late and by how much)

Good luck! 🎵
