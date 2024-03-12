import amqp from 'amqplib';



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
                'fanout', 
                { durable: false }
            );
        } catch (error) {
            console.error('Error connecting to AMQP :>> ', error.stack);
            throw error;
        }
    }


    async createQueueAndBind(queue, cb_consume) {
        try {
            await this.channel.assertQueue(queue, { exclusive: true });
            await this.channel.bindQueue(queue, 'messages', '');
            this.channel.consume(
                queue,
                (message) => {
                    cb_consume(queue, message)
                },
                { noAck: true }
            );
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
