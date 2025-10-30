/**
 * 6-7 MEME BATTLEGROUND - Entry Point
 *
 * A viral, round-based meme party royale where players react to
 * the "6-7" TikTok audio through fast micro-games!
 *
 * React to the beat by pressing 6 or 7 on the correct platform!
 * Survive eliminations and climb the leaderboard to become
 * the ultimate meme champion!
 *
 * Built with Hytopia SDK: https://dev.hytopia.com/
 * GitHub: https://github.com/hytopiagg/sdk
 */

import {
  startServer,
  PlayerEvent,
} from 'hytopia';

import { GameManager } from './classes/GameManager.js';
import worldMap from './assets/map.json';

console.log('');
console.log('='.repeat(60));
console.log('  6-7 MEME BATTLEGROUND - Starting Server...');
console.log('='.repeat(60));
console.log('');

/**
 * Start the game server
 */
startServer(world => {
  // Optional: Enable debug rendering during development
  // world.simulation.enableDebugRendering(true);

  // Load the world map
  world.loadMap(worldMap);

  // Setup the game manager
  GameManager.instance.setupGame(world);

  /**
   * Handle player joining the world
   */
  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    console.log(`[6-7 BATTLEGROUND] Player joined: ${player.username}`);

    // Load the game UI
    player.ui.load('ui/index.html');

    // Spawn the player entity
    GameManager.instance.spawnPlayerEntity(player);

    // Send welcome messages
    world.chatManager.sendPlayerMessage(
      player,
      '🎮 Welcome to 6-7 Meme Battleground!',
      'FFD700'
    );
    world.chatManager.sendPlayerMessage(
      player,
      'Press 6 or 7 on the beat to survive!',
      '00FF00'
    );
    world.chatManager.sendPlayerMessage(
      player,
      'WASD to move | SPACE to jump | SHIFT to sprint',
      'FFFFFF'
    );
  });

  /**
   * Handle player leaving the world
   */
  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
    console.log(`[6-7 BATTLEGROUND] Player left: ${player.username}`);

    // Clean up player data
    GameManager.instance.handlePlayerLeave(player);
  });

  /**
   * Register chat commands
   */
  world.chatManager.registerCommand('/help', player => {
    world.chatManager.sendPlayerMessage(player, '=== 6-7 BATTLEGROUND HELP ===', 'FFD700');
    world.chatManager.sendPlayerMessage(player, 'Press 6 or 7 keys when the beat drops!');
    world.chatManager.sendPlayerMessage(player, 'PERFECT: ±150ms | GOOD: ±300ms | LATE: ±500ms');
    world.chatManager.sendPlayerMessage(player, 'Survive all rounds to win!');
  });

  world.chatManager.registerCommand('/stats', async player => {
    const entities = world.entityManager.getPlayerEntitiesByPlayer(player);
    if (entities.length > 0) {
      const playerEntity = entities[0] as any;
      const profile = playerEntity.profile;

      world.chatManager.sendPlayerMessage(player, '=== YOUR STATS ===', '00FF00');
      world.chatManager.sendPlayerMessage(player, `Level: ${profile.level} | XP: ${profile.xp}`);
      world.chatManager.sendPlayerMessage(player, `Total Matches: ${profile.totalMatches}`);
      world.chatManager.sendPlayerMessage(player, `Wins: ${profile.wins}`);
      world.chatManager.sendPlayerMessage(player, `Perfect Hits: ${profile.perfectHits}`);
      world.chatManager.sendPlayerMessage(player, `Rizz Rank: ${profile.rizzRank}`);
    }
  });

  // Fun rocket command!
  world.chatManager.registerCommand('/rocket', player => {
    world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => {
      entity.applyImpulse({ x: 0, y: 30, z: 0 });
    });
    world.chatManager.sendPlayerMessage(player, '🚀 YEET!', 'FF0000');
  });

  console.log('');
  console.log('='.repeat(60));
  console.log('  ✅ Server is running! Waiting for players...');
  console.log('='.repeat(60));
  console.log('');
});
