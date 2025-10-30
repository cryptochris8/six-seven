/**
 * GamePlayerEntity - Custom player entity for 6-7 Battleground
 *
 * Extends DefaultPlayerEntity with game-specific functionality:
 * - Input handling for platform jumps (6 and 7 keys)
 * - Player statistics and scoring
 * - Elimination state management
 */

import { DefaultPlayerEntity, type Player } from 'hytopia';
import type { PlayerProfile } from '../gameConfig.js';
import { DEFAULT_PLAYER_PROFILE } from '../gameConfig.js';

export default class GamePlayerEntity extends DefaultPlayerEntity {
  private _last6Press = false;
  private _last7Press = false;
  private _isEliminated = false;
  private _currentScore = 0;
  private _profile: PlayerProfile;

  constructor(player: Player) {
    super({
      player,
      name: player.username,
      cosmeticHiddenSlots: [] // Show all cosmetics from Hytopia marketplace
    });

    // Initialize with default profile (will be loaded from persisted data)
    this._profile = { ...DEFAULT_PLAYER_PROFILE };
  }

  /**
   * Called every tick to handle player input
   */
  public onTick(): void {
    super.onTick(); // Call parent tick for movement

    // Don't process inputs if eliminated
    if (this._isEliminated) return;

    const input = this.player.input;

    // Detect key presses (not holds) for platform 6
    if (input['6'] && !this._last6Press) {
      this._handlePlatformJump(6);
    }
    this._last6Press = input['6'] || false;

    // Detect key presses (not holds) for platform 7
    if (input['7'] && !this._last7Press) {
      this._handlePlatformJump(7);
    }
    this._last7Press = input['7'] || false;
  }

  /**
   * Handle platform jump input
   */
  private _handlePlatformJump(platform: 6 | 7): void {
    // Import dynamically to avoid circular dependency
    const { GameManager } = require('./GameManager.js');
    GameManager.instance.handleJump(this.player, platform, Date.now());
  }

  /**
   * Mark this player as eliminated
   */
  public eliminate(): void {
    this._isEliminated = true;

    // Send elimination feedback to player
    this.player.ui.sendData({
      type: 'eliminated',
      finalScore: this._currentScore
    });
  }

  /**
   * Check if player is eliminated
   */
  public get isEliminated(): boolean {
    return this._isEliminated;
  }

  /**
   * Reset elimination status for new round
   */
  public resetForNewMatch(): void {
    this._isEliminated = false;
    this._currentScore = 0;
  }

  /**
   * Add score to player's current total
   */
  public addScore(points: number): void {
    this._currentScore += points;
  }

  /**
   * Get current score
   */
  public get currentScore(): number {
    return this._currentScore;
  }

  /**
   * Set player profile (loaded from persisted data)
   */
  public setProfile(profile: PlayerProfile): void {
    this._profile = profile;
  }

  /**
   * Get player profile
   */
  public get profile(): PlayerProfile {
    return this._profile;
  }

  /**
   * Update profile stats after match
   */
  public updateProfileAfterMatch(won: boolean, perfectHits: number, goodHits: number): void {
    this._profile.totalMatches++;
    this._profile.totalScore += this._currentScore;
    this._profile.perfectHits += perfectHits;
    this._profile.goodHits += goodHits;
    this._profile.lastPlayedAt = Date.now();

    if (won) {
      this._profile.wins++;
    }
  }

  /**
   * Add XP and check for level up
   */
  public addXP(amount: number): boolean {
    this._profile.xp += amount;

    // Calculate XP needed for next level
    const xpNeeded = this._profile.level * 1000;

    if (this._profile.xp >= xpNeeded) {
      this._profile.level++;
      this._profile.xp -= xpNeeded;

      // Send level up notification
      this.player.ui.sendData({
        type: 'level-up',
        level: this._profile.level
      });

      return true; // Leveled up!
    }

    return false; // No level up
  }
}
