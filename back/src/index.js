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
        
        io.emit('user-list', Object.keys(users).map(id => ({
            id: id,
            username: users[id].username
        })));
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

    socket.on('send-challenge', ({ targetSocketId }) => {
        const challenger = users[socket.id];
        const target = users[targetSocketId];

        if (challenger && target) {
            console.log(`${challenger.username} challenged ${target.username}`);
            io.to(targetSocketId).emit('receive-challenge', {
                fromUsername: challenger.username,
                fromSocketId: socket.id
            });
        }
    });

    socket.on('challenge-response', ({ challengerSocketId, accepted }) => {
        const challenger = users[challengerSocketId];
        const target = users[socket.id];

        if (accepted && challenger && target) {
            const matchID = `match_${challengerSocketId}_${socket.id}`;
            console.log(`Match started: ${matchID}`);

            matches[matchID] = {
                id: matchID,
                players: [challengerSocketId, socket.id],
                gameState: {
                    players: {
                        [challengerSocketId]: { x: 100, y: 300, side: 'left' },
                        [socket.id]: { x: 700, y: 300, side: 'right' }
                    },
                    projectiles: []
                }
            };

            socket.join(matchID);
            io.sockets.sockets.get(challengerSocketId)?.join(matchID);

            io.to(matchID).emit('match-start', {
                matchID,
                players: [
                    { id: challengerSocketId, username: challenger.username, side: 'left' },
                    { id: socket.id, username: target.username, side: 'right' }
                ]
            });
        } else if (!accepted && challenger) {
            io.to(challengerSocketId).emit('challenge-declined', {
                fromUsername: target ? target.username : 'Unknown'
            });
        }
    });

    socket.on('input', (data) => {
        const match = matches[data.matchID];
        if (!match || !match.players.includes(socket.id)) return;
    
        const playerShip = match.gameState.players[socket.id];
        if (!playerShip) return;
    
        const side = playerShip.side;

        if (data.action === 'move') {
            playerShip.x = data.x;
            playerShip.y = data.y;
            playerShip.rotation = data.rotation;
            
            // Broadcast to opponent
            socket.to(data.matchID).emit('player-moved', {
                side: side,
                x: data.x,
                y: data.y,
                rotation: data.rotation
            });
        } else if (data.action === 'shoot') {
            // Broadcast to opponent
            socket.to(data.matchID).emit('player-shot', { side: side });
            
            match.gameState.projectiles.push({
                x: playerShip.x + (side === 'left' ? 10 : -10),
                y: playerShip.y,
                owner: socket.id,
                speed: side === 'left' ? 10 : -10
            });
        }
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            console.log(`${users[socket.id].username} disconnected`);
            delete users[socket.id];
            io.emit('user-list', Object.keys(users).map(id => ({
                id: id,
                username: users[id].username
            })));
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
