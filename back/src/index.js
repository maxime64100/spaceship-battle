const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

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
    res.send('Server is running');
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-lobby', (username) => {
        users[socket.id] = { username };
        console.log(`${username} joined the lobby`);
        
        io.emit('user-list', Object.values(users).map(u => u.username));
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            console.log(`${users[socket.id].username} disconnected`);
            delete users[socket.id];
            io.emit('user-list', Object.values(users).map(u => u.username));
        }
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
