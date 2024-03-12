import { WebSocket, WebSocketServer } from 'ws';
import { AMQPHandler } from './messageBroker/amqpHandler.js';
import axios from 'axios';


const createWSS = (server) => {
    const wss = new WebSocketServer({ server });


    const connections = new Map();


    function saveWssConnection(ws) {
        const id = Math.random().toString(36).substr(2, 9);

        connections.set(id, ws);

        return id;
    }


    async function handleWebSocketMessage(serverId, message) {
        try {
            await axios.post('http://localhost:3000/api/postJson', { message: message.toString(), serverId }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

        } catch (error) {
            console.log('error.message handleWebSocketMessage :>> ', error.stack);
        }
    }


    async function handleWebSocketConnection(serverId) {
        try {
            const amqpHandler = new AMQPHandler();
            await amqpHandler.connect();

            await amqpHandler.createQueueAndBind(serverId, (queue, message = '') => {
                if (message.content) {
                    const data = JSON.parse(message.content.toString());

                    connections.forEach((ws, id) => {
                        if (id === queue && ws.readyState === WebSocket.OPEN && id !== data.serverId) {
                            ws.send(`Sent (${data.serverId}): ${data.message}`);
                        }
                    });
                }
            });

            await axios.post('http://localhost:3000/api/postJson', { message: `User connected!`, serverId }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return amqpHandler;
        } catch (error) {
            console.log('error.message handleWebSocketConnection :>> ', error.stack);
        }
        return;
    }


    wss.on('connection', async (ws) => {
        const serverId = saveWssConnection(ws);

        const amqpHandler = await handleWebSocketConnection(serverId);
        if(!amqpHandler) return;

        ws.on('message', (message) => {
            handleWebSocketMessage(serverId, message);
        });

        ws.on('close', () => {
            connections.delete(serverId);
            amqpHandler.close();
        });

    });


    return wss;
};


export {
    createWSS
}

