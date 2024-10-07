import amqp, { Connection } from "amqplib/callback_api";

const rabbitMQHost = process.env.RABBITMQ_HOST || "rabbitmq";
const queueName = process.env.RABBITMQ_QUEUE || "review_queue";

const connectWithRetry = (
  maxAttempts: number,
  delay: number | undefined = 1000
) => {
  return new Promise<Connection>((resolve, reject) => {
    let attempts = 0;

    const attemptConnection = () => {
      amqp.connect(
        `amqp://${rabbitMQHost}`,
        (error0: any, connection: Connection) => {
          if (error0) {
            attempts++;
            if (attempts >= maxAttempts) {
              console.error(
                "Failed to connect to RabbitMQ after multiple attempts:",
                error0
              );
              reject(error0);
            } else {
              console.log(
                `RabbitMQ connection attempt ${attempts} failed. Retrying in ${delay}ms...`
              );
              setTimeout(attemptConnection, delay);
              delay *= 2;
            }
          } else {
            console.log("Connected to RabbitMQ");
            resolve(connection);
          }
        }
      );
    };

    attemptConnection();
  });
};

const consumeMessages = async (processMessage: (arg0: any) => any) => {
  const connection = await connectWithRetry(5, 1000);

  return new Promise<void>((resolve, reject) => {
    connection.createChannel(
      (
        error1: any,
        channel: {
          assertQueue: (arg0: string, arg1: { durable: boolean }) => void;
          consume: (
            arg0: string,
            arg1: (msg: any) => Promise<void>,
            arg2: { noAck: boolean }
          ) => void;
        }
      ) => {
        if (error1) {
          console.error({ error1 });
          reject(error1);
          return;
        }

        channel.assertQueue(queueName, { durable: false });

        console.log(
          " [*] Waiting for messages in %s. To exit press CTRL+C",
          queueName
        );

        channel.consume(
          queueName,
          async (msg) => {
            try {
              await processMessage(msg);
            } catch (error) {
              console.error("Error processing message:", error);
            }
          },
          { noAck: true }
        );

        resolve();
      }
    );
  });
};

export default consumeMessages;
