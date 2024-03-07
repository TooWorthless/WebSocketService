import { WebSocket, WebSocketServer } from 'ws';


const createWSS = (server) => {
    const wss = new WebSocketServer({ server });



    const connections = new Map();



    function handleWebSocketMessage(message, serverId) {
        connections.forEach((ws, id) => {
            if (id !== serverId && ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }



    wss.on('connection', (ws) => {
        const serverId = Math.random().toString(36).substr(2, 9);

        console.log('serverId :>> ', serverId);
    
        connections.set(serverId, ws);
    
        ws.on('message', (message) => {
            handleWebSocketMessage(message, serverId);
        });
    
        ws.on('close', () => {
            connections.delete(serverId);
        });
    });



    return wss;
};


export {
    createWSS
}

