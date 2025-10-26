const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 8080 });

const rooms = new Map();

console.log('WebSocket server started on port 8080');

const broadcastToRoom = (roomName, message) => {
    const room = rooms.get(roomName);
    if (room) {
        const serializedMessage = JSON.stringify(message);
        room.clients.forEach(client => {
            if (client.readyState === client.OPEN) {
                client.send(serializedMessage);
            }
        });
    }
};

const broadcastUserList = (roomName) => {
    const room = rooms.get(roomName);
    if (room) {
        const users = Array.from(room.clients).map(client => client.userEmail);
        broadcastToRoom(roomName, { type: 'user-list-update', payload: { users } });
    }
}

wss.on('connection', ws => {
    console.log('Client connected');
    ws.room = null;
    ws.userEmail = null;

    ws.on('message', messageBuffer => {
        const message = messageBuffer.toString();
        try {
            const data = JSON.parse(message);

            switch (data.type) {
                case 'join': {
                    const { room, email } = data.payload;
                    if (ws.room && rooms.has(ws.room)) {
                        rooms.get(ws.room).clients.delete(ws);
                        broadcastUserList(ws.room);
                    }

                    if (!rooms.has(room)) {
                        rooms.set(room, { clients: new Set(), typingUsers: new Set() });
                    }
                    rooms.get(room).clients.add(ws);
                    ws.room = room;
                    ws.userEmail = email;
                    console.log(`Client ${email} joined room: ${room}`);
                    broadcastUserList(room);
                    break;
                }
                case 'message': {
                    if (ws.room) {
                        broadcastToRoom(ws.room, { type: 'message', payload: data.payload });
                    }
                    break;
                }
                case 'start-typing': {
                    if (ws.room && ws.userEmail) {
                        const room = rooms.get(ws.room);
                        room.typingUsers.add(ws.userEmail);
                        broadcastToRoom(ws.room, { type: 'typing-update', payload: { typingUsers: Array.from(room.typingUsers) } });
                    }
                    break;
                }
                case 'stop-typing': {
                    if (ws.room && ws.userEmail) {
                        const room = rooms.get(ws.room);
                        room.typingUsers.delete(ws.userEmail);
                        broadcastToRoom(ws.room, { type: 'typing-update', payload: { typingUsers: Array.from(room.typingUsers) } });
                    }
                    break;
                }
            }
        } catch (e) {
            console.error('Failed to process message:', e);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        if (ws.room && rooms.has(ws.room)) {
            const roomData = rooms.get(ws.room);
            roomData.clients.delete(ws);
            roomData.typingUsers.delete(ws.userEmail);
            if (roomData.clients.size === 0) {
                rooms.delete(ws.room);
                console.log(`Room ${ws.room} is now empty and has been removed.`);
            } else {
                 broadcastUserList(ws.room);
                 broadcastToRoom(ws.room, { type: 'typing-update', payload: { typingUsers: Array.from(roomData.typingUsers) } });
            }
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});
