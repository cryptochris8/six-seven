/**
 * 6-7 Battleground - Game Configuration
 *
 * Central configuration for all game constants, balancing,
 * and tunable parameters.
 */

import type { Vector3Like, QuaternionLike } from 'hytopia';

// =============================================================================
// GAME RULES
// =============================================================================

export const MINIMUM_PLAYERS_TO_START = 2; // Min players before match starts
export const MAXIMUM_PLAYERS = 16; // Max players per lobby
export const ROUNDS_PER_MATCH = 6; // Number of rounds before declaring winner
export const SECONDS_BETWEEN_ROUNDS = 5; // Rest time between rounds
export const COUNTDOWN_BEFORE_ROUND_SECONDS = 3; // "3... 2... 1... GO!"
export const WINNER_ANNOUNCEMENT_DURATION_MS = 10000; // 10 seconds

// =============================================================================
// SCORING
// =============================================================================

export const SCORE_PERFECT = 100; // ±150ms timing
export const SCORE_GOOD = 50;     // ±300ms timing
export const SCORE_LATE = 10;     // >300ms timing
export const SCORE_MISS = 0;      // Wrong platform or too late

export const PERFECT_TIMING_WINDOW_MS = 150; // Very tight timing
export const GOOD_TIMING_WINDOW_MS = 300;    // Forgiving timing
export const LATE_TIMING_WINDOW_MS = 500;    // Last chance timing

// =============================================================================
// PROGRESSION (XP & LEVELS)
// =============================================================================

export const XP_MATCH_COMPLETE = 100;
export const XP_PERFECT_HIT = 10;
export const XP_GOOD_HIT = 5;
export const XP_ROUND_SURVIVED = 25;
export const XP_MATCH_WIN = 500;
export const XP_PER_LEVEL = 1000; // XP needed to level up (scales: level * XP_PER_LEVEL)

// =============================================================================
// WORLD SETUP
// =============================================================================

// Platform spawn positions
export const PLATFORM_6_POSITION: Vector3Like = { x: -10, y: 0, z: 0 };
export const PLATFORM_7_POSITION: Vector3Like = { x: 10, y: 0, z: 0 };
export const PLATFORM_SIZE = { x: 4, y: 0.5, z: 4 }; // 8x1x8 block platform

// Player spawn position (center, elevated)
export const PLAYER_SPAWN_POSITION: Vector3Like = { x: 0, y: 10, z: 0 };

// Spectator position (high above, after elimination)
export const SPECTATOR_POSITION: Vector3Like = { x: 0, y: 30, z: 0 };

// =============================================================================
// AUDIO TRACKS
// =============================================================================

export interface AudioTrack {
  id: string;
  name: string;
  uri: string;
  beatTimingsUri: string;
  durationMs: number;
}

export const AUDIO_TRACKS: AudioTrack[] = [
  {
    id: 'six_seven_original',
    name: '6-7 Original',
    uri: 'audio/six_seven_original.mp3',
    beatTimingsUri: 'audio/beat_timings/six_seven_original.json',
    durationMs: 30000
  },
  {
    id: 'six_seven_hype',
    name: '6-7 Hype Beast',
    uri: 'audio/six_seven_hype.mp3',
    beatTimingsUri: 'audio/beat_timings/six_seven_hype.json',
    durationMs: 30000
  },
  {
    id: 'six_seven_chill',
    name: '6-7 Chill Vibes',
    uri: 'audio/six_seven_chill.mp3',
    beatTimingsUri: 'audio/beat_timings/six_seven_chill.json',
    durationMs: 30000
  },
  {
    id: 'six_seven_deep',
    name: '6-7 Deep Voice',
    uri: 'audio/six_seven_deep.mp3',
    beatTimingsUri: 'audio/beat_timings/six_seven_deep.json',
    durationMs: 30000
  },
  {
    id: 'six_seven_chipmunk',
    name: '6-7 Chipmunk',
    uri: 'audio/six_seven_chipmunk.mp3',
    beatTimingsUri: 'audio/beat_timings/six_seven_chipmunk.json',
    durationMs: 30000
  }
  // Add more tracks easily - just follow the pattern above!
];

// Default track for fallback
export const DEFAULT_TRACK_ID = 'six_seven_original';

// Track selection mode
export type TrackSelectionMode = 'random' | 'sequential' | 'vote';
export const TRACK_SELECTION_MODE: TrackSelectionMode = 'random';

// =============================================================================
// UI COLORS
// =============================================================================

export const COLOR_PERFECT = '#00FF00';  // Green
export const COLOR_GOOD = '#FFFF00';     // Yellow
export const COLOR_LATE = '#FFA500';     // Orange
export const COLOR_MISS = '#FF0000';     // Red
export const COLOR_ELIMINATED = '#8B0000'; // Dark red

// =============================================================================
// ANTI-CHEAT
// =============================================================================

export const MAX_INPUTS_PER_SECOND = 10; // Rate limit for jump inputs
export const MAX_TIMING_DELTA_MS = 1000; // Impossible timing detection

// =============================================================================
// ANALYTICS EVENTS
// =============================================================================

export const ANALYTICS_EVENTS = {
  MATCH_START: 'match_start',
  MATCH_END: 'match_end',
  ROUND_START: 'round_start',
  ROUND_END: 'round_end',
  PLAYER_SCORE: 'player_score',
  PLAYER_ELIMINATED: 'player_eliminated',
  LEVEL_UP: 'level_up'
} as const;

// =============================================================================
// PLAYER DATA STRUCTURE
// =============================================================================

export interface PlayerProfile {
  level: number;
  xp: number;
  totalMatches: number;
  wins: number;
  perfectHits: number;
  goodHits: number;
  totalScore: number;
  rizzRank: RizzRank;
  createdAt: number;
  lastPlayedAt: number;
}

export type RizzRank = 'Bronze' | 'Silver' | 'Gold' | 'Certified 6-7' | 'Meme Lord';

export const DEFAULT_PLAYER_PROFILE: PlayerProfile = {
  level: 1,
  xp: 0,
  totalMatches: 0,
  wins: 0,
  perfectHits: 0,
  goodHits: 0,
  totalScore: 0,
  rizzRank: 'Bronze',
  createdAt: Date.now(),
  lastPlayedAt: Date.now()
};

// Rizz Rank thresholds (XP required)
export const RIZZ_RANKS: Record<RizzRank, number> = {
  'Bronze': 0,
  'Silver': 1000,
  'Gold': 5000,
  'Certified 6-7': 15000,
  'Meme Lord': 50000
};
