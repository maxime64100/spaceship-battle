import * as PIXI from 'pixi.js';
import { Player } from './Player.ts';
import { Laser } from './Laser.ts';
import { InputManager } from './InputManager.ts';
import { Socket } from 'socket.io-client';

export class Game {
    private app: PIXI.Application;
    private players: Player[] = [];
    private lasers: Laser[] = [];
    private input: InputManager;
    private map: PIXI.Graphics;
    private socket: Socket | null = null;
    private matchID: string | null = null;
    private localSide: string | null = null;

    // UI Elements
    private uiContainer: PIXI.Container;
    private p1HealthBar: PIXI.Graphics;
    private p2HealthBar: PIXI.Graphics;
    private gameOverText: PIXI.Text | null = null;
    private isGameOver: boolean = false;

    // Colors
    private readonly COLOR_P1 = 0x00ffff; // Cyan
    private readonly COLOR_P2 = 0xff00ff; // Pink
    private readonly COLOR_GRID = 0x003366; // Dark blue grid

    constructor() {
        this.app = new PIXI.Application();
        this.input = new InputManager();
        this.map = new PIXI.Graphics();
        this.uiContainer = new PIXI.Container();
        this.p1HealthBar = new PIXI.Graphics();
        this.p2HealthBar = new PIXI.Graphics();
    }

    public setSocket(socket: Socket) {
        this.socket = socket;
    }

    public async init(matchID: string, localSide: string) {
        this.matchID = matchID;
        this.localSide = localSide;

        const container = document.getElementById('app');
        if (!container) return;

        await this.app.init({
            width: container.clientWidth,
            height: container.clientHeight,
            backgroundColor: 0x000000,
            antialias: true,
        });

        const existingCanvas = container.querySelector('canvas');
        if (existingCanvas) {
            existingCanvas.remove();
        }
        container.appendChild(this.app.canvas);

        this.app.stage.addChild(this.map);
        this.drawMap();

        // Créer les joueurs
        const p1 = new Player('player1', this.COLOR_P1);
        p1.x = this.app.screen.width / 4;
        p1.y = this.app.screen.height / 2;
        this.players.push(p1);
        this.app.stage.addChild(p1);

        const p2 = new Player('player2', this.COLOR_P2);
        p2.x = (this.app.screen.width / 4) * 3;
        p2.y = this.app.screen.height / 2;
        p2.rotation = Math.PI;
        this.players.push(p2);
        this.app.stage.addChild(p2);

        this.app.stage.addChild(this.uiContainer);
        this.uiContainer.addChild(this.p1HealthBar);
        this.uiContainer.addChild(this.p2HealthBar);

        this.app.ticker.add((ticker) => this.update(ticker.deltaTime));

        window.addEventListener('resize', () => {
            const newContainer = document.getElementById('app');
            if (newContainer) {
                this.app.renderer.resize(newContainer.clientWidth, newContainer.clientHeight);
                this.drawMap();
                this.drawUI();
            }
        });

        this.drawUI();

        if (this.socket) {
            this.socket.off('player-moved');
            this.socket.off('player-shot');

            this.socket.on('player-moved', (data: { side: string, x: number, y: number, rotation: number }) => {
                if (data.side !== this.localSide) {
                    const target = data.side === 'left' ? this.players.find(p => p.id === 'player1') : this.players.find(p => p.id === 'player2');
                    if (target) {
                        target.x = data.x;
                        target.y = data.y;
                        target.rotation = data.rotation;
                    }
                }
            });

            this.socket.on('player-shot', (data: { side: string }) => {
                if (data.side !== this.localSide) {
                    const target = data.side === 'left' ? this.players.find(p => p.id === 'player1') : this.players.find(p => p.id === 'player2');
                    if (target) {
                        this.shoot(target, data.side === 'left' ? this.COLOR_P1 : this.COLOR_P2);
                    }
                }
            });

            this.socket.on('health-update', (data: { side: string, health: number }) => {
                const targetId = data.side === 'left' ? 'player1' : 'player2';
                const target = this.players.find(p => p.id === targetId);
                if (target) {
                    target.health = data.health;
                    this.drawUI();
                    this.checkGameOver();
                }
            });
        }
    }

    private drawMap() {
        this.map.clear();
        this.map.rect(0, 0, this.app.screen.width, this.app.screen.height);
        this.map.fill(0x000000);

        const gridSize = 50;
        this.map.setStrokeStyle({ width: 1, color: this.COLOR_GRID, alpha: 0.5 });

        for (let x = 0; x <= this.app.screen.width; x += gridSize) {
            this.map.moveTo(x, 0);
            this.map.lineTo(x, this.app.screen.height);
        }

        for (let y = 0; y <= this.app.screen.height; y += gridSize) {
            this.map.moveTo(0, y);
            this.map.lineTo(this.app.screen.width, y);
        }
        this.map.stroke();
    }

    private drawUI() {
        const p1 = this.players.find(p => p.id === 'player1');
        const p2 = this.players.find(p => p.id === 'player2');

        const barWidth = 350;
        const barHeight = 20;
        const margin = 30;

        if (p1) {
            this.p1HealthBar.clear();
            this.p1HealthBar.setStrokeStyle({ width: 2, color: this.COLOR_P1 });
            this.p1HealthBar.rect(margin, margin, barWidth, barHeight);
            this.p1HealthBar.stroke();
            const p1LifeWidth = (p1.health / p1.maxHealth) * barWidth;
            if (p1LifeWidth > 0) {
                this.p1HealthBar.rect(margin, margin, p1LifeWidth, barHeight);
                this.p1HealthBar.fill({ color: this.COLOR_P1, alpha: 0.8 });
            }
        }

        if (p2) {
            this.p2HealthBar.clear();
            const p2X = this.app.screen.width - barWidth - margin;
            this.p2HealthBar.setStrokeStyle({ width: 2, color: this.COLOR_P2 });
            this.p2HealthBar.rect(p2X, margin, barWidth, barHeight);
            this.p2HealthBar.stroke();
            const p2LifeWidth = (p2.health / p2.maxHealth) * barWidth;
            if (p2LifeWidth > 0) {
                this.p2HealthBar.rect(p2X + (barWidth - p2LifeWidth), margin, p2LifeWidth, barHeight);
                this.p2HealthBar.fill({ color: this.COLOR_P2, alpha: 0.8 });
            }
        }
    }

    private update(delta: number) {
        if (this.isGameOver) return;

        const localSideId = this.localSide === 'left' ? 'player1' : 'player2';
        const localPlayer = this.players.find(p => p.id === localSideId);

        const speed = 6 * delta;

        if (localPlayer) {
            let dx = 0; let dy = 0;
            if (this.input.isKeyDown('KeyW') || this.input.isKeyDown('ArrowUp')) dy -= speed;
            if (this.input.isKeyDown('KeyS') || this.input.isKeyDown('ArrowDown')) dy += speed;
            if (this.input.isKeyDown('KeyA') || this.input.isKeyDown('ArrowLeft')) dx -= speed;
            if (this.input.isKeyDown('KeyD') || this.input.isKeyDown('ArrowRight')) dx += speed;

            if (dx !== 0 || dy !== 0) {
                localPlayer.move(dx, dy, Math.atan2(dy, dx) + Math.PI / 2);
                if (this.socket && this.matchID) {
                    this.socket.emit('input', {
                        matchID: this.matchID,
                        action: 'move',
                        x: localPlayer.x,
                        y: localPlayer.y,
                        rotation: localPlayer.rotation
                    });
                }
            }
            if (this.input.isKeyDown('Space') || this.input.isKeyDown('Enter')) {
                this.shoot(localPlayer, this.localSide === 'left' ? this.COLOR_P1 : this.COLOR_P2);
                if (this.socket && this.matchID) {
                    this.socket.emit('input', { matchID: this.matchID, action: 'shoot' });
                }
            }
            localPlayer.contain(this.app.screen.width, this.app.screen.height);
        }

        this.drawUI();

        // Lasers & Collisions
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            laser.update(delta);

            for (const player of this.players) {
                if (laser.ownerId !== player.id) {
                    const dx = laser.x - player.x;
                    const dy = laser.y - player.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 22) {
                        // Seul le tireur rapporte le coup pour éviter les doublons
                        if (this.socket && this.matchID && laser.ownerId === localSideId) {
                            this.socket.emit('input', {
                                matchID: this.matchID,
                                action: 'hit',
                                targetSide: player.id === 'player1' ? 'left' : 'right'
                            });
                        }

                        this.removeLaser(i);
                        break;
                    }
                }
            }

            if (laser && laser.isOutOfBounds(this.app.screen.width, this.app.screen.height)) {
                this.removeLaser(i);
            }
        }
    }

    private checkGameOver() {
        const p1 = this.players.find(p => p.id === 'player1');
        const p2 = this.players.find(p => p.id === 'player2');

        let winner = '';
        let winnerColor = '';
        if (p1 && p1.health <= 0) { winner = 'JOUEUR 2 (ROSE)'; winnerColor = '#ff00ff'; }
        else if (p2 && p2.health <= 0) { winner = 'JOUEUR 1 (CYAN)'; winnerColor = '#00ffff'; }

        if (winner) {
            this.isGameOver = true;
            this.showWinScreen(winner, winnerColor);
            setTimeout(() => {
                window.location.reload();
            }, 5000);
        }
    }

    private showWinScreen(winner: string, color: string) {
        const style = new PIXI.TextStyle({
            fontFamily: 'Courier New',
            fontSize: 60,
            fontWeight: 'bold',
            fill: color,
            stroke: { color: '#000000', width: 4 },
            dropShadow: { color: color, blur: 15, distance: 0 }
        });

        this.gameOverText = new PIXI.Text({ text: `${winner} WIN`, style });
        this.gameOverText.anchor.set(0.5);
        this.gameOverText.x = this.app.screen.width / 2;
        this.gameOverText.y = this.app.screen.height / 2;
        this.uiContainer.addChild(this.gameOverText);
    }

    private removeLaser(index: number) {
        const laser = this.lasers[index];
        if (laser) {
            this.app.stage.removeChild(laser);
            this.lasers.splice(index, 1);
        }
    }

    private shoot(player: Player, color: number) {
        const now = Date.now();
        if (now - player.lastShotTime > player.shootInterval) {
            const laser = new Laser(player.id, player.x, player.y, player.rotation, color);
            this.lasers.push(laser);
            this.app.stage.addChild(laser);
            player.lastShotTime = now;
        }
    }
}
