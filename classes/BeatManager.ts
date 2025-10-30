/**
 * BeatManager - Handles beat timing validation and scoring
 *
 * This class is responsible for:
 * - Loading beat timing data from JSON
 * - Validating player inputs against beat windows
 * - Determining scoring (PERFECT, GOOD, LATE, MISS)
 * - Managing the current beat position
 */

import {
  PERFECT_TIMING_WINDOW_MS,
  GOOD_TIMING_WINDOW_MS,
  LATE_TIMING_WINDOW_MS,
  SCORE_PERFECT,
  SCORE_GOOD,
  SCORE_LATE,
  SCORE_MISS
} from '../gameConfig.js';

export interface BeatTimingData {
  id: string;
  name: string;
  bpm: number;
  beatTimes: number[];
  markers: ('six' | 'seven')[];
}

export type ScoreRating = 'PERFECT' | 'GOOD' | 'LATE' | 'MISS' | 'WRONG_PLATFORM';

export interface ScoreResult {
  rating: ScoreRating;
  score: number;
  timingDelta: number; // How many ms off from perfect
  eliminate: boolean;
}

export default class BeatManager {
  private _beatData: BeatTimingData;
  private _roundStartTime: number = 0;

  constructor(beatData: BeatTimingData) {
    this._beatData = beatData;
  }

  /**
   * Start tracking a new round with the given start time
   */
  public startRound(roundStartTime: number): void {
    this._roundStartTime = roundStartTime;
  }

  /**
   * Get the current elapsed time since round start
   */
  public getElapsed(): number {
    return Date.now() - this._roundStartTime;
  }

  /**
   * Get the expected platform at a given time
   */
  public getExpectedPlatform(timestamp: number): 6 | 7 | null {
    const elapsed = timestamp - this._roundStartTime;
    const { beatIndex } = this._findNearestBeat(elapsed);

    if (beatIndex === -1) return null;

    const marker = this._beatData.markers[beatIndex];
    return marker === 'six' ? 6 : 7;
  }

  /**
   * Validate a player's jump input and return scoring result
   */
  public validateJump(
    platform: 6 | 7,
    timestamp: number
  ): ScoreResult {
    const elapsed = timestamp - this._roundStartTime;

    // Find the nearest beat
    const { beatTime, beatIndex, timingDelta } = this._findNearestBeat(elapsed);

    // If no nearby beat found, it's a complete miss
    if (beatIndex === -1) {
      return {
        rating: 'MISS',
        score: SCORE_MISS,
        timingDelta: 99999,
        eliminate: true
      };
    }

    // Check if player hit the correct platform
    const expectedMarker = this._beatData.markers[beatIndex];
    const expectedPlatform = expectedMarker === 'six' ? 6 : 7;

    if (platform !== expectedPlatform) {
      return {
        rating: 'WRONG_PLATFORM',
        score: SCORE_MISS,
        timingDelta,
        eliminate: true
      };
    }

    // Player hit correct platform - now score the timing
    return this._scoreTimingDelta(timingDelta);
  }

  /**
   * Get all beat times for the current track
   */
  public getBeatTimes(): number[] {
    return this._beatData.beatTimes;
  }

  /**
   * Get all markers for the current track
   */
  public getMarkers(): ('six' | 'seven')[] {
    return this._beatData.markers;
  }

  /**
   * Get the beat data
   */
  public getBeatData(): BeatTimingData {
    return this._beatData;
  }

  /**
   * Find the nearest beat to a given elapsed time
   */
  private _findNearestBeat(elapsed: number): {
    beatTime: number;
    beatIndex: number;
    timingDelta: number;
  } {
    let nearestBeat = this._beatData.beatTimes[0];
    let nearestIndex = 0;
    let minDelta = Math.abs(elapsed - nearestBeat);

    // Find the closest beat
    for (let i = 1; i < this._beatData.beatTimes.length; i++) {
      const delta = Math.abs(elapsed - this._beatData.beatTimes[i]);
      if (delta < minDelta) {
        minDelta = delta;
        nearestBeat = this._beatData.beatTimes[i];
        nearestIndex = i;
      }
    }

    // If the delta is too large (over 1 second), no valid beat
    if (minDelta > 1000) {
      return { beatTime: 0, beatIndex: -1, timingDelta: minDelta };
    }

    return {
      beatTime: nearestBeat,
      beatIndex: nearestIndex,
      timingDelta: minDelta
    };
  }

  /**
   * Score a timing delta and return the result
   */
  private _scoreTimingDelta(timingDelta: number): ScoreResult {
    if (timingDelta <= PERFECT_TIMING_WINDOW_MS) {
      return {
        rating: 'PERFECT',
        score: SCORE_PERFECT,
        timingDelta,
        eliminate: false
      };
    }

    if (timingDelta <= GOOD_TIMING_WINDOW_MS) {
      return {
        rating: 'GOOD',
        score: SCORE_GOOD,
        timingDelta,
        eliminate: false
      };
    }

    if (timingDelta <= LATE_TIMING_WINDOW_MS) {
      return {
        rating: 'LATE',
        score: SCORE_LATE,
        timingDelta,
        eliminate: false
      };
    }

    // Too late - miss
    return {
      rating: 'MISS',
      score: SCORE_MISS,
      timingDelta,
      eliminate: true
    };
  }
}
