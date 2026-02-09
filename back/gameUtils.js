const SHIP_WIDTH = 30;
const SHIP_HEIGHT = 30;
const DAMAGE = 10;
const CANVAS_WIDTH = 800;

function updateGameState(match) {
  // ---------------- INIT ----------------
  if (!match.gameState.players) {
    match.gameState.players = {};
    match.gameState.projectiles = [];

    const startPositions = [
      { x: 50, y: 100 },
      { x: 50, y: 200 },
      { x: 50, y: 300 },
    ];

    match.players.forEach((playerId, index) => {
      match.gameState.players[playerId] = {
        x: startPositions[index].x,
        y: startPositions[index].y,
        hp: 100,
      };
    });
  }

  // ---------------- PROJECTILES ----------------
  match.gameState.projectiles.forEach((proj, projIndex) => {
    proj.x += proj.speed;

    // Supprimer projectile hors écran
    if (proj.x > CANVAS_WIDTH || proj.x < 0) {
      match.gameState.projectiles.splice(projIndex, 1);
      return;
    }

    // ---------------- COLLISIONS ----------------
    for (const playerId of match.players) {
      if (playerId === proj.owner) continue;

      const ship = match.gameState.players[playerId];
      if (!ship || ship.hp <= 0) continue;

      const hit =
        proj.x >= ship.x &&
        proj.x <= ship.x + SHIP_WIDTH &&
        proj.y >= ship.y &&
        proj.y <= ship.y + SHIP_HEIGHT;

      if (hit) {
        ship.hp -= DAMAGE;
        if (ship.hp < 0) ship.hp = 0;

        match.gameState.projectiles.splice(projIndex, 1);
        break;
      }
    }
  });
}

module.exports = { updateGameState };
