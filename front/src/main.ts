import { io } from 'socket.io-client';
import { Game } from './Game.ts';

const socket = io();
const game = new Game();
game.setSocket(socket);

// DOM Elements
const lobbyContainer = document.getElementById('lobby-container') as HTMLElement;
const setupView = document.getElementById('setup-view') as HTMLElement;
const lobbyView = document.getElementById('lobby-view') as HTMLElement;
const usernameInput = document.getElementById('username-input') as HTMLInputElement;
const joinBtn = document.getElementById('join-btn') as HTMLButtonElement;
const userList = document.getElementById('user-list') as HTMLUListElement;
const chatMessages = document.getElementById('chat-messages') as HTMLDivElement;
const chatInput = document.getElementById('chat-input') as HTMLInputElement;
const sendMsgBtn = document.getElementById('send-msg-btn') as HTMLButtonElement;


const challengeModal = document.getElementById('challenge-modal') as HTMLDivElement;
const challengeFrom = document.getElementById('challenge-from') as HTMLParagraphElement;
const acceptBtn = document.getElementById('accept-challenge-btn') as HTMLButtonElement;
const declineBtn = document.getElementById('decline-challenge-btn') as HTMLButtonElement;
const toast = document.getElementById('notification-toast') as HTMLDivElement;
const toastText = document.getElementById('toast-text') as HTMLParagraphElement;

let currentChallengerId: string | null = null;

const showToast = (text: string) => {
    toastText.textContent = text;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
};

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


acceptBtn.onclick = () => {
    if (currentChallengerId) {
        socket.emit('challenge-response', { challengerSocketId: currentChallengerId, accepted: true });
        challengeModal.classList.add('hidden');
        currentChallengerId = null;
    }
};

declineBtn.onclick = () => {
    if (currentChallengerId) {
        socket.emit('challenge-response', { challengerSocketId: currentChallengerId, accepted: false });
        challengeModal.classList.add('hidden');
        currentChallengerId = null;
    }
};

// Listen for updates from the server
socket.on('user-list', (users: { id: string, username: string }[]) => {
    userList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user.username;
        
        // Don't show challenge button for self
        if (user.id !== socket.id) {
            const btn = document.createElement('button');
            btn.textContent = 'CHALLENGE';
            btn.className = 'challenge-btn';
            btn.onclick = () => {
                socket.emit('send-challenge', { targetSocketId: user.id });
                showToast(`CHALLENGE SENT TO ${user.username.toUpperCase()}`);
            };
            li.appendChild(btn);
        } else {
            const selfTag = document.createElement('span');
            selfTag.textContent = '(YOU)';
            selfTag.style.color = '#555';
            selfTag.style.fontSize = '0.7rem';
            li.appendChild(selfTag);
        }
        
        userList.appendChild(li);
    });
});

socket.on('receive-challenge', (data: { fromUsername: string, fromSocketId: string }) => {
    currentChallengerId = data.fromSocketId;
    challengeFrom.textContent = `Incoming duel request from Pilot ${data.fromUsername}`;
    challengeModal.classList.remove('hidden');
});

socket.on('challenge-declined', (data: { fromUsername: string }) => {
    showToast(`${data.fromUsername.toUpperCase()} DECLINED THE CHALLENGE`);
});

socket.on('match-start', (data: { matchID: string, players: { id: string, username: string, side: string }[] }) => {
    lobbyContainer.classList.add('hidden');
    

    const localPlayer = data.players.find(p => p.id === socket.id);
    const side = localPlayer ? localPlayer.side : 'left';
    
    game.init(data.matchID, side).catch(err => {
        console.error("Failed to initialize game:", err);
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
