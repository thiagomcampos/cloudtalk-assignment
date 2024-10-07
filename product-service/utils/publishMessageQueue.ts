import amqp from "amqplib/callback_api";

const rabbitMQHost = process.env.RABBITMQ_HOST || "rabbitmq";
const queueName = process.env.RABBITMQ_QUEUE || "review_queue";

const publishMessage = async (message: any) => {
  return new Promise<void>((resolve, reject) => {
    amqp.connect(
      `amqp://${rabbitMQHost}`,
      (
        error0: any,
        connection: {
          createChannel: (arg0: (error1: any, channel: any) => void) => void;
        }
      ) => {
        if (error0) {
          reject(error0);
          return;
        }
        connection.createChannel((error1, channel) => {
          if (error1) {
            reject(error1);
            return;
          }

          const msg = JSON.stringify(message);

          channel.sendToQueue(queueName, Buffer.from(msg));
          console.log(" [x] Sent %s", msg);
          resolve();
        });
      }
    );
  });
};

export default publishMessage;
