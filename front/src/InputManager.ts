export class InputManager {
    public mouseX: number = 0;
    public mouseY: number = 0;
    private keys: Set<string> = new Set();

    constructor() {
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        window.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });
    }

    public isKeyDown(code: string): boolean {
        return this.keys.has(code);
    }
}
