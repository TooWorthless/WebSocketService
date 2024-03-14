import { WebSocket, WebSocketServer } from 'ws';
import { AMQPHandler } from './messageBroker/amqpHandler.js';
import { v4 as uuidv4 } from 'uuid';

class WSS {
    static connections = {};


    constructor(server) {
        this.wss = new WebSocketServer({ server });
    }


    run() {
        this.wss.on('connection', async (ws) => {
            
            const connectionId = uuidv4();
            console.log('connectionId :>> ', connectionId);

            this.#handleNewConnection(connectionId, ws);

            ws.on('close', () => {
                WSS.connections[connectionId].amqpHandler.close();
                delete WSS.connections[connectionId];
            });
    
        });
    }


    async #handleNewConnection(connectionId, ws) {
        try {
            const amqpHandler = new AMQPHandler();
            await amqpHandler.connect();
            const queueName = await amqpHandler.createQueueAndBind(connectionId);
    
            WSS.connections[connectionId] = {
                ws,
                queueName,
                amqpHandler
            };
        } catch (error) {
            console.log('error.message handleNewConnection :>> ', error.stack);
        }
    }
}


export {
    WSS
}

