# 🎵 Audio Timing Sync Guide

**How to create perfectly-synced beat timing files for 6-7 Battleground**

This guide will walk you through syncing any "6-7" audio variation to create the JSON timing files needed by the game.

---

## 📋 What You'll Need

1. **Audacity** (free audio editor) - [Download here](https://www.audacityteam.org/)
2. **Python 3** (for running the converter script) - [Download here](https://www.python.org/downloads/)
3. Your audio file (MP3 format, 30 seconds, with "six" and "seven" spoken on beats)

---

## 🎯 Step-by-Step Process

### **Step 1: Install Audacity**

1. Download Audacity from https://www.audacityteam.org/
2. Install with default settings
3. Launch Audacity

---

### **Step 2: Load Your Audio File**

1. In Audacity, go to **File → Open**
2. Select your audio file (e.g., `six_seven_hype.mp3`)
3. The waveform will appear - this is a visual representation of your sound

**What you're looking for:**
- **Peaks** (tall spikes) = Where "SIX" or "SEVEN" is spoken
- **Valleys** (flat areas) = Silence between words

---

### **Step 3: Zoom In to See Beats Clearly**

1. Use **Ctrl + Mouse Wheel** to zoom in
2. Zoom until you can see individual "six" and "seven" waveforms clearly
3. You want to be able to pinpoint the exact start of each word

**Pro Tip:** Look for the sudden rise in the waveform - that's where the beat starts!

![Example of zoomed waveform - you'll see clear spikes where words begin]

---

### **Step 4: Mark Each Beat with Labels**

This is the most important step! You'll add a label at each beat point.

**For each "six" or "seven" in your audio:**

1. **Click** at the exact start of the waveform spike (where the word begins)
2. Press **Ctrl + B** (or Edit → Labels → Add Label at Selection)
3. Type either `six` or `seven` (lowercase, exactly as spelled)
4. Press **Enter** to save the label

**Repeat for all 60 beats!**

**Tips:**
- Use **Spacebar** to play/pause audio while marking
- Use **Arrow Keys** to move the cursor precisely
- Press **Ctrl + 1** to zoom to selection if you need to fine-tune
- Labels should be EXACTLY at the start of the sound, not in the middle

**Common Mistakes:**
- ❌ Putting label in the middle of the word
- ❌ Typing "Six" or "Seven" (capital letters - use lowercase!)
- ❌ Misspelling "six" or "seven"
- ✅ Label at the very beginning of the waveform spike
- ✅ Lowercase "six" and "seven"

---

### **Step 5: Verify Your Labels**

Before exporting, double-check:

1. **Count your labels:** You should have ~60 labels (30 seconds at 120 BPM = 60 beats)
2. **Check spelling:** All labels should be lowercase "six" or "seven"
3. **Check pattern:** Labels should alternate or follow the audio pattern
4. **Play through:** Press Spacebar to play audio and watch labels highlight

---

### **Step 6: Export Labels**

1. Go to **File → Export → Export Labels**
2. Save as: `six_seven_hype_labels.txt` (or whatever you named your track)
3. Choose a location you'll remember (e.g., Desktop or Downloads)

**What the exported file looks like:**
```
0.000000	0.000000	six
0.500000	0.500000	seven
1.000000	1.000000	six
1.500000	1.500000	seven
```

Each line has:
- **First number:** Start time in seconds
- **Second number:** End time (same as start for point labels)
- **Third value:** The label text ("six" or "seven")

---

### **Step 7: Convert Labels to Game JSON**

Now we'll use the Python script to convert Audacity's format to the game's JSON format.

1. Open **Command Prompt** (Windows) or **Terminal** (Mac/Linux)
2. Navigate to your project folder:
   ```bash
   cd C:\Users\chris\Six-Seven
   ```

3. Run the converter script:
   ```bash
   python tools/audacity_to_json.py path/to/six_seven_hype_labels.txt six_seven_hype.json
   ```

   **Example:**
   ```bash
   python tools/audacity_to_json.py C:\Users\chris\Desktop\six_seven_hype_labels.txt six_seven_hype.json
   ```

4. The script will ask you to confirm the track ID and name:
   ```
   Default track ID: six_seven_hype
   Default track name: Six Seven Hype

   Enter custom track ID (or press Enter to keep default):
   Enter custom track name (or press Enter to keep default):
   ```

   Press **Enter** to accept defaults, or type custom values.

5. You'll see output like:
   ```
   ✅ Success! Created 'six_seven_hype.json'

   Summary:
     Track ID: six_seven_hype
     Track Name: Six Seven Hype
     BPM: 120
     Total Beats: 60
     Duration: 30.0 seconds
   ```

---

### **Step 8: Add to Your Game**

1. **Copy the JSON file** to your game's beat timings folder:
   ```bash
   copy six_seven_hype.json assets\audio\beat_timings\
   ```

2. **Copy your audio file** to the audio folder:
   ```bash
   copy six_seven_hype.mp3 assets\audio\
   ```

3. **Update `gameConfig.ts`** to include your new track:

   Open `gameConfig.ts` and find the `AUDIO_TRACKS` array. Add your track:

   ```typescript
   export const AUDIO_TRACKS: AudioTrack[] = [
     {
       id: 'six_seven_original',
       name: '6-7 Original',
       uri: 'audio/six_seven_original.mp3',
       beatTimingsUri: 'audio/beat_timings/six_seven_original.json',
       durationMs: 30000
     },
     // 👇 ADD YOUR NEW TRACK HERE
     {
       id: 'six_seven_hype',
       name: '6-7 Hype',
       uri: 'audio/six_seven_hype.mp3',
       beatTimingsUri: 'audio/beat_timings/six_seven_hype.json',
       durationMs: 30000
     }
   ];
   ```

---

### **Step 9: Test In-Game**

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Join the game with 2 players

3. Play a match and **listen carefully**:
   - Do the platform highlights appear RIGHT when you hear "six" or "seven"?
   - Does it feel perfectly synced?
   - Are you able to hit PERFECT timing consistently?

**If timing feels off:**
- The beats might be marked too early or too late
- Go back to Audacity and adjust the label positions
- Re-export and re-convert
- Test again

---

## 🎯 Tips for Perfect Timing

### **Finding the Exact Beat Start**

The beat starts at the **attack** (initial spike) of the waveform, not the peak.

```
      Peak
       ↓
      /\
     /  \
    /    \___
   /
  ↑
Attack (mark HERE!)
```

**Mark your label at the attack, where the waveform first starts rising.**

---

### **Consistent Rhythm**

If your audio has a consistent beat (like 120 BPM):
- Beats should be evenly spaced (every 500ms for 120 BPM)
- Use this to verify your labels are correct
- If one label seems off, compare its spacing to neighbors

**Formula:**
```
Interval (ms) = 60,000 / BPM

Example: 60,000 / 120 BPM = 500ms between beats
```

---

### **Handling Variations**

Some audio tracks have slight tempo variations or swing. That's OK!

- Mark beats exactly as you hear them
- Don't force them to be evenly spaced if they're not
- The game will validate against your exact timestamps

---

## 🔧 Troubleshooting

### **Problem: "Found 0 beats" when running converter**

**Solution:** Check your labels file:
- Make sure labels are spelled "six" or "seven" (lowercase)
- Ensure the file isn't empty
- Try opening the .txt file in Notepad to verify format

---

### **Problem: Timing feels off in-game**

**Common causes:**
1. **Network latency** - 50-150ms is normal
2. **Labels marked at peak instead of attack** - Move labels earlier
3. **Audio file is compressed differently** - Use same MP3 you labeled

**How to fix:**
- Test with localhost (no network lag)
- Re-mark beats in Audacity, focusing on attack points
- Use high-quality MP3 (320 kbps)

---

### **Problem: Some beats are missed**

**Check:**
- Do you have 60 labels? (Count in Audacity: Analyze → Label Sounds)
- Are all labels spelled correctly?
- Are there any duplicate timestamps?

---

### **Problem: Python script won't run**

**Make sure Python is installed:**
```bash
python --version
```

If not installed, download from https://www.python.org/downloads/

**On Windows, you might need to use:**
```bash
python3 tools/audacity_to_json.py ...
```
or
```bash
py tools/audacity_to_json.py ...
```

---

## 📊 Expected Results

For a 30-second "6-7" audio track at 120 BPM:

- **Total beats:** 60 (2 per second × 30 seconds)
- **Beat interval:** 500ms (consistent)
- **First beat:** Usually at 0ms or within first 100ms
- **Last beat:** Around 29,500ms

**Example output JSON:**
```json
{
  "id": "six_seven_hype",
  "name": "6-7 Hype",
  "bpm": 120,
  "beatTimes": [0, 500, 1000, 1500, ..., 29500],
  "markers": ["six", "seven", "six", "seven", ...]
}
```

---

## 🚀 Advanced Tips

### **Batch Processing Multiple Tracks**

Create a batch script to convert multiple label files:

**Windows (batch.bat):**
```batch
@echo off
python tools/audacity_to_json.py labels/hype_labels.txt output/hype.json
python tools/audacity_to_json.py labels/chill_labels.txt output/chill.json
python tools/audacity_to_json.py labels/deep_labels.txt output/deep.json
python tools/audacity_to_json.py labels/chipmunk_labels.txt output/chipmunk.json
echo Done!
```

---

### **Using Audacity's Beat Finder (Experimental)**

Audacity has an automatic beat detector:

1. Select your audio
2. Go to **Analyze → Beat Finder**
3. Adjust threshold until it finds beats correctly
4. **WARNING:** This is hit-or-miss for speech. Manual labeling is more accurate.

---

### **Checking Your Work with Playback**

In Audacity:
1. **View → Toolbars → Transport Toolbar** (if not visible)
2. Press **Spacebar** to play
3. Watch the playback cursor - it should cross each label exactly when you hear the beat
4. If labels are early/late, adjust and re-export

---

## ✅ Final Checklist

Before considering a track "done":

- [ ] Audio file is MP3, 30 seconds, good quality
- [ ] All 60 beats labeled in Audacity
- [ ] Labels are lowercase "six" or "seven" only
- [ ] Labels exported to .txt file
- [ ] Converted to JSON using Python script
- [ ] JSON copied to `assets/audio/beat_timings/`
- [ ] Audio copied to `assets/audio/`
- [ ] Track added to `gameConfig.ts`
- [ ] Tested in-game with 2+ players
- [ ] Timing feels perfect (can hit PERFECT consistently)

---

## 🎓 Learning Resources

**Audacity Tutorials:**
- Official Manual: https://manual.audacityteam.org/
- Labeling Guide: https://manual.audacityteam.org/man/label_tracks.html

**Understanding Waveforms:**
- What waveforms show: https://www.youtube.com/watch?v=qNf9nzvnd1k
- Finding beats visually: https://www.youtube.com/watch?v=QCrNpzC0qXM

**BPM & Rhythm:**
- BPM Calculator: https://www.all8.com/tools/bpm.htm
- Understanding musical timing: https://www.musictheory.net/lessons/12

---

## 💬 Need Help?

If you're stuck:

1. **Check the troubleshooting section** above
2. **Test with the original track** - If `six_seven_original.json` works but yours doesn't, compare the JSON files
3. **Verify in Audacity** - Play through with labels visible
4. **Check your exports** - Open the .txt file in Notepad to verify format

---

## 🎉 You're Done!

Once you've completed all steps, your custom audio track is ready to ship in V1.1!

**Repeat this process for each of your 4 voice variations:**
1. six_seven_hype
2. six_seven_chill
3. six_seven_deep
4. six_seven_chipmunk

Happy syncing! 🎵
