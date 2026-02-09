const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { updateGameState } = require('./gameUtils');

const players = {}; 
const matches = {}; 

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Space Battleship server is running');
});

// ---------------- SOCKET.IO ----------------
io.on('connection', (socket) => {
  console.log(`Un joueur est connecté : ${socket.id}`);

  // ---------------- INSCRIPTION ----------------
  socket.on('register', (username) => {
    players[socket.id] = { username, status: 'lobby' };
    io.emit('playersUpdate', players);
  });

  // ---------------- INVITATIONS ----------------
  socket.on('invite', (targetId) => {
    if (players[targetId] && players[socket.id].status === 'lobby') {
      io.to(targetId).emit('invitation', { from: socket.id, username: players[socket.id].username });
    }
  });

  socket.on('acceptInvite', (fromId) => {
    const matchID = `match_${Date.now()}`;
    matches[matchID] = { players: [fromId, socket.id], spectators: [], gameState: {} };

    io.sockets.sockets.get(fromId).join(matchID);
    socket.join(matchID);

    players[fromId].status = 'ingame';
    players[socket.id].status = 'ingame';

    io.to(matchID).emit('matchStart', { matchID, players: matches[matchID].players });
    io.emit('playersUpdate', players);
  });

  // ---------------- INPUT DES JOUEURS ----------------
  socket.on('input', (data) => {
    const match = matches[data.matchID];
    if (!match || !match.players.includes(socket.id)) return;

    const playerShip = match.gameState.players[socket.id];
    if (!playerShip) return;

    const speed = 5;
    switch(data.action) {
      case 'up': playerShip.y -= speed; break;
      case 'down': playerShip.y += speed; break;
      case 'left': playerShip.x -= speed; break;
      case 'right': playerShip.x += speed; break;
      case 'shoot':
        match.gameState.projectiles.push({
          x: playerShip.x + 10,
          y: playerShip.y,
          owner: socket.id,
          speed: 10
        });
        break;
    }
  });

  // ---------------- DECONNEXION ----------------
  socket.on('disconnect', () => {
    if (players[socket.id]) {
      delete players[socket.id];
      io.emit('playersUpdate', players);
    }
  });
});

// ---------------- GAME LOOP 30FPS ----------------
const FPS = 30;
setInterval(() => {
  for (const matchID in matches) {
    const match = matches[matchID];
    if (match.players.length === 2) {
      updateGameState(match);
      io.to(matchID).emit('gameState', match.gameState);
    }
  }
}, 1000 / FPS);

server.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));
