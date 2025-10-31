/**
 * PlatformEntity - Represents the "6" or "7" platforms players jump to
 *
 * These are static block entities that don't move. Players must jump
 * to the correct platform on the beat.
 */

import { Entity, RigidBodyType } from 'hytopia';
import { PLATFORM_SIZE } from '../gameConfig.js';

export default class PlatformEntity extends Entity {
  private _number: 6 | 7;

  constructor(number: 6 | 7) {
    // Use existing block textures with full face texture sets
    // Platform 6 = Grass block (green), Platform 7 = Sandstone (tan/beige)
    const textureUri = number === 6 ? 'blocks/grass-block' : 'blocks/sandstone';

    super({
      name: `Platform ${number}`,
      blockTextureUri: textureUri, // Using Hytopia default textures
      blockHalfExtents: {
        x: PLATFORM_SIZE.x / 2,
        y: PLATFORM_SIZE.y / 2,
        z: PLATFORM_SIZE.z / 2
      },
      rigidBodyOptions: {
        type: RigidBodyType.STATIC // Platforms don't move
      }
    });

    this._number = number;
  }

  /**
   * Get the platform number
   */
  public get number(): 6 | 7 {
    return this._number;
  }

  /**
   * Make the platform glow (visual feedback when it's the correct answer)
   * Note: This is now handled via UI indicators instead of changing the entity texture
   */
  public glow(): void {
    // Placeholder - visual feedback is now handled by UI
  }

  /**
   * Stop glowing
   */
  public stopGlow(): void {
    // Placeholder - visual feedback is now handled by UI
  }
}
