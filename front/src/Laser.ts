import * as PIXI from 'pixi.js';

export class Laser extends PIXI.Graphics {
    public velocity: { x: number, y: number };
    public speed: number = 10;

    constructor(x: number, y: number, rotation: number) {
        super();

        // Dessiner le laser (un petit trait rouge)
        this.rect(-2, -10, 4, 20);
        this.fill(0xff0000);

        this.x = x;
        this.y = y;
        this.rotation = rotation;

        // Calculer la vélocité basée sur la rotation
        this.velocity = {
            x: Math.sin(rotation) * this.speed,
            y: -Math.cos(rotation) * this.speed
        };
    }

    public update(_delta: number) {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }

    public isOutOfBounds(width: number, height: number): boolean {
        return (
            this.x < -50 ||
            this.x > width + 50 ||
            this.y < -50 ||
            this.y > height + 50
        );
    }
}
