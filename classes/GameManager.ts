/**
 * GameManager - Central game orchestration singleton
 *
 * This class manages:
 * - Match lifecycle (waiting, countdown, playing, results)
 * - Round progression
 * - Player scoring and elimination
 * - Leaderboard tracking
 * - Audio playback
 * - UI updates to all players
 */

import {
  Audio,
  GameServer,
  type Player,
  type World
} from 'hytopia';

import BeatManager, { type BeatTimingData, type ScoreResult } from './BeatManager.js';
import GamePlayerEntity from './GamePlayerEntity.js';
import PlatformEntity from './PlatformEntity.js';

import {
  MINIMUM_PLAYERS_TO_START,
  ROUNDS_PER_MATCH,
  SECONDS_BETWEEN_ROUNDS,
  COUNTDOWN_BEFORE_ROUND_SECONDS,
  PLATFORM_6_POSITION,
  PLATFORM_7_POSITION,
  PLAYER_SPAWN_POSITION,
  SPECTATOR_POSITION,
  DEFAULT_TRACK_ID,
  AUDIO_TRACKS,
  TRACK_SELECTION_MODE,
  type AudioTrack,
  XP_MATCH_COMPLETE,
  XP_PERFECT_HIT,
  XP_GOOD_HIT,
  XP_ROUND_SURVIVED,
  XP_MATCH_WIN,
  WINNER_ANNOUNCEMENT_DURATION_MS,
  type PlayerProfile,
  DEFAULT_PLAYER_PROFILE
} from '../gameConfig.js';

// Dynamic beat timing data import
import { readFileSync } from 'fs';
import { join } from 'path';

type GameState = 'WAITING' | 'COUNTDOWN' | 'PLAYING' | 'ROUND_END' | 'MATCH_END';

export class GameManager {
  public static readonly instance = new GameManager();

  public world?: World;
  private _gameState: GameState = 'WAITING';
  private _currentRound = 0;
  private _beatManager?: BeatManager;
  private _platform6?: PlatformEntity;
  private _platform7?: PlatformEntity;
  private _roundAudio?: Audio;
  private _lobbyAmbience?: Audio;
  private _matchStartVoice?: Audio;

  // Player tracking
  private _alivePlayers = new Set<string>();
  private _playerScores = new Map<string, number>();
  private _playerPerfectHits = new Map<string, number>();
  private _playerGoodHits = new Map<string, number>();

  // Timers
  private _roundTimer?: NodeJS.Timeout;
  private _countdownTimer?: NodeJS.Timeout;
  private _waitTimer?: NodeJS.Timeout;
  private _platformGlowTimers: NodeJS.Timeout[] = [];

  // Input rate limiting (anti-cheat)
  private _lastInputTime = new Map<string, number>();
  private _inputCounts = new Map<string, number>();

  // Error recovery tracking
  private _consecutiveAudioErrors = 0;
  private readonly MAX_AUDIO_RETRIES = 3;

  // Track history (prevent immediate repeats)
  private _trackHistory: string[] = [];
  private readonly MAX_TRACK_HISTORY = 2; // Don't repeat last 2 tracks

  /**
   * Setup the game world
   */
  public setupGame(world: World): void {
    this.world = world;

    console.log('[6-7 BATTLEGROUND] Setting up game...');

    // Spawn platforms
    this._spawnPlatforms();

    // Start waiting for players
    this._waitForPlayers();

    console.log('[6-7 BATTLEGROUND] Game setup complete! Waiting for players...');
    console.log(`[6-7 BATTLEGROUND] ${AUDIO_TRACKS.length} audio tracks available!`);
  }

  /**
   * Spawn a player entity when they join
   */
  public spawnPlayerEntity(player: Player): void {
    if (!this.world) return;

    const playerEntity = new GamePlayerEntity(player);
    playerEntity.spawn(this.world, PLAYER_SPAWN_POSITION);

    // Load player's persisted data
    this._loadPlayerProfile(player, playerEntity);

    // Send initial UI sync
    this._syncUIForPlayer(player);

    console.log(`[6-7 BATTLEGROUND] Player ${player.username} spawned`);
  }

  /**
   * Handle player leaving
   */
  public handlePlayerLeave(player: Player): void {
    this._alivePlayers.delete(player.id);
    this._playerScores.delete(player.id);
    this._playerPerfectHits.delete(player.id);
    this._playerGoodHits.delete(player.id);
    this._lastInputTime.delete(player.id);
    this._inputCounts.delete(player.id);

    // Despawn player entities
    this.world?.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => {
      entity.despawn();
    });

    console.log(`[6-7 BATTLEGROUND] Player ${player.username} left`);
  }

  /**
   * Handle platform jump input from player
   */
  public handleJump(player: Player, platform: 6 | 7, timestamp: number): void {
    if (!this._beatManager || this._gameState !== 'PLAYING') return;

    // Rate limiting (anti-cheat)
    if (!this._checkInputRateLimit(player)) {
      console.warn(`[ANTI-CHEAT] ${player.username} exceeded input rate limit`);
      return;
    }

    // Check if player is still alive
    if (!this._alivePlayers.has(player.id)) return;

    // Validate the jump with BeatManager
    const result = this._beatManager.validateJump(platform, timestamp);

    // Log input BEFORE processing (helps with debugging race conditions)
    console.log(`[GAME] ${player.username} jumped to ${platform}: ${result.rating} (+${result.score})${result.eliminate ? ' [WILL ELIMINATE]' : ''}`);

    // Update player score
    const currentScore = this._playerScores.get(player.id) || 0;
    this._playerScores.set(player.id, currentScore + result.score);

    // Track perfect/good hits
    if (result.rating === 'PERFECT') {
      const perfects = this._playerPerfectHits.get(player.id) || 0;
      this._playerPerfectHits.set(player.id, perfects + 1);
    } else if (result.rating === 'GOOD') {
      const goods = this._playerGoodHits.get(player.id) || 0;
      this._playerGoodHits.set(player.id, goods + 1);
    }

    // Play sound effect based on rating
    this._playSoundEffect(result.rating);

    // Send feedback to player
    player.ui.sendData({
      type: 'score',
      rating: result.rating,
      score: result.score,
      timingDelta: result.timingDelta,
      totalScore: currentScore + result.score
    });

    // Check for elimination
    if (result.eliminate) {
      this._eliminatePlayer(player);
    }

    // Update leaderboard for all players
    this._broadcastLeaderboard();
  }

  /**
   * Get current game state
   */
  public get gameState(): GameState {
    return this._gameState;
  }

  // =========================================================================
  // PRIVATE METHODS
  // =========================================================================

  /**
   * Spawn the two platforms
   */
  private _spawnPlatforms(): void {
    if (!this.world) return;

    this._platform6 = new PlatformEntity(6);
    this._platform6.spawn(this.world, PLATFORM_6_POSITION);

    this._platform7 = new PlatformEntity(7);
    this._platform7.spawn(this.world, PLATFORM_7_POSITION);

    console.log('[6-7 BATTLEGROUND] Platforms spawned');
  }

  /**
   * Wait for minimum players to start
   */
  private _waitForPlayers(): void {
    if (!this.world) return;

    this._gameState = 'WAITING';

    // Start lobby ambience (looping background music)
    this._playLobbyAmbience();

    // Clear existing timer
    if (this._waitTimer) clearTimeout(this._waitTimer);

    this._waitTimer = setInterval(() => {
      if (!this.world) return;

      const playerCount = this.world.entityManager.getAllPlayerEntities().length;

      if (playerCount >= MINIMUM_PLAYERS_TO_START) {
        clearInterval(this._waitTimer);
        this._startMatch();
      } else {
        // Broadcast waiting message
        this._broadcastToAll({
          type: 'waiting-for-players',
          current: playerCount,
          needed: MINIMUM_PLAYERS_TO_START
        });
      }
    }, 2000);
  }

  /**
   * Start a new match
   */
  private _startMatch(): void {
    if (!this.world) return;

    console.log('[6-7 BATTLEGROUND] Match starting!');

    // Stop lobby ambience
    this._stopLobbyAmbience();

    // Play match start hype voice
    this._playMatchStartVoice();

    // Reset match state
    this._currentRound = 0;
    this._alivePlayers.clear();
    this._playerScores.clear();
    this._playerPerfectHits.clear();
    this._playerGoodHits.clear();

    // Mark all players as alive
    this.world.entityManager.getAllPlayerEntities().forEach(entity => {
      const gameEntity = entity as GamePlayerEntity;
      gameEntity.resetForNewMatch();
      this._alivePlayers.add(entity.player.id);
      this._playerScores.set(entity.player.id, 0);
      this._playerPerfectHits.set(entity.player.id, 0);
      this._playerGoodHits.set(entity.player.id, 0);
    });

    console.log(`[6-7 BATTLEGROUND] Match initialized with ${this._alivePlayers.size} players`);

    // Start first round
    this._startRound();
  }

  /**
   * Start a new round
   */
  private _startRound(): void {
    if (!this.world) return;

    this._currentRound++;
    this._gameState = 'COUNTDOWN';

    console.log(`[6-7 BATTLEGROUND] Round ${this._currentRound} starting...`);

    // Broadcast round info
    this._broadcastToAll({
      type: 'round-start',
      round: this._currentRound,
      totalRounds: ROUNDS_PER_MATCH
    });

    // Start countdown
    this._runCountdown();
  }

  /**
   * Run countdown before round starts
   */
  private _runCountdown(): void {
    let countdown = COUNTDOWN_BEFORE_ROUND_SECONDS;

    const countdownInterval = setInterval(() => {
      if (!this.world) {
        clearInterval(countdownInterval);
        return;
      }

      this._broadcastToAll({
        type: 'countdown',
        seconds: countdown
      });

      countdown--;

      if (countdown < 0) {
        clearInterval(countdownInterval);
        this._playRound();
      }
    }, 1000);
  }

  /**
   * Select an audio track based on configured selection mode
   */
  private _selectTrack(): AudioTrack {
    if (AUDIO_TRACKS.length === 0) {
      throw new Error('No audio tracks configured!');
    }

    if (TRACK_SELECTION_MODE === 'random') {
      // Filter out recently played tracks
      let availableTracks = AUDIO_TRACKS.filter(track => !this._trackHistory.includes(track.id));

      // If all tracks were recently played, use all tracks (prevents deadlock)
      if (availableTracks.length === 0) {
        availableTracks = [...AUDIO_TRACKS];
        this._trackHistory = []; // Reset history
      }

      // Random selection from available tracks
      const randomIndex = Math.floor(Math.random() * availableTracks.length);
      const selectedTrack = availableTracks[randomIndex];

      // Add to history
      this._trackHistory.push(selectedTrack.id);
      if (this._trackHistory.length > this.MAX_TRACK_HISTORY) {
        this._trackHistory.shift(); // Remove oldest
      }

      return selectedTrack;
    } else if (TRACK_SELECTION_MODE === 'sequential') {
      // Sequential selection (round-robin)
      const trackIndex = this._currentRound % AUDIO_TRACKS.length;
      return AUDIO_TRACKS[trackIndex];
    }

    // Default: return first track
    return AUDIO_TRACKS[0];
  }

  /**
   * Load beat timing data from JSON file
   */
  private _loadBeatTimingData(beatTimingsUri: string): BeatTimingData {
    try {
      const filePath = join(process.cwd(), 'assets', beatTimingsUri);
      const fileContent = readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent) as BeatTimingData;
    } catch (error) {
      console.error(`[6-7 BATTLEGROUND] Failed to load beat timing data from ${beatTimingsUri}:`, error);
      throw error;
    }
  }

  /**
   * Play the actual round (audio starts, players react)
   */
  private _playRound(): void {
    if (!this.world) return;

    this._gameState = 'PLAYING';

    try {
      // Select and load audio track for this round
      const selectedTrack = this._selectTrack();
      console.log(`[6-7 BATTLEGROUND] Selected track: ${selectedTrack.name}`);

      // Load beat timing data for the selected track
      const beatTimingData = this._loadBeatTimingData(selectedTrack.beatTimingsUri);

      // Initialize beat manager with the selected track's timing data
      this._beatManager = new BeatManager(beatTimingData);

      const roundStartTime = Date.now();
      this._beatManager.startRound(roundStartTime);

      // Play the selected audio track
      this._roundAudio = new Audio({
        uri: selectedTrack.uri,
        loop: false,
        volume: 0.8
      });

      this._roundAudio.play(this.world);

      // Audio started successfully - reset error counter
      this._consecutiveAudioErrors = 0;

      // Announce track to players
      this._broadcastToAll({
        type: 'track-selected',
        trackName: selectedTrack.name
      });

      console.log('[6-7 BATTLEGROUND] Round playing! Audio started.');

      // Schedule platform highlight effects
      this._schedulePlatformGlows();

      // End round after track duration
      this._roundTimer = setTimeout(() => {
        this._endRound();
      }, selectedTrack.durationMs);

    } catch (error) {
      console.error('[6-7 BATTLEGROUND] CRITICAL: Failed to start round - audio or timing data error:', error);

      this._consecutiveAudioErrors++;

      // Notify all players
      this._broadcastToAll({
        type: 'error',
        message: '⚠️ Audio failed to load. Retrying...'
      });

      // Attempt recovery based on retry count
      if (this._consecutiveAudioErrors < this.MAX_AUDIO_RETRIES) {
        // Retry the round after a short delay
        setTimeout(() => {
          console.log(`[6-7 BATTLEGROUND] Attempting audio recovery (attempt ${this._consecutiveAudioErrors}/${this.MAX_AUDIO_RETRIES})...`);
          this._playRound();
        }, 2000);
      } else {
        // Max retries exceeded - abort match
        console.error('[6-7 BATTLEGROUND] Max audio retries exceeded. Aborting match.');
        this._broadcastToAll({
          type: 'error',
          message: '❌ Audio system error. Match cancelled. Please restart.'
        });

        // Return to waiting state
        setTimeout(() => {
          this._resetMatch();
          this._waitForPlayers();
        }, 5000);
      }
    }
  }

  /**
   * Schedule platform highlight UI indicators based on beat timing
   */
  private _schedulePlatformGlows(): void {
    if (!this._beatManager) return;

    // Clear any existing timers
    this._clearPlatformGlowTimers();

    const beatTimes = this._beatManager.getBeatTimes();
    const markers = this._beatManager.getMarkers();

    // Schedule UI highlights for each beat
    beatTimes.forEach((beatTime, index) => {
      const marker = markers[index];
      const platformNumber = marker === 'six' ? 6 : 7;

      // Show highlight 300ms before the beat
      const highlightStartDelay = Math.max(0, beatTime - 300);
      const highlightTimer = setTimeout(() => {
        this._broadcastToAll({
          type: 'platform-highlight',
          platform: platformNumber,
          active: true
        });
      }, highlightStartDelay);

      this._platformGlowTimers.push(highlightTimer);

      // Hide highlight 500ms after the beat
      const highlightStopDelay = beatTime + 500;
      const stopTimer = setTimeout(() => {
        this._broadcastToAll({
          type: 'platform-highlight',
          platform: platformNumber,
          active: false
        });
      }, highlightStopDelay);

      this._platformGlowTimers.push(stopTimer);
    });

    console.log(`[6-7 BATTLEGROUND] Scheduled ${beatTimes.length} platform UI highlights`);
  }

  /**
   * Clear all platform glow timers
   */
  private _clearPlatformGlowTimers(): void {
    this._platformGlowTimers.forEach(timer => clearTimeout(timer));
    this._platformGlowTimers = [];

    // Clear UI highlights
    this._broadcastToAll({
      type: 'platform-highlight',
      platform: 0,
      active: false
    });
  }

  /**
   * End the current round
   */
  private _endRound(): void {
    if (!this.world) return;

    this._gameState = 'ROUND_END';

    // Stop platform glows
    this._clearPlatformGlowTimers();

    console.log(`[6-7 BATTLEGROUND] Round ${this._currentRound} ended`);

    // Award XP for surviving the round
    this._alivePlayers.forEach(playerId => {
      const entities = this.world!.entityManager.getAllPlayerEntities();
      const entity = entities.find(e => e.player.id === playerId) as GamePlayerEntity;
      if (entity) {
        entity.addXP(XP_ROUND_SURVIVED);
      }
    });

    // Check if match should end
    if (this._currentRound >= ROUNDS_PER_MATCH) {
      setTimeout(() => this._endMatch(), 3000);
    } else {
      // Start next round after break
      setTimeout(() => this._startRound(), SECONDS_BETWEEN_ROUNDS * 1000);
    }
  }

  /**
   * End the match and announce winner
   */
  private _endMatch(): void {
    if (!this.world) return;

    this._gameState = 'MATCH_END';

    console.log('[6-7 BATTLEGROUND] Match ended!');

    // Find the winner (highest score among ALIVE players only)
    let winnerPlayerId: string | null = null;
    let highestScore = -1;

    this._playerScores.forEach((score, playerId) => {
      // Only consider players who are still alive (Survival > Score)
      if (this._alivePlayers.has(playerId) && score > highestScore) {
        highestScore = score;
        winnerPlayerId = playerId;
      }
    });

    // Get winner player object
    let winnerUsername = 'Unknown';
    if (winnerPlayerId) {
      const winnerEntity = this.world.entityManager.getAllPlayerEntities()
        .find(e => e.player.id === winnerPlayerId);
      if (winnerEntity) {
        winnerUsername = winnerEntity.player.username;

        // Award winner XP
        const gameEntity = winnerEntity as GamePlayerEntity;
        gameEntity.addXP(XP_MATCH_WIN);

        // Update winner's profile
        const perfects = this._playerPerfectHits.get(winnerPlayerId) || 0;
        const goods = this._playerGoodHits.get(winnerPlayerId) || 0;
        gameEntity.updateProfileAfterMatch(true, perfects, goods);

        // Save winner's profile
        this._savePlayerProfile(winnerEntity.player, gameEntity);
      }
    }

    // Update non-winner profiles
    this.world.entityManager.getAllPlayerEntities().forEach(entity => {
      if (entity.player.id !== winnerPlayerId) {
        const gameEntity = entity as GamePlayerEntity;
        const perfects = this._playerPerfectHits.get(entity.player.id) || 0;
        const goods = this._playerGoodHits.get(entity.player.id) || 0;
        gameEntity.updateProfileAfterMatch(false, perfects, goods);
        gameEntity.addXP(XP_MATCH_COMPLETE);

        // Save profile
        this._savePlayerProfile(entity.player, gameEntity);
      }
    });

    // Broadcast winner
    this._broadcastToAll({
      type: 'match-end',
      winner: winnerUsername,
      winnerScore: highestScore,
      round: this._currentRound
    });

    // Restart match after delay
    setTimeout(() => {
      this._waitForPlayers();
    }, WINNER_ANNOUNCEMENT_DURATION_MS);
  }

  /**
   * Reset match state and clear all timers (for error recovery)
   */
  private _resetMatch(): void {
    console.log('[6-7 BATTLEGROUND] Resetting match state...');

    // Clear all timers
    if (this._roundTimer) clearTimeout(this._roundTimer);
    if (this._countdownTimer) clearTimeout(this._countdownTimer);
    if (this._waitTimer) clearInterval(this._waitTimer);
    this._clearPlatformGlowTimers();

    // Reset match state
    this._currentRound = 0;
    this._gameState = 'WAITING';
    this._alivePlayers.clear();
    this._playerScores.clear();
    this._playerPerfectHits.clear();
    this._playerGoodHits.clear();
    this._consecutiveAudioErrors = 0;

    // Reset beat manager
    this._beatManager = undefined;
    this._roundAudio = undefined;

    console.log('[6-7 BATTLEGROUND] Match state reset complete');
  }

  /**
   * Eliminate a player
   */
  private _eliminatePlayer(player: Player): void {
    this._alivePlayers.delete(player.id);

    // Get player entity and mark as eliminated
    const entity = this.world?.entityManager.getAllPlayerEntities()
      .find(e => e.player.id === player.id) as GamePlayerEntity;

    if (entity) {
      entity.eliminate();

      // Move to spectator position
      entity.setPosition(SPECTATOR_POSITION);

      // Send spectator notification to eliminated player
      player.ui.sendData({
        type: 'spectating',
        message: '👻 You\'re spectating! Watch the remaining players compete.',
        remainingPlayers: this._alivePlayers.size
      });
    }

    console.log(`[6-7 BATTLEGROUND] Player ${player.username} eliminated (${this._alivePlayers.size} players remaining)`);

    // Broadcast elimination to all players
    this._broadcastToAll({
      type: 'player-eliminated',
      username: player.username,
      remainingPlayers: this._alivePlayers.size
    });

    // End round early ONLY if ALL players are eliminated
    if (this._alivePlayers.size === 0 && this._gameState === 'PLAYING') {
      if (this._roundTimer) clearTimeout(this._roundTimer);
      console.log('[6-7 BATTLEGROUND] All players eliminated - ending round early');
      this._endRound();
    }
  }

  /**
   * Check input rate limiting (anti-cheat)
   */
  private _checkInputRateLimit(player: Player): boolean {
    const now = Date.now();
    const lastTime = this._lastInputTime.get(player.id) || 0;

    // Reset counter every second
    if (now - lastTime > 1000) {
      this._inputCounts.set(player.id, 0);
    }

    const count = this._inputCounts.get(player.id) || 0;
    this._inputCounts.set(player.id, count + 1);
    this._lastInputTime.set(player.id, now);

    // Max 10 inputs per second
    return count < 10;
  }

  /**
   * Broadcast data to all players
   */
  private _broadcastToAll(data: any): void {
    if (!this.world) return;

    GameServer.instance.playerManager.getConnectedPlayersByWorld(this.world).forEach(player => {
      player.ui.sendData(data);
    });
  }

  /**
   * Broadcast leaderboard to all players
   */
  private _broadcastLeaderboard(): void {
    if (!this.world) return;

    const leaderboard: any[] = [];

    this._playerScores.forEach((score, playerId) => {
      const entity = this.world!.entityManager.getAllPlayerEntities()
        .find(e => e.player.id === playerId);

      if (entity) {
        const gameEntity = entity as GamePlayerEntity;
        leaderboard.push({
          username: entity.player.username,
          score,
          alive: !gameEntity.isEliminated
        });
      }
    });

    // Sort by score descending
    leaderboard.sort((a, b) => b.score - a.score);

    this._broadcastToAll({
      type: 'leaderboard',
      players: leaderboard
    });
  }

  /**
   * Sync UI for a specific player
   */
  private _syncUIForPlayer(player: Player): void {
    player.ui.sendData({
      type: 'game-state',
      state: this._gameState,
      round: this._currentRound,
      totalRounds: ROUNDS_PER_MATCH
    });

    this._broadcastLeaderboard();
  }

  /**
   * Play sound effect based on score rating
   */
  private _playSoundEffect(rating: string): void {
    if (!this.world) return;

    let sfxUri: string | null = null;

    switch (rating) {
      case 'PERFECT':
        sfxUri = 'audio/sfx/perfect.mp3';
        break;
      case 'MISS':
      case 'WRONG_PLATFORM':
        sfxUri = 'audio/sfx/miss.mp3';
        break;
      // GOOD and LATE ratings have no sound effect (silent feedback)
    }

    if (sfxUri) {
      try {
        const sfx = new Audio({
          uri: sfxUri,
          loop: false,
          volume: 0.6
        });
        sfx.play(this.world);
      } catch (error) {
        // Silently fail if SFX doesn't load - not critical
        console.warn(`[SFX] Failed to play sound: ${sfxUri}`, error);
      }
    }
  }

  /**
   * Play lobby ambience (looping background music)
   */
  private _playLobbyAmbience(): void {
    if (!this.world) return;

    try {
      // Stop existing lobby audio if playing
      this._stopLobbyAmbience();

      // Create looping lobby ambience
      this._lobbyAmbience = new Audio({
        uri: 'audio/lobby_ambience.mp3',
        loop: true,
        volume: 0.35 // Subtle background music (35%)
      });

      this._lobbyAmbience.play(this.world);
      console.log('[6-7 BATTLEGROUND] Lobby ambience started');
    } catch (error) {
      console.warn('[AUDIO] Failed to play lobby ambience:', error);
    }
  }

  /**
   * Stop lobby ambience
   */
  private _stopLobbyAmbience(): void {
    if (this._lobbyAmbience) {
      try {
        this._lobbyAmbience.pause();
        this._lobbyAmbience = undefined;
        console.log('[6-7 BATTLEGROUND] Lobby ambience stopped');
      } catch (error) {
        console.warn('[AUDIO] Failed to stop lobby ambience:', error);
      }
    }
  }

  /**
   * Play match start hype voice
   */
  private _playMatchStartVoice(): void {
    if (!this.world) return;

    try {
      this._matchStartVoice = new Audio({
        uri: 'audio/match_start_voice.mp3',
        loop: false,
        volume: 0.75 // Clear and impactful (75%)
      });

      this._matchStartVoice.play(this.world);
      console.log('[6-7 BATTLEGROUND] Match start voice played!');
    } catch (error) {
      console.warn('[AUDIO] Failed to play match start voice:', error);
    }
  }

  /**
   * Load player profile from persisted data
   */
  private async _loadPlayerProfile(player: Player, entity: GamePlayerEntity): Promise<void> {
    try {
      const data = await player.getPersistedData() as PlayerProfile;

      if (data && Object.keys(data).length > 0) {
        entity.setProfile(data);
        // Update Rizz Rank based on total XP (in case thresholds changed)
        entity.getRizzRank();
        console.log(`[6-7 BATTLEGROUND] Loaded profile for ${player.username}: Level ${data.level}, Rizz Rank: ${entity.profile.rizzRank}`);
      } else {
        // New player - set default profile
        entity.setProfile({ ...DEFAULT_PLAYER_PROFILE });
        await player.setPersistedData(DEFAULT_PLAYER_PROFILE);
        console.log(`[6-7 BATTLEGROUND] Created new profile for ${player.username}`);
      }
    } catch (error) {
      console.error(`[6-7 BATTLEGROUND] Error loading profile for ${player.username}:`, error);
      entity.setProfile({ ...DEFAULT_PLAYER_PROFILE });
    }
  }

  /**
   * Save player profile to persisted data
   */
  private async _savePlayerProfile(player: Player, entity: GamePlayerEntity): Promise<void> {
    try {
      await player.setPersistedData(entity.profile);
      console.log(`[6-7 BATTLEGROUND] Saved profile for ${player.username}`);
    } catch (error) {
      console.error(`[6-7 BATTLEGROUND] Error saving profile for ${player.username}:`, error);
    }
  }
}

// Export singleton instance
export default GameManager;
