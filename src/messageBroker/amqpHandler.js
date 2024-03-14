import amqp from 'amqplib';
import { WebSocket } from 'ws';
import { WSS } from '../wss.js';



class AMQPHandler {

    constructor() {
        this.connection = null;
        this.channel = null;
    }


    async connect() {
        try {
            this.connection = await amqp.connect(
                `amqp://${process.env.rabbitmq_username}:${process.env.rabbitmq_password}@${process.env.IP}:${process.env.AMQP_PORT}`
            );
            this.channel = await this.connection.createChannel();

            const exchange = 'messages';
            await this.channel.assertExchange(
                exchange, 
                'direct', 
                { durable: false }
            );
        } catch (error) {
            console.error('Error connecting to AMQP :>> ', error.stack);
            throw error;
        }
    }


    async createQueueAndBind(queueKey) {
        try {
            const assertedQueue = await this.channel.assertQueue('', { exclusive: true });

            const exchange = 'messages';
            await this.channel.bindQueue(assertedQueue.queue, exchange, queueKey);
            await this.channel.bindQueue(assertedQueue.queue, exchange, 'forBroadcast');
            
            this.channel.consume(
                assertedQueue.queue,
                (message) => {
                    if (message.content) {
                        const data = JSON.parse(message.content.toString());
    
                        for(const connectionId in WSS.connections) {
                            if(WSS.connections[connectionId].queueName === assertedQueue.queue && WSS.connections[connectionId].ws.readyState === WebSocket.OPEN) {
                                console.log('data :>> ', data);
                                WSS.connections[connectionId].ws.send(`${data.timestamp} : ${data.message}`);
                            }
                        }
                    }
                },
                { noAck: true }
            );

            return assertedQueue.queue;
        } catch (error) {
            console.error('Error creating queue and binding :>> ', error.stack);
            throw error;
        }
    }


    async close() {
        try {
            await this.channel.close();
            await this.connection.close();
        } catch (error) {
            console.error('Error closing AMQP connection :>> ', error.stack);
        }
    }
    
}



export {
    AMQPHandler
};
