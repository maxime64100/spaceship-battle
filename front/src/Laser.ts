import * as PIXI from 'pixi.js';

export class Laser extends PIXI.Graphics {
    public ownerId: string;
    public velocity: { x: number, y: number };
    public speed: number = 12;

    constructor(ownerId: string, x: number, y: number, rotation: number, color: number = 0xffffff) {
        super();
        this.ownerId = ownerId;

        // Corps du laser
        this.rect(-1.5, -12, 3, 24);
        this.fill({ color: color, alpha: 1 });

        // Lueur néon autour laser
        this.setStrokeStyle({ width: 4, color: color, alpha: 0.4 });
        this.rect(-2.5, -13, 5, 26);
        this.stroke();

        this.x = x;
        this.y = y;
        this.rotation = rotation;

        // Vélocité
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
