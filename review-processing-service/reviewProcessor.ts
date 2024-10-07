import db from "./utils/db";
import { FieldPacket, RowDataPacket } from "mysql2";
import redisClient from "./utils/redisClient";

interface Review extends RowDataPacket {
  rating: number;
}

const processReview = async (msg: { content: { toString: () => string } }) => {
  const message = JSON.parse(msg.content.toString());
  console.log(" [x] Received %s", msg.content.toString());

  try {
    const productId = message.productId;

    const connection = await db.getConnection();
    const [rows]: [Review[], FieldPacket[]] = await connection.query(
      "SELECT rating FROM reviews WHERE product_id = ?",
      [productId]
    );

    const ratings: number[] = rows ? rows.map((row) => row.rating) : [];

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : 0;

    await connection.query(
      "UPDATE products SET average_rating = ? WHERE id = ?",
      [averageRating, productId]
    );
    connection.release();

    await redisClient.set(
      `product:${productId}:average_rating`,
      averageRating.toString()
    );
  } catch (error) {
    console.error("Error processing message:", error);
  }
};

export default processReview;
