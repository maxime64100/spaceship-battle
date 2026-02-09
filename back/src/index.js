const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { updateGameState } = require('../gameUtils');

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

const users = {};

app.get('/', (req, res) => {
  res.send('Space Battleship server is running');
});


io.on('connection', (socket) => {
  console.log(`Un joueur est connecté : ${socket.id}`);

    socket.on('join-lobby', (username) => {
        users[socket.id] = { username };
        console.log(`${username} joined the lobby`);
        
        io.emit('user-list', Object.values(users).map(u => u.username));
    });

    socket.on('chat-message', (message) => {
        const user = users[socket.id];
        if (user) {
            io.emit('new-message', {
                username: user.username,
                message: message,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        }
    });

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

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            console.log(`${users[socket.id].username} disconnected`);
            delete users[socket.id];
            io.emit('user-list', Object.values(users).map(u => u.username));
        }

        if (players[socket.id]) {
            delete players[socket.id];
            io.emit('playersUpdate', players);
        }
        console.log('User disconnected:', socket.id);
    });
});


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
