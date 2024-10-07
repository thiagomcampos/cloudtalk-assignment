import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.MYSQL_HOST || "mysql",
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

const pool = mysql.createPool(dbConfig);

const connectWithRetry = (
  maxAttempts: number,
  delay: number | undefined = 1000
) => {
  return new Promise<void>((resolve, reject) => {
    let attempts = 0;

    const attemptConnection = async () => {
      try {
        const connection = await pool.getConnection();
        console.log("Connected to the database!");
        connection.release();
        resolve();
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          console.error(
            "Failed to connect to the database after multiple attempts:",
            error
          );
          reject(error);
        } else {
          console.log(
            `Database connection attempt ${attempts} failed. Retrying in ${delay}ms...`
          );
          setTimeout(attemptConnection, delay);
          delay *= 2;
        }
      }
    };

    attemptConnection();
  });
};

connectWithRetry(5, 1000).catch((error) => {
  console.error("Failed to connect to the database:", error);
});

const db = {
  getConnection: () => pool.getConnection(),
};

export default db;
