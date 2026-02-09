function updateGameState(match) {
  if (!match.gameState.players) {
    match.gameState.players = {
      [match.players[0]]: { x: 50, y: 100 },
      [match.players[1]]: { x: 50, y: 200 },
    };
    match.gameState.projectiles = [];
  }

  
  match.gameState.projectiles.forEach((proj, index) => {
    proj.x += proj.speed;
    if (proj.x > 800) {
      match.gameState.projectiles.splice(index, 1);
    }
  });
}

module.exports = { updateGameState };
