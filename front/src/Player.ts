import * as PIXI from 'pixi.js';

export class Player extends PIXI.Container {
    private body: PIXI.Graphics;
    public lastShotTime: number = 0;
    public shootInterval: number = 250; // ms

    constructor(color: number = 0x00ff00) {
        super();

        this.body = new PIXI.Graphics();

        // Dessiner un triangle (vaisseau)
        this.body.poly([
            0, -20,   // Sommet
            15, 15,   // Bas droite
            -15, 15   // Bas gauche
        ]);
        this.body.fill(color);

        this.addChild(this.body);
    }

    public update(targetX: number, targetY: number) {
        // Suivre la position cible (souris)
        this.x += (targetX - this.x) * 0.1;
        this.y += (targetY - this.y) * 0.1;

        // Rotation vers la cible
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        this.rotation = Math.atan2(dy, dx) + Math.PI / 2;
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
