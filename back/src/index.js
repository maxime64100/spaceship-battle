const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { updateGameState } = require('./gameUtils');

const players = {};
const matches = {};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    }
});

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS_PER_MATCH = 3;

// ---------------- UTILS ----------------
function checkVictory(match) {
  const alivePlayers = Object.entries(match.gameState.players || {})
    .filter(([_, player]) => player.hp > 0)
    .map(([id]) => id);

  if (alivePlayers.length === 1) {
    return alivePlayers[0];
  }
  return null;
}

// ---------------- ROUTES ----------------
app.get('/', (req, res) => {
  res.send('Space Battleship server running');
});

// ---------------- SOCKET ----------------
io.on('connection', (socket) => {
  console.log(`Connecté : ${socket.id}`);

  // -------- REGISTER --------
  socket.on('register', (username) => {
    players[socket.id] = { username, status: 'lobby' };
    io.emit('playersUpdate', players);
  });

  // -------- INVITE --------
  socket.on('invite', (targetId) => {
    if (players[targetId] && players[socket.id].status === 'lobby') {
      io.to(targetId).emit('invitation', {
        from: socket.id,
        username: players[socket.id].username,
      });
    }
  });

  // -------- ACCEPT INVITE --------
  socket.on('acceptInvite', (fromId) => {
    // Trouver un match non plein
    let matchID = Object.keys(matches).find(
      id => matches[id].players.length < MAX_PLAYERS_PER_MATCH
    );

    // Sinon créer un nouveau match
    if (!matchID) {
      matchID = `match_${Date.now()}`;
      matches[matchID] = {
        players: [],
        spectators: [],
        gameState: {},
      };
    }

    const match = matches[matchID];

    if (!match.players.includes(fromId)) match.players.push(fromId);
    if (!match.players.includes(socket.id)) match.players.push(socket.id);

    // Join room + status
    match.players.forEach(id => {
      const s = io.sockets.sockets.get(id);
      if (s) s.join(matchID);
      if (players[id]) players[id].status = 'ingame';
    });

    io.to(matchID).emit('matchStart', {
      matchID,
      players: match.players,
    });

    io.emit('playersUpdate', players);
    console.log(`Match ${matchID} :`, match.players);
  });

  // -------- INPUT --------
  socket.on('input', ({ matchID, action }) => {
    const match = matches[matchID];
    if (!match || !match.players.includes(socket.id)) return;

    const ship = match.gameState.players?.[socket.id];
    if (!ship || ship.hp <= 0) return;

    const speed = 5;

    switch (action) {
      case 'up': ship.y -= speed; break;
      case 'down': ship.y += speed; break;
      case 'left': ship.x -= speed; break;
      case 'right': ship.x += speed; break;
      case 'shoot':
        match.gameState.projectiles.push({
          x: ship.x + 10,
          y: ship.y + 15,
          speed: 10,
          owner: socket.id,
        });
        break;
    }
  });

  // -------- DISCONNECT --------
  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('playersUpdate', players);
  });
});

// ---------------- GAME LOOP ----------------
const FPS = 30;
setInterval(() => {
  for (const matchID in matches) {
    const match = matches[matchID];

    if (match.players.length >= 2) {
      updateGameState(match);

      const winnerId = checkVictory(match);
      if (winnerId) {
        io.to(matchID).emit('gameOver', { winner: winnerId });

        match.players.forEach(id => {
          if (players[id]) players[id].status = 'lobby';
        });

        io.emit('playersUpdate', players);
        delete matches[matchID];
        continue;
      }

      io.to(matchID).emit('gameState', match.gameState);
    }
  }
}, 1000 / FPS);

// ---------------- START ----------------
server.listen(PORT, () =>
  console.log(`Server listening on port ${PORT}`)
);
