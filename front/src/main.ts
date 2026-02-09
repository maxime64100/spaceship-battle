import { io } from 'socket.io-client';
import { Game } from './Game.ts';

const socket = io();
const game = new Game();

// DOM Elements
const lobbyContainer = document.getElementById('lobby-container') as HTMLElement;
const setupView = document.getElementById('setup-view') as HTMLElement;
const lobbyView = document.getElementById('lobby-view') as HTMLElement;
const usernameInput = document.getElementById('username-input') as HTMLInputElement;
const joinBtn = document.getElementById('join-btn') as HTMLButtonElement;
const startBtn = document.getElementById('start-btn') as HTMLButtonElement;
const userList = document.getElementById('user-list') as HTMLUListElement;

// Handle joining the lobby
joinBtn.onclick = () => {
    const username = usernameInput.value.trim();
    if (username) {
        socket.emit('join-lobby', username);
        setupView.classList.add('hidden');
        lobbyView.classList.remove('hidden');
    } else {
        alert('Please enter a pilot name!');
    }
};

// Handle starting the game
startBtn.onclick = () => {
    lobbyContainer.classList.add('hidden');
    game.init().catch(err => {
        console.error("Failed to initialize game:", err);
    });
};

// Listen for updates from the server
socket.on('user-list', (users: string[]) => {
    userList.innerHTML = '';
    users.forEach(username => {
        const li = document.createElement('li');
        li.textContent = username;
        userList.appendChild(li);
    });
});

socket.on('connect', () => {
    console.log('Connected to fleet command server');
});

socket.on('disconnect', () => {
    console.log('Lost contact with fleet command');
});
