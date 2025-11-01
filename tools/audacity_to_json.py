#!/usr/bin/env python3
"""
Audacity Labels to Beat Timing JSON Converter
==============================================

This script converts Audacity label exports to the JSON format
required by the 6-7 Battleground game.

Usage:
    python audacity_to_json.py input_labels.txt output_timing.json

Input Format (Audacity labels):
    0.000000	0.000000	six
    0.500000	0.500000	seven
    1.000000	1.000000	six

Output Format (Game JSON):
    {
      "id": "six_seven_hype",
      "name": "6-7 Hype",
      "bpm": 120,
      "beatTimes": [0, 500, 1000, ...],
      "markers": ["six", "seven", "six", ...]
    }
"""

import json
import sys
import os
from typing import List, Tuple


def parse_audacity_labels(file_path: str) -> List[Tuple[float, str]]:
    """
    Parse Audacity label file.

    Args:
        file_path: Path to the Audacity labels .txt file

    Returns:
        List of (timestamp_seconds, label) tuples
    """
    beats = []

    with open(file_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue

            parts = line.split('\t')
            if len(parts) != 3:
                print(f"Warning: Line {line_num} has {len(parts)} parts, expected 3. Skipping.")
                continue

            try:
                start_time = float(parts[0])
                label = parts[2].strip().lower()

                # Validate label
                if label not in ['six', 'seven']:
                    print(f"Warning: Line {line_num} has invalid label '{label}'. Expected 'six' or 'seven'. Skipping.")
                    continue

                beats.append((start_time, label))

            except ValueError as e:
                print(f"Warning: Line {line_num} has invalid timestamp. Skipping. Error: {e}")
                continue

    return beats


def calculate_bpm(beat_times: List[float]) -> int:
    """
    Calculate BPM from beat times.

    Args:
        beat_times: List of beat timestamps in seconds

    Returns:
        Estimated BPM (beats per minute)
    """
    if len(beat_times) < 2:
        return 120  # Default BPM

    # Calculate average interval between beats
    intervals = []
    for i in range(1, len(beat_times)):
        interval = beat_times[i] - beat_times[i-1]
        intervals.append(interval)

    avg_interval = sum(intervals) / len(intervals)

    # Convert to BPM (60 seconds / interval between beats)
    bpm = round(60.0 / avg_interval)

    return bpm


def convert_to_json(beats: List[Tuple[float, str]], track_id: str, track_name: str) -> dict:
    """
    Convert beat data to game JSON format.

    Args:
        beats: List of (timestamp_seconds, label) tuples
        track_id: Unique ID for this track (e.g., 'six_seven_hype')
        track_name: Display name (e.g., '6-7 Hype')

    Returns:
        Dictionary in game JSON format
    """
    # Sort beats by timestamp
    beats.sort(key=lambda x: x[0])

    # Extract timestamps and markers
    beat_times_seconds = [beat[0] for beat in beats]
    markers = [beat[1] for beat in beats]

    # Convert seconds to milliseconds
    beat_times_ms = [int(round(time * 1000)) for time in beat_times_seconds]

    # Calculate BPM
    bpm = calculate_bpm(beat_times_seconds)

    # Create JSON structure
    output = {
        "id": track_id,
        "name": track_name,
        "bpm": bpm,
        "beatTimes": beat_times_ms,
        "markers": markers
    }

    return output


def main():
    # Check arguments
    if len(sys.argv) != 3:
        print("Usage: python audacity_to_json.py input_labels.txt output_timing.json")
        print("\nExample:")
        print("  python audacity_to_json.py six_seven_hype_labels.txt six_seven_hype.json")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    # Validate input file exists
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' not found!")
        sys.exit(1)

    # Derive track ID and name from output filename
    base_name = os.path.splitext(os.path.basename(output_file))[0]
    track_id = base_name

    # Convert snake_case to Title Case for display name
    track_name = base_name.replace('_', ' ').title()

    # Ask user for custom track info
    print(f"\nDefault track ID: {track_id}")
    print(f"Default track name: {track_name}")

    custom_id = input("\nEnter custom track ID (or press Enter to keep default): ").strip()
    if custom_id:
        track_id = custom_id

    custom_name = input("Enter custom track name (or press Enter to keep default): ").strip()
    if custom_name:
        track_name = custom_name

    print(f"\nProcessing '{input_file}'...")

    # Parse Audacity labels
    beats = parse_audacity_labels(input_file)

    if not beats:
        print("Error: No valid beats found in input file!")
        sys.exit(1)

    print(f"Found {len(beats)} beats")

    # Convert to JSON
    output_data = convert_to_json(beats, track_id, track_name)

    # Write output file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2)

    print(f"\n✅ Success! Created '{output_file}'")
    print(f"\nSummary:")
    print(f"  Track ID: {output_data['id']}")
    print(f"  Track Name: {output_data['name']}")
    print(f"  BPM: {output_data['bpm']}")
    print(f"  Total Beats: {len(output_data['beatTimes'])}")
    print(f"  Duration: {output_data['beatTimes'][-1] / 1000:.1f} seconds")
    print(f"\nNext steps:")
    print(f"  1. Copy '{output_file}' to 'assets/audio/beat_timings/'")
    print(f"  2. Update gameConfig.ts to include this track")
    print(f"  3. Test in-game!")


if __name__ == '__main__':
    main()
