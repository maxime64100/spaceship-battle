import * as PIXI from 'pixi.js';

export class Player extends PIXI.Container {
    public id: string;
    private body: PIXI.Graphics;

    public maxHealth: number = 100;
    public health: number = 100;

    public lastShotTime: number = 0;
    public shootInterval: number = 250; // ms

    constructor(id: string, color: number = 0x00ff00) {
        super();
        this.id = id;

        this.body = new PIXI.Graphics();

        // Vaisseau du joueur (style Neon TRON)
        this.body.setStrokeStyle({ width: 3, color: color });
        this.body.poly([
            0, -22,   // Sommet
            18, 16,   // Bas droite
            0, 4,     // Creux arrière
            -18, 16   // Bas gauche
        ]);
        this.body.closePath();
        this.body.stroke();

        // Cœur néon intérieur avec alpha
        this.body.circle(0, 0, 5);
        this.body.fill({ color: color, alpha: 0.4 });

        this.addChild(this.body);
    }

    public takeDamage(amount: number) {
        this.health = Math.max(0, this.health - amount);
    }

    public move(dx: number, dy: number, rotation: number) {
        this.x += dx;
        this.y += dy;
        this.rotation = rotation;
    }

    public contain(width: number, height: number) {
        const margin = 20;
        if (this.x < margin) this.x = margin;
        if (this.x > width - margin) this.x = width - margin;
        if (this.y < margin) this.y = margin;
        if (this.y > height - margin) this.y = height - margin;
    }
}
