import { WebSocket, WebSocketServer } from 'ws';
import amqp from 'amqplib/callback_api.js';
import axios from 'axios';


const createWSS = (server) => {
    const wss = new WebSocketServer({ server });



    const connections = new Map();



    function handleWebSocketMessage(message, serverId) {
        try {
            axios.post('http://localhost:3000/api/postJson', { message: message.toString(), serverId }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

        } catch (error) {
            console.log('error.message handleWebSocketMessage :>> ', error.message);
        }
    }


    async function handleWebSocketConnection(serverId, ws) {

        try {
            

            await axios.post('http://localhost:3000/api/postJson', { message: `User (id:${serverId}) connected!`, serverId }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });


            amqp.connect(
                `amqp://${process.env.rabbitmq_username}:${process.env.rabbitmq_password}@${process.env.IP}:${process.env.AMQP_PORT}`,
                (amqpConnectionError, connection) => {
                    if (amqpConnectionError) {
                        throw amqpConnectionError;
                    }

                    connection.createChannel((creatingChannelError, channel) => {
                        if (creatingChannelError) {
                            throw creatingChannelError;
                        }

                        const exchange = 'messages';

                        channel.assertExchange(exchange, 'fanout', {
                            durable: false
                        });

                        channel.assertQueue(serverId, {
                            exclusive: true
                        }, (assertingQueueError, assertedQueue) => {
                            if (assertingQueueError) {
                                throw assertingQueueError;
                            }
                            channel.bindQueue(assertedQueue.queue, exchange, '');

                            channel.consume(assertedQueue.queue, (message) => {
                                if (message.content) {
                                    const data = JSON.parse(message.content.toString());

                                    connections.forEach((ws, id) => {
                                        if (id === assertedQueue.queue && ws.readyState === WebSocket.OPEN && id !== data.serverId) {
                                            ws.send(`Sent (${data.serverId}): ${data.message}`);
                                        }
                                    });
                                }
                            }, {
                                noAck: true
                            });
                        });


                        ws.on('message', (message) => {
                            handleWebSocketMessage(message, serverId);
                        });

                        ws.on('close', () => {
                            connections.delete(serverId);
                            channel.deleteQueue(serverId);
                            connection.close();
                        });


                    });
                }
            );
        } catch (error) {
            console.log('error.message handleWebSocketConnection :>> ', error.message);
        }
        return;
    }



    wss.on('connection', (ws) => {
        const serverId = Math.random().toString(36).substr(2, 9);
        console.log('serverId :>> ', serverId);

        connections.set(serverId, ws);

        handleWebSocketConnection(serverId, ws);

    });



    return wss;
};


export {
    createWSS
}

