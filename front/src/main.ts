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
const chatMessages = document.getElementById('chat-messages') as HTMLDivElement;
const chatInput = document.getElementById('chat-input') as HTMLInputElement;
const sendMsgBtn = document.getElementById('send-msg-btn') as HTMLButtonElement;

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

// Handle sending chat messages
const sendMessage = () => {
    const message = chatInput.value.trim();
    if (message) {
        socket.emit('chat-message', message);
        chatInput.value = '';
    }
};

sendMsgBtn.onclick = sendMessage;
chatInput.onkeydown = (e) => {
    if (e.key === 'Enter') sendMessage();
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

socket.on('new-message', (data: { username: string, message: string, time: string }) => {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    msgDiv.innerHTML = `
        <span class="time">[${data.time}]</span>
        <span class="user">${data.username}:</span>
        <span class="text">${data.message}</span>
    `;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('connect', () => {
    console.log('Connected to fleet command server');
});

socket.on('disconnect', () => {
    console.log('Lost contact with fleet command');
});
