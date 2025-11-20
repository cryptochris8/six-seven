#!/usr/bin/env python3
"""
Create Perfectly Synced 6-7 Audio Track
========================================

This script takes a single "six-seven" audio clip and repeats it at exact
intervals to create a perfectly-timed 30-second track.

Requirements:
    pip install pydub

Usage:
    python create_synced_audio.py input_phrase.mp3 output_track.mp3

The script will:
1. Load your "six-seven" phrase audio
2. Create a 30-second blank track
3. Place the phrase at exact 2-second intervals (500ms per beat × 4 beats)
4. Export as MP3 with perfect timing
"""

from pydub import AudioSegment
from pydub.generators import Sine
import sys
import os


def create_synced_track(input_phrase_path: str, output_path: str,
                       phrase_interval_ms: int = 2000,
                       total_duration_ms: int = 30000):
    """
    Create a perfectly synced audio track by repeating a phrase.

    Args:
        input_phrase_path: Path to the "six-seven" phrase audio file
        output_path: Where to save the output MP3
        phrase_interval_ms: Milliseconds between each phrase start (default: 2000ms = 2 seconds)
        total_duration_ms: Total track length in milliseconds (default: 30000ms = 30 seconds)
    """

    print(f"Loading phrase from: {input_phrase_path}")

    # Load the phrase
    phrase = AudioSegment.from_file(input_phrase_path)
    phrase_duration_ms = len(phrase)

    print(f"  Phrase duration: {phrase_duration_ms}ms ({phrase_duration_ms/1000:.2f} seconds)")

    # Create silent base track
    print(f"\nCreating {total_duration_ms/1000} second base track...")
    base_track = AudioSegment.silent(duration=total_duration_ms)

    # Calculate how many repetitions we can fit
    num_repetitions = (total_duration_ms - phrase_duration_ms) // phrase_interval_ms + 1

    print(f"Placing phrase at {num_repetitions} positions:")

    # Overlay the phrase at exact intervals
    positions = []
    for i in range(num_repetitions):
        position_ms = i * phrase_interval_ms

        # Don't exceed track duration
        if position_ms + phrase_duration_ms > total_duration_ms:
            print(f"  Skipping position {position_ms}ms (would exceed track duration)")
            break

        positions.append(position_ms)
        print(f"  {i+1}. Position: {position_ms}ms ({position_ms/1000:.2f}s)")

        # Overlay phrase at this position
        base_track = base_track.overlay(phrase, position=position_ms)

    # Export
    print(f"\nExporting to: {output_path}")
    base_track.export(output_path, format="mp3", bitrate="320k")

    print(f"\n✅ Success! Created perfectly-synced track:")
    print(f"   Duration: {total_duration_ms/1000}s")
    print(f"   Repetitions: {len(positions)}")
    print(f"   Interval: {phrase_interval_ms}ms ({phrase_interval_ms/1000}s)")
    print(f"\nNext steps:")
    print(f"1. Listen to {output_path} to verify timing")
    print(f"2. Create beat timing JSON with these exact positions")
    print(f"3. Copy to assets/audio/ folder")

    # Generate beat timing data for reference
    print(f"\n📊 Beat timing positions for JSON:")
    print(f"   Phrase repetitions: {positions}")

    return positions


def generate_beat_timing_json(positions: list, output_json_path: str):
    """
    Generate the beat timing JSON file to match the audio.

    Args:
        positions: List of phrase start positions in milliseconds
        output_json_path: Where to save the JSON file
    """
    import json

    # Each phrase has 4 beats at 500ms intervals
    # If phrase starts at position X:
    #   Beat 1 (six): X + 0ms
    #   Beat 2 (six): X + 500ms
    #   Beat 3 (seven): X + 1000ms
    #   Beat 4 (seven): X + 1500ms

    beat_times = []
    markers = []

    pattern = ["six", "six", "seven", "seven"]  # 6-6-7-7 pattern

    for pos in positions:
        for i, marker in enumerate(pattern):
            beat_time = pos + (i * 500)  # Each beat is 500ms apart
            beat_times.append(beat_time)
            markers.append(marker)

    timing_data = {
        "id": "six_seven_original_synced",
        "name": "6-7 Original (Perfect Sync)",
        "bpm": 120,
        "beatTimes": beat_times,
        "markers": markers
    }

    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(timing_data, f, indent=2)

    print(f"\n✅ Created beat timing JSON: {output_json_path}")
    print(f"   Total beats: {len(beat_times)}")
    print(f"   Duration: {beat_times[-1]/1000:.1f}s")


def main():
    if len(sys.argv) != 3:
        print("Usage: python create_synced_audio.py input_phrase.mp3 output_track.mp3")
        print("\nExample:")
        print("  python create_synced_audio.py my_six_seven.mp3 six_seven_original_synced.mp3")
        print("\nThis will create:")
        print("  - six_seven_original_synced.mp3 (the audio track)")
        print("  - six_seven_original_synced.json (the beat timing data)")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    # Validate input exists
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' not found!")
        sys.exit(1)

    # Create the audio track
    positions = create_synced_track(input_file, output_file)

    # Generate matching JSON
    json_output = output_file.replace('.mp3', '.json')
    generate_beat_timing_json(positions, json_output)

    print(f"\n🎉 All done! Your perfectly synced track is ready.")
    print(f"\nTo use in game:")
    print(f"1. Copy {output_file} to assets/audio/")
    print(f"2. Copy {json_output} to assets/audio/beat_timings/")
    print(f"3. Update gameConfig.ts to reference the new track")


if __name__ == '__main__':
    main()
