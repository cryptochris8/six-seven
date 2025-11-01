/**
 * GamePlayerEntity - Custom player entity for 6-7 Battleground
 *
 * Extends DefaultPlayerEntity with game-specific functionality:
 * - Input handling for platform jumps (6 and 7 keys)
 * - Player statistics and scoring
 * - Elimination state management
 */

import { DefaultPlayerEntity, type Player, PlayerUIEvent } from 'hytopia';
import type { PlayerProfile, RizzRank } from '../gameConfig.js';
import { DEFAULT_PLAYER_PROFILE, RIZZ_RANKS } from '../gameConfig.js';
import { GameManager } from './GameManager.js';

export default class GamePlayerEntity extends DefaultPlayerEntity {
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

    // Register UI event listener after entity is fully initialized
    setImmediate(() => {
      this._setupUIListeners();
    });
  }

  /**
   * Set up UI event listeners for platform jumps
   */
  private _setupUIListeners(): void {
    // Listen for platform jump events from the UI
    this.player.ui.on(PlayerUIEvent.DATA, (eventData: any) => {
      // Event data structure: { playerUI: {...}, data: { type, platform, timestamp } }
      const data = eventData.data;

      if (data && data.type === 'platform-jump') {
        this._handlePlatformJump(data.platform, data.timestamp);
      }
    });
  }

  /**
   * Handle platform jump input from UI
   */
  private _handlePlatformJump(platform: 6 | 7, timestamp: number): void {
    // Don't process inputs if eliminated
    if (this._isEliminated) return;

    // Use GameManager singleton instance
    GameManager.instance.handleJump(this.player, platform, timestamp);
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

      // Update Rizz Rank
      this._updateRizzRank();

      // Send level up notification
      this.player.ui.sendData({
        type: 'level-up',
        level: this._profile.level,
        rizzRank: this._profile.rizzRank
      });

      return true; // Leveled up!
    }

    return false; // No level up
  }

  /**
   * Calculate total XP (all levels + current XP)
   */
  public getTotalXP(): number {
    // XP from completed levels: sum of (i * 1000) for i from 1 to (level-1)
    // Formula: 1000 * (level-1) * level / 2
    const completedLevelsXP = 1000 * (this._profile.level - 1) * this._profile.level / 2;

    // Add current XP in this level
    return completedLevelsXP + this._profile.xp;
  }

  /**
   * Calculate and update Rizz Rank based on total XP
   */
  private _updateRizzRank(): void {
    const totalXP = this.getTotalXP();

    // Find the highest rank the player qualifies for
    if (totalXP >= RIZZ_RANKS['Meme Lord']) {
      this._profile.rizzRank = 'Meme Lord';
    } else if (totalXP >= RIZZ_RANKS['Certified 6-7']) {
      this._profile.rizzRank = 'Certified 6-7';
    } else if (totalXP >= RIZZ_RANKS['Gold']) {
      this._profile.rizzRank = 'Gold';
    } else if (totalXP >= RIZZ_RANKS['Silver']) {
      this._profile.rizzRank = 'Silver';
    } else {
      this._profile.rizzRank = 'Bronze';
    }
  }

  /**
   * Get current Rizz Rank
   */
  public getRizzRank(): RizzRank {
    this._updateRizzRank(); // Ensure it's up to date
    return this._profile.rizzRank;
  }
}
