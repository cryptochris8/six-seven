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
  XP_MATCH_COMPLETE,
  XP_PERFECT_HIT,
  XP_GOOD_HIT,
  XP_ROUND_SURVIVED,
  XP_MATCH_WIN,
  WINNER_ANNOUNCEMENT_DURATION_MS,
  type PlayerProfile,
  DEFAULT_PLAYER_PROFILE
} from '../gameConfig.js';

// Import beat timing data
import beatTimingsData from '../assets/audio/beat_timings/six_seven_v1.json';

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

  // Player tracking
  private _alivePlayers = new Set<string>();
  private _playerScores = new Map<string, number>();
  private _playerPerfectHits = new Map<string, number>();
  private _playerGoodHits = new Map<string, number>();

  // Timers
  private _roundTimer?: NodeJS.Timeout;
  private _countdownTimer?: NodeJS.Timeout;
  private _waitTimer?: NodeJS.Timeout;

  // Input rate limiting (anti-cheat)
  private _lastInputTime = new Map<string, number>();
  private _inputCounts = new Map<string, number>();

  /**
   * Setup the game world
   */
  public setupGame(world: World): void {
    this.world = world;

    console.log('[6-7 BATTLEGROUND] Setting up game...');

    // Initialize beat manager
    this._beatManager = new BeatManager(beatTimingsData as BeatTimingData);

    // Spawn platforms
    this._spawnPlatforms();

    // Start waiting for players
    this._waitForPlayers();

    console.log('[6-7 BATTLEGROUND] Game setup complete! Waiting for players...');
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

    console.log(`[GAME] ${player.username} jumped to ${platform}: ${result.rating} (+${result.score})`);
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

    // Start first round
    this._startRound();
  }

  /**
   * Start a new round
   */
  private _startRound(): void {
    if (!this.world || !this._beatManager) return;

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
   * Play the actual round (audio starts, players react)
   */
  private _playRound(): void {
    if (!this.world || !this._beatManager) return;

    this._gameState = 'PLAYING';

    const roundStartTime = Date.now();
    this._beatManager.startRound(roundStartTime);

    // Play the audio track
    this._roundAudio = new Audio({
      uri: 'audio/six_seven_v1.mp3', // You'll need to add this audio file
      loop: false,
      volume: 0.8
    });

    this._roundAudio.play(this.world);

    console.log('[6-7 BATTLEGROUND] Round playing! Audio started.');

    // End round after track duration (30 seconds)
    this._roundTimer = setTimeout(() => {
      this._endRound();
    }, 30000);
  }

  /**
   * End the current round
   */
  private _endRound(): void {
    if (!this.world) return;

    this._gameState = 'ROUND_END';

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
    if (this._currentRound >= ROUNDS_PER_MATCH || this._alivePlayers.size <= 1) {
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

    // Find the winner (highest score)
    let winnerPlayerId: string | null = null;
    let highestScore = -1;

    this._playerScores.forEach((score, playerId) => {
      if (score > highestScore) {
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
    }

    console.log(`[6-7 BATTLEGROUND] Player ${player.username} eliminated`);

    // Check if only one player left (instant win)
    if (this._alivePlayers.size <= 1 && this._gameState === 'PLAYING') {
      if (this._roundTimer) clearTimeout(this._roundTimer);
      this._endMatch();
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
   * Load player profile from persisted data
   */
  private async _loadPlayerProfile(player: Player, entity: GamePlayerEntity): Promise<void> {
    try {
      const data = await player.getPersistedData() as PlayerProfile;

      if (data && Object.keys(data).length > 0) {
        entity.setProfile(data);
        console.log(`[6-7 BATTLEGROUND] Loaded profile for ${player.username}: Level ${data.level}`);
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
