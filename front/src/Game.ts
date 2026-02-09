import * as PIXI from 'pixi.js';
import { Player } from './Player.ts';
import { Laser } from './Laser.ts';
import { InputManager } from './InputManager.ts';

export class Game {
    private app: PIXI.Application;
    private player1: Player;
    private player2: Player;
    private lasers: Laser[] = [];
    private input: InputManager;
    private map: PIXI.Graphics;

    constructor() {
        this.app = new PIXI.Application();
        this.input = new InputManager();
        this.player1 = new Player(0x00ff00); // Vert pour P1
        this.player2 = new Player(0x0000ff); // Bleu pour P2
        this.map = new PIXI.Graphics();
    }

    public async init() {
        await this.app.init({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x1099bb,
            antialias: true,
        });

        document.getElementById('app')?.appendChild(this.app.canvas);

        // Map (simple rectangle de fond)
        this.map.rect(0, 0, this.app.screen.width, this.app.screen.height);
        this.map.fill(0x1a1a1a);
        this.app.stage.addChild(this.map);

        // Position initiale
        this.player1.x = this.app.screen.width / 2;
        this.player1.y = this.app.screen.height / 2;
        this.app.stage.addChild(this.player1);

        this.player2.x = this.app.screen.width / 4;
        this.player2.y = this.app.screen.height / 4;
        this.app.stage.addChild(this.player2);

        // Boucle de jeu
        this.app.ticker.add((delta) => this.update(delta.deltaTime));

        // Redimensionnement
        window.addEventListener('resize', () => {
            this.app.renderer.resize(window.innerWidth, window.innerHeight);
            this.map.clear();
            this.map.rect(0, 0, this.app.screen.width, this.app.screen.height);
            this.map.fill(0x1a1a1a);
        });
    }

    private update(delta: number) {
        // P1 suit la souris
        this.player1.update(this.input.mouseX, this.input.mouseY);

        // P2 contrôlé par clavier (Z/Q/S/D ou W/A/S/D)
        let p2dx = 0;
        let p2dy = 0;
        const p2Speed = 5 * delta;

        if (this.input.isKeyDown('KeyW')) p2dy -= p2Speed;
        if (this.input.isKeyDown('KeyS')) p2dy += p2Speed;
        if (this.input.isKeyDown('KeyA')) p2dx -= p2Speed;
        if (this.input.isKeyDown('KeyD')) p2dx += p2Speed;

        if (p2dx !== 0 || p2dy !== 0) {
            const rot = Math.atan2(p2dy, p2dx) + Math.PI / 2;
            this.player2.move(p2dx, p2dy, rot);
        }

        // Tir P1 (Barre Espace)
        if (this.input.isKeyDown('Enter')) {
            this.shoot(this.player1);
        }

        // Tir P2 (Enter)
        if (this.input.isKeyDown('Space')) {
            this.shoot(this.player2);
        }

        // Mise à jour des lasers
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            laser.update(delta);

            if (laser.isOutOfBounds(this.app.screen.width, this.app.screen.height)) {
                this.app.stage.removeChild(laser);
                this.lasers.splice(i, 1);
            }
        }

        // Collision avec les bords de l'écran
        this.player1.contain(this.app.screen.width, this.app.screen.height);
        this.player2.contain(this.app.screen.width, this.app.screen.height);
    }

    private shoot(player: Player) {
        const now = Date.now();
        if (now - player.lastShotTime > player.shootInterval) {
            const laser = new Laser(player.x, player.y, player.rotation);
            this.lasers.push(laser);
            this.app.stage.addChild(laser);
            player.lastShotTime = now;
        }
    }
}
