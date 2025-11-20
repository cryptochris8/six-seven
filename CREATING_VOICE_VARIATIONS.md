# 🎤 Creating Voice Variations - ElevenLabs Guide

This guide shows you how to create different voice variations for the 6-7 Meme Battleground game using ElevenLabs and Audacity.

---

## 🔄 Complete Workflow

### For Each New Voice:

1. ✅ **Record in ElevenLabs** with suggested voice/settings
2. ✅ **Export as MP3**
3. ✅ **Open in Audacity** and apply any additional effects (if needed)
4. ✅ **Trim to single phrase** (2-5 seconds)
5. ✅ **Label "six" and "seven"** positions (Ctrl+B)
6. ✅ **Export labels** (File → Export → Export Labels)
7. ✅ **Give Claude the files** (MP3 + labels + duration)
8. ✅ **Claude creates JSON timing file**
9. ✅ **Create 30-second version** by pasting at intervals
10. ✅ **Test and fine-tune** timing if needed

---

## 🎭 Top 5 Recommended Voice Variations

### 1. Sigma Male (Deep Motivational)

**Record yourself saying:**
```
"SIIIIXXX... SEVENNNN"
```
(Speak confidently, slowly, with dramatic pauses)

**ElevenLabs Settings:**
- **Voice:** Choose a deep male voice (like "Josh" or "Adam")
- **Stability:** 70-80% (for dramatic emphasis)
- **Clarity:** 60-70%
- **Style:** Serious, authoritative tone
- **Export as:** `six_seven_sigma.mp3`

**Tips:**
- Really drag out the words
- Pause between six and seven for dramatic effect
- Imagine you're giving a motivational speech

---

### 2. Slowed + Reverb (Phonk Style)

**Record yourself saying:**
```
"Siiiixxxxxx... Seeeevvvennnn"
```
(Normal pace, clear pronunciation)

**ElevenLabs Settings:**
- **Voice:** Any neutral voice
- **After recording in ElevenLabs:**
  - In Audacity: **Effect → Change Tempo → -30%** (slow it down)
  - **Effect → Reverb** → Large room preset
- **Export as:** `six_seven_phonk.mp3`

**Tips:**
- Record normally in ElevenLabs
- Apply slow + reverb effects in Audacity AFTER
- The dramatic echo is key!

---

### 3. Brainrot TTS (TikTok AI Voice)

**Record yourself saying:**
```
"Six. Seven."
```
(Monotone, robotic, no emotion)

**ElevenLabs Settings:**
- **Voice:** Use "Brian" or most robotic-sounding voice
- **Stability:** 100% (no variation)
- **Clarity:** 100% (crystal clear)
- **Style:** Completely flat, no emotion
- **Export as:** `six_seven_tts.mp3`

**Tips:**
- Speak like a GPS navigation system
- Zero emotion, pure monotone
- Short pauses between words

---

### 4. Sped Up 2x (Nightcore/Chaotic)

**Record yourself saying:**
```
"Six-Six-Seven-Seven-Six"
```
(Speak at normal or slightly slow pace with clear enunciation)

**ElevenLabs Settings:**
- **Voice:** Any energetic voice
- **After recording:**
  - In Audacity: **Effect → Change Tempo → +50% to +100%** (speed up)
- **Export as:** `six_seven_fast.mp3`

**Tips:**
- Record SLOWER in ElevenLabs (you'll speed it up later)
- Clear pronunciation is key (gets muddy when sped up)
- Speed it up in Audacity after export

---

### 5. Demonic Bass Boost (Scary/Deep)

**Record yourself saying:**
```
"SIIIXXXXX... SSSEEEEVVVEEENNN"
```
(Draw out the S sounds, speak menacingly)

**ElevenLabs Settings:**
- **Voice:** Deepest male voice available
- **After recording in ElevenLabs:**
  - In Audacity: **Effect → Bass Boost → +15dB**
  - **Effect → Change Pitch → -4 semitones** (make it even deeper)
  - Optional: **Effect → Distortion → Light** for extra demonic effect
- **Export as:** `six_seven_demon.mp3`

**Tips:**
- Emphasize the "S" sounds (hissing)
- Speak slowly and menacingly
- Apply heavy bass boost in Audacity

---

## 🎨 More Voice Ideas

### Trending/Viral Voices:
- **Sigma Male** - Deep, dramatic motivational
- **Brainrot TTS** - Monotone AI (TikTok style)
- **Sped Up** - Nightcore/chaotic energy
- **Slowed + Reverb** - Phonk/drift edits
- **Skibidi Toilet** - Distorted, bass-boosted

### Classic Meme Voices:
- **Mario/Luigi** - "It's-a SIX! SEVEN!"
- **UwU Anime Girl** - "Siwx~ Sewven~"
- **British Chav** - "SIKHS! SEVEN INNIT!"
- **Demonic** - Extremely deep, ear-rape
- **Old-Timey Radio** - 1920s newsreel

### Character Voices:
- **Darth Vader** - "Six... *breathing* ...Seven"
- **Yoda** - "Six, it is. Seven, there is."
- **Kermit** - High-pitched silly
- **Morgan Freeman** - Smooth narrator
- **Donald Duck** - Unintelligible chaos

### Effects/Styles:
- **Auto-Tuned/T-Pain** - Melodic
- **Metal Screaming** - Death metal growls
- **Whisper ASMR** - Creepy soft
- **Vocoder/Robot** - Daft Punk vibes
- **Drunk/Slurred** - Comedy gold

---

## 📝 Audacity Quick Reference

### Essential Shortcuts:
- **Ctrl + B** - Add label at cursor
- **Ctrl + A** - Select all
- **Ctrl + C** - Copy
- **Ctrl + V** - Paste
- **Spacebar** - Play/Pause
- **Ctrl + 1** - Zoom in
- **Ctrl + 3** - Zoom out

### Common Effects:
- **Effect → Change Tempo** - Speed up/slow down (no pitch change)
- **Effect → Change Pitch** - Make higher/lower
- **Effect → Reverb** - Add echo/space
- **Effect → Bass Boost** - Increase low frequencies
- **Effect → Distortion** - Add grunge/demonic effect
- **Effect → Normalize** - Balance volume

### Export:
- **File → Export → Export Audio** - Save as MP3
- **File → Export → Export Labels** - Save timing labels

---

## 🎯 What to Give Claude:

For each voice variation:
1. Path to the short MP3 file
2. Path to the labels .txt file
3. Total duration (e.g., "3 seconds")
4. Name for the track (e.g., "six_seven_sigma")

**Example:**
```
C:\Users\chris\Six-Seven\assets\audio\six_seven_sigma_short.mp3
C:\Users\chris\Six-Seven\assets\audio\Labels sigma.txt
2.5 seconds
six_seven_sigma
```

---

## ✅ Testing Checklist:

After creating each track:
- [ ] Audio file is 30 seconds
- [ ] JSON timing file created
- [ ] Added to gameConfig.ts
- [ ] Cache cleared (delete gameConfig.js and index.mjs)
- [ ] Server restarted
- [ ] Timing tested in-game
- [ ] Adjustments made if needed (±50-100ms)

---

## 🚀 Batch Processing Tips:

**Create Multiple at Once:**
1. Record all 5 voices in ElevenLabs
2. Apply Audacity effects to all
3. Trim and label all short clips
4. Give Claude all files at once
5. Create all 30-second versions
6. Test all tracks together

**Efficient labeling:**
- Open all short clips in separate Audacity windows
- Label them one after another
- Export all labels
- Process in batch

---

## 🎵 File Naming Convention:

**Short clips:** `six_seven_[style]_short.mp3`
- Example: `six_seven_sigma_short.mp3`

**Labels:** `Labels [style].txt`
- Example: `Labels sigma.txt`

**Final 30-second:** `six_seven_[style].mp3`
- Example: `six_seven_sigma.mp3`

**JSON timing:** `six_seven_[style].json`
- Example: `six_seven_sigma.json`

---

## 💡 Pro Tips:

1. **Save your voice** - Don't strain! Take breaks between recordings
2. **Test in isolation** - Comment out other tracks when testing new ones
3. **Version control** - Keep your short clips! You can re-create 30-second versions anytime
4. **Backup labels** - Save label files in case you need to adjust timing
5. **Listen first** - Play the full 30-second version before exporting

---

## 🎮 Currently Working Tracks:

- ✅ **six_seven1** (Meme Voice) - Perfect sync at 1349ms
- ✅ **six_seven_chipmunk** - Perfect sync

---

Happy voice creating! 🎤✨
