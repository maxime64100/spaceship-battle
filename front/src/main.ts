import { Game } from './Game.ts';

const game = new Game();
game.init().catch(err => {
    console.error("Failed to initialize game:", err);
});
